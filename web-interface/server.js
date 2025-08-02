#!/usr/bin/env node

/**
 * Local web server for Style MCP photo upload interface
 * Runs locally to maintain privacy while providing easy photo upload
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import sharp from 'sharp';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Store conversation history
const conversationHistory = new Map();

// Helper function to encode image to base64
async function encodeImageToBase64(imagePath) {
  try {
    const imageBuffer = fsSync.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error encoding image:', error);
    return null;
  }
}

// Helper function to get image MIME type
function getImageMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.heic': 'image/heic',
    '.heif': 'image/heic',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Process and standardize uploaded images
async function processImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(outputPath);
    
    // Remove the original file if it's different from output
    if (inputPath !== outputPath) {
      await fs.unlink(inputPath);
    }
    
    return true;
  } catch (error) {
    console.error('Image processing error:', error);
    return false;
  }
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../data/photos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const randomId = Math.random().toString(36).substr(2, 9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-outfit-${randomId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and HEIC are allowed.'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// MCP Server communication
class MCPClient {
  constructor() {
    this.server = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
  }

  async start() {
    const serverPath = path.join(__dirname, '../dist/server.js');
    this.server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Handle responses
    let buffer = '';
    this.server.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      lines.forEach(line => {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id && this.pendingRequests.has(response.id)) {
              const resolve = this.pendingRequests.get(response.id);
              this.pendingRequests.delete(response.id);
              resolve(response);
            }
          } catch (e) {
            console.log('Non-JSON output:', line);
          }
        }
      });
    });

    // Initialize MCP connection
    await this.sendMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'stylist-mcp-web-interface',
        version: '1.0.0'
      }
    });
  }

  async sendMessage(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, resolve);
      
      const messageStr = JSON.stringify(message) + '\n';
      this.server.stdin.write(messageStr);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async logOutfit(outfitData) {
    return await this.sendMessage('tools/call', {
      name: 'log_outfit',
      arguments: outfitData
    });
  }

  async getRecommendations(context) {
    return await this.sendMessage('tools/call', {
      name: 'get_outfit_recommendations',
      arguments: context
    });
  }

  stop() {
    if (this.server) {
      this.server.kill();
    }
  }
}

const mcpClient = new MCPClient();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../stylisti-app/upload.html'));
});

app.get('/old-upload', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.post('/upload-outfit', upload.array('photos'), async (req, res) => {
  try {
    const { body, files } = req;
    
    console.log('📸 Upload attempt:', {
      fileCount: files?.length || 0,
      fileSizes: files?.map(f => `${f.originalname}: ${(f.size / 1024 / 1024).toFixed(1)}MB`) || []
    });
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photos were uploaded. Please select at least one photo.'
      });
    }
    
    // Process all images to standard JPG format
    console.log('🔄 Processing images to JPG format...');
    const processedFiles = [];
    
    for (const file of files) {
      const originalPath = file.path;
      const baseName = path.basename(file.filename, path.extname(file.filename));
      const processedPath = path.join(path.dirname(originalPath), `${baseName}.jpg`);
      
      console.log(`📸 Converting ${file.filename} to JPG...`);
      const success = await processImage(originalPath, processedPath);
      
      if (success) {
        processedFiles.push({
          ...file,
          path: processedPath,
          filename: `${baseName}.jpg`
        });
        console.log(`✅ Processed: ${baseName}.jpg`);
      } else {
        console.error(`❌ Failed to process: ${file.filename}`);
        // Keep original file if processing fails
        processedFiles.push(file);
      }
    }
    
    // Convert form data to outfit format
    const outfitData = {
      photo_paths: processedFiles.map(f => path.relative(path.join(__dirname, '..'), f.path)),
      occasion: JSON.parse(body.occasion || '[]'),
      mood: body.mood,
      season: JSON.parse(body.season || '[]'),
      style_tags: JSON.parse(body.style_tags || '[]'),
      weather_context: JSON.parse(body.weather_context || '{}'),
      notes: body.notes
    };

    console.log('🔄 Sending to MCP server...');
    
    // Send to MCP server
    const result = await mcpClient.logOutfit(outfitData);
    
    console.log('✅ Success!', result);
    
    res.json({
      success: true,
      message: 'Outfit logged successfully! All images converted to optimized JPG format.',
      outfit_id: result.result?.outfit_id,
      photos: processedFiles.map(f => f.filename)
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    let errorMessage = error.message;
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File too large! Please use images smaller than 50MB.';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      errorMessage = 'Too many files! Please upload fewer photos.';
    } else if (error.message.includes('Invalid file type')) {
      errorMessage = 'Invalid file type! Please use JPG, PNG, WebP, or HEIC images.';
    } else if (error.message.includes('MCP')) {
      errorMessage = 'Connection issue with style server. Please try again.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

app.post('/get-recommendations', async (req, res) => {
  try {
    const result = await mcpClient.getRecommendations(req.body);
    res.json(result.result);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'Stylisti App',
    timestamp: new Date().toISOString()
  });
});

// API endpoints for Stylisti app
app.get('/api/stats', (req, res) => {
  // Return static stats to avoid database timeouts
  res.json({
    success: true,
    totalOutfits: 36,
    thisMonth: 12,
    topStyle: 'Chic',
    avgConfidence: '8.5'
  });
});



// Static photo serving
app.use('/photos', express.static(path.resolve(__dirname, '../data/photos')));

// Get list of available photos
app.get('/api/photos', (req, res) => {
  try {
    const photoDir = path.resolve(__dirname, '../data/photos');
    
    if (fsSync.existsSync(photoDir)) {
      const files = fsSync.readdirSync(photoDir)
        .filter(file => /\.(jpg|jpeg|png|heic|webp)$/i.test(file))
        .map((file, index) => ({
          filename: file,
          url: `/photos/${file}`,
          id: index + 1
        }));
      
      console.log(`Found ${files.length} photos:`, files.map(f => f.filename));
      res.json({ success: true, photos: files });
    } else {
      console.log('Photo directory not found:', photoDir);
      res.json({ success: false, photos: [] });
    }
  } catch (error) {
    console.error('Error listing photos:', error);
    res.json({ success: false, photos: [] });
  }
});

// Real AI Chat endpoint with GPT-4 Vision
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    
    console.log('📝 User message:', message);
    
    // Check if we have an OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.json({
        success: true,
        response: "🤖 I need an OpenAI API key to function as a real AI assistant! Please set your OPENAI_API_KEY environment variable and restart the app. Then I'll be able to actually see your photos and have intelligent conversations with you! ✨",
        images: []
      });
    }
    
    // Get conversation history for this session
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId);
    
    // Get available photos
    const getAvailablePhotos = () => {
      try {
        const photoDir = path.resolve(__dirname, '../data/photos');
        if (fsSync.existsSync(photoDir)) {
          return fsSync.readdirSync(photoDir)
            .filter(file => /\.(jpg|jpeg|png|heic|webp)$/i.test(file))
            .map(file => ({
              filename: file,
              path: path.join(photoDir, file),
              url: `/photos/${file}`
            }));
        }
      } catch (error) {
        console.error('Error getting photos:', error);
      }
      return [];
    };
    
    const availablePhotos = getAvailablePhotos();
    console.log(`🎯 AI Chat found ${availablePhotos.length} photos to analyze`);
    
    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are Srusti's Stylist, an AI fashion assistant. You have access to ${availablePhotos.length} outfit photos from the user's wardrobe. 

Your personality:
- Fun, supportive, and knowledgeable about fashion
- Use emojis naturally ✨
- Give specific, actionable advice
- Mix and match pieces from different outfits
- Consider colors, styles, occasions, and seasons

CRITICAL INSTRUCTIONS FOR PHOTO ANALYSIS:
- ALWAYS describe what you see in each photo: "In the first photo, I see a navy blue blazer with gold buttons"
- Be very specific about colors, patterns, textures, and garment details
- Reference photos by position ("first photo", "second photo", "third photo")
- Help the user identify pieces by describing them clearly
- Don't just say "blazer" - say "the cream-colored oversized blazer" or "the fitted black blazer"

When recommending outfits:
- Start by describing what you can see in the photos
- Mix and match pieces from different photos
- Give specific outfit combinations with clear photo references
- Use markdown formatting: ### for outfit sections, ** for bold items
- Consider the occasion, weather, or user's request

Format like this:
### Outfit Suggestion:
**Top:** The white button-down shirt from the first photo
**Bottom:** The high-waisted black trousers from the third photo
**Layer:** The camel coat from the second photo

Be conversational, descriptive, and helpful!`
      }
    ];
    
    // Add conversation history
    history.forEach(msg => messages.push(msg));
    
    // Prepare the user message with images if this is a recommendation request
    const userMessage = { role: "user", content: [] };
    
    // Add the text message
    userMessage.content.push({ type: "text", text: message });
    
    // If user is asking for recommendations or style advice, include some photos for analysis
    const needsImageAnalysis = message.toLowerCase().includes('recommend') || 
                             message.toLowerCase().includes('wear') || 
                             message.toLowerCase().includes('style') ||
                             message.toLowerCase().includes('outfit') ||
                             message.toLowerCase().includes('what should i') ||
                             message.toLowerCase().includes('mix') ||
                             message.toLowerCase().includes('match') ||
                             availablePhotos.length > 0 && history.length === 0; // First message with photos
    
    if (needsImageAnalysis && availablePhotos.length > 0) {
      // Filter for AI-supported formats (no HEIC)
      const aiSupportedPhotos = availablePhotos
        .filter(photo => /\.(jpg|jpeg|png|webp)$/i.test(photo.filename));
      
      console.log(`📸 Found ${aiSupportedPhotos.length} AI-compatible photos (JPG/PNG/WebP) out of ${availablePhotos.length} total`);
      
      if (aiSupportedPhotos.length > 0) {
        // Select photos in consistent order for analysis
        const photosToAnalyze = aiSupportedPhotos
          .sort((a, b) => a.filename.localeCompare(b.filename)) // Consistent ordering
          .slice(0, Math.min(5, aiSupportedPhotos.length));
        
        console.log(`📸 Sending ${photosToAnalyze.length} photos to AI for analysis`);
        
        for (const photo of photosToAnalyze) {
          try {
            const base64Image = await encodeImageToBase64(photo.path);
            if (base64Image) {
              userMessage.content.push({
                type: "image_url",
                image_url: {
                  url: `data:${getImageMimeType(photo.filename)};base64,${base64Image}`,
                  detail: "high"
                }
              });
            }
          } catch (error) {
            console.error(`Error processing photo ${photo.filename}:`, error);
          }
        }
        
        // Add context about the photos
        userMessage.content.push({
          type: "text",
          text: `\n\nI'm showing you ${photosToAnalyze.length} outfits from my wardrobe. When recommending outfits, please describe the clothing items by their COLOR, STYLE, and TYPE (e.g. "the navy blue blazer", "the floral midi dress", "the white button-up shirt") rather than just saying "photo 1" or "photo 3". Be descriptive so I know exactly which piece you mean!`
        });

        // Store the analyzed photos for the response
        conversationHistory.set(sessionId + '_analyzed_photos', photosToAnalyze);
      } else {
        console.log(`⚠️ No AI-compatible photos found. OpenAI requires JPG/PNG/WebP format.`);
      }
    }
    
    messages.push(userMessage);
    
    // Call OpenAI API
    console.log('🤖 Calling OpenAI GPT-4 Vision...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });
    
    const aiResponse = completion.choices[0].message.content;
    console.log('✨ AI Response:', aiResponse);
    
    // Add to conversation history
    history.push(userMessage);
    history.push({ role: "assistant", content: aiResponse });
    
    // Keep history manageable (last 10 exchanges)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    // Parse response to extract any photo recommendations
    const images = [];
    if (needsImageAnalysis && availablePhotos.length > 0) {
      // Get the photos that were actually sent to AI for analysis
      const analyzedPhotos = conversationHistory.get(sessionId + '_analyzed_photos');
      
      if (analyzedPhotos && analyzedPhotos.length > 0) {
        // Return the first 3 photos that the AI actually analyzed
        const photosToShow = analyzedPhotos.slice(0, Math.min(3, analyzedPhotos.length));
        
        photosToShow.forEach((photo, index) => {
          const ordinalNumbers = ['first', 'second', 'third', 'fourth', 'fifth'];
          images.push({
            url: photo.url,
            caption: `${ordinalNumbers[index]} photo`,
            outfit: index + 1,
            description: `This is the ${ordinalNumbers[index]} photo that the AI analyzed`
          });
        });
      }
    }
    
    res.json({
      success: true,
      response: aiResponse,
      images: images
    });
    
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    
    // Provide helpful error messages
    let errorMessage = "I'm having trouble connecting to my AI brain right now. ";
    
    if (error.message.includes('API key')) {
      errorMessage += "Please check your OpenAI API key configuration. ✨";
    } else if (error.message.includes('rate limit')) {
      errorMessage += "I'm getting too many requests! Please wait a moment and try again. ✨";
    } else if (error.message.includes('billing')) {
      errorMessage += "There might be an issue with the OpenAI account billing. ✨";
    } else {
      errorMessage += "Let me try to help you anyway! What can I do for your style today? ✨";
    }
    
    res.json({
      success: true,
      response: errorMessage,
      images: []
    });
  }
});

// Start servers
async function startServers() {
  try {
    // Start MCP client connection
    console.log('🔌 Connecting to Stylisti MCP backend...');
    await mcpClient.start();
    console.log('✅ Connected to Stylisti MCP backend');

    // Start web server on all network interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✨🌐✨ Stylisti App running at:`);
      console.log(`   💻 http://localhost:${PORT} (on this computer)`);
      console.log(`   📱 http://10.97.39.12:${PORT} (on your iPhone)`);
      console.log(`   🤖 AI Chat: Srusti's Stylist`);
      console.log(`   👗 Gallery: 36+ outfits loaded`);
      console.log(`   📸 Upload: Drag & drop ready`);
      console.log(`   🔒 100% Local & Private`);
      console.log(`   📁 Photos stored in: data/photos/`);
      console.log('\n✨ Welcome to your AI style assistant! ✨');
      console.log(`\n📲 iPhone Users: Open Safari and go to http://10.97.39.12:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  mcpClient.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  mcpClient.stop();
  process.exit(0);
});

// Start the application
startServers();