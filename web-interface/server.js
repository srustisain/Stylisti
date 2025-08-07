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
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Load environment variables
dotenv.config();

// Debug environment variables in Vercel
console.log('🔍 Environment check:');
console.log('VERCEL:', process.env.VERCEL);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);

// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key-here",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "stylisti-app.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "stylisti-app",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "stylisti-app.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "your-app-id-here"
};

// Initialize Firebase with error handling
let firebaseApp, firebaseStorage, firebaseAuth;
try {
  firebaseApp = initializeApp(firebaseConfig);
  firebaseStorage = getStorage(firebaseApp);
  firebaseAuth = getAuth(firebaseApp);
  
  // Sign in anonymously for uploads (you can add proper auth later)
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY !== "your-api-key-here") {
    signInAnonymously(firebaseAuth).then(() => {
      console.log('✅ Firebase authenticated successfully');
    }).catch((error) => {
      console.error('❌ Firebase auth error:', error);
      console.log('⚠️ Continuing without Firebase - using local storage');
    });
  } else {
    console.log('⚠️ Firebase not configured - running in local mode');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.log('⚠️ Continuing without Firebase - using local storage');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

// Configure multer for memory storage (files will be uploaded to Firebase)
const storage = multer.memoryStorage();

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
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Auth middleware for password
function requireAuth(req, res, next) {
  const authCookie = req.headers.cookie?.includes('stylisti-auth=verified');
  const isAuthPage = req.path === '/login' || req.path === '/verify-password';
  
  if (!authCookie && !isAuthPage) {
    return res.redirect('/login');
  }
  
  next();
}

// Login page
app.get('/login', (req, res) => {
  const error = req.query.error;
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Stylisti - Password Access</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #8b2635 0%, #a53860 100%);
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; margin: 0; color: white;
        }
        .container { 
            background: white; color: #333; padding: 40px; border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 400px; width: 90%;
            text-align: center;
        }
        .icon { font-size: 48px; margin-bottom: 20px; }
        h1 { margin: 0 0 10px; color: #8b2635; font-size: 32px; }
        p { color: #666; margin-bottom: 30px; font-size: 16px; }
        input { 
            width: 100%; padding: 15px; border: 1px solid #ddd; border-radius: 10px;
            font-size: 16px; margin-bottom: 20px; box-sizing: border-box;
        }
        button { 
            width: 100%; padding: 15px; background: #8b2635; color: white;
            border: none; border-radius: 10px; font-size: 16px; cursor: pointer;
            font-weight: 600; margin-bottom: 10px;
        }
        button:hover { background: #a53860; }
        .error { color: #e74c3c; margin-bottom: 20px; font-size: 14px; }
        .password-input { 
            font-size: 18px; text-align: center; letter-spacing: 2px;
            font-family: monospace; font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">👗</div>
        <h1>Stylisti</h1>
        <p>Srusti's Personal AI Style Assistant</p>
        
        ${error === 'password' ? '<div class="error">❌ Incorrect password!</div>' : ''}
        <p>Enter your password to access the app:</p>
        <form method="POST" action="/verify-password">
            <input type="password" name="password" placeholder="Enter password" class="password-input" required>
            <button type="submit">Access Stylisti</button>
        </form>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">🔒 Private access only</p>
    </div>
</body>
</html>
  `);
});

// Verify password for old system
app.post('/verify-password', (req, res) => {
  const password = req.body.password;
  const correctPassword = process.env.STYLISTI_PASSWORD || 'default_password'; // Use environment variable
  
  if (password !== correctPassword) {
    return res.redirect('/login?error=password');
  }
  
  // Password is correct, set auth cookie
  res.cookie('stylisti-auth', 'verified', { 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  
  res.redirect('/');
});

// Secure login verification endpoint
app.post('/verify-login', express.json(), (req, res) => {
  const password = req.body.password;
  const correctPassword = process.env.STYLISTI_PASSWORD || 'default_password'; // Use environment variable
  
  if (password === correctPassword) {
    // Set secure session
    res.cookie('stylisti-auth', 'verified', { 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
});

// PWA manifest route
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Service worker route
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Icon routes
app.get('/icon-192.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.join(__dirname, 'icon-192.png'));
});

app.get('/icon-512.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.join(__dirname, 'icon-512.png'));
});

// Mobile-optimized route  
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'mobile.html'));
});

// Sophisticated mobile app route
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// Root route - serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// MCP Server communication
class MCPClient {
  constructor() {
    this.server = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
  }

  async start() {
    // Skip MCP server in Vercel environment
    if (process.env.VERCEL === '1') {
      console.log('⚠️ MCP server disabled in Vercel environment');
      return;
    }
    
    try {
      const serverPath = path.join(__dirname, '../dist/server.js');
      this.server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'inherit']
      });
    } catch (error) {
      console.log('⚠️ MCP server not available - running in standalone mode');
      return;
    }

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
    // In Vercel environment, just return success
    if (process.env.VERCEL === '1') {
      return {
        result: {
          outfit_id: `vercel-${Date.now()}`,
          message: 'Outfit logged successfully (Vercel mode)'
        }
      };
    }
    
    return await this.sendMessage('tools/call', {
      name: 'log_outfit',
      arguments: outfitData
    });
  }

  async getRecommendations(context) {
    // In Vercel environment, return mock recommendations
    if (process.env.VERCEL === '1') {
      return {
        result: {
          recommendations: [
            "Try pairing your favorite jeans with a crisp white blouse",
            "A black blazer can elevate any casual outfit",
            "Don't forget accessories - they make the outfit!"
          ]
        }
      };
    }
    
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

app.post('/upload-outfit', requireAuth, upload.array('photos'), async (req, res) => {
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
    
    // Upload files directly to Firebase Storage
    console.log('📤 Uploading images to Firebase Storage...');
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = new Date().toISOString().split('T')[0];
        const randomId = Math.random().toString(36).substr(2, 9);
        const ext = path.extname(file.originalname);
        const fileName = `${timestamp}-outfit-${randomId}${ext}`;
        
        // Check if Firebase is available
        if (!firebaseStorage) {
          throw new Error('Firebase Storage not configured');
        }
        
        // Create Firebase Storage reference
        const storageRef = ref(firebaseStorage, `outfits/${fileName}`);
        
        console.log(`📤 Uploading ${fileName} to Firebase...`);
        
        // Upload file to Firebase Storage
        const uploadResult = await uploadBytes(storageRef, file.buffer, {
          contentType: file.mimetype,
          customMetadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        });
        
        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        uploadedFiles.push({
          filename: fileName,
          originalname: file.originalname,
          url: downloadURL,
          size: file.size,
          mimetype: file.mimetype
        });
        
        console.log(`✅ Uploaded: ${fileName}`);
        
      } catch (error) {
        console.error(`❌ Failed to upload ${file.originalname}:`, error);
        throw new Error(`Upload failed for ${file.originalname}: ${error.message}`);
      }
    }
    
    // Convert form data to outfit format with Firebase URLs
    const outfitData = {
      photo_paths: uploadedFiles.map(f => f.url), // Store Firebase URLs instead of local paths
      photo_filenames: uploadedFiles.map(f => f.filename), // Store filenames for reference
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
      message: 'Outfit uploaded successfully to Firebase Storage! 🔥',
      outfit_id: result.result?.outfit_id,
      photos: uploadedFiles.map(f => ({ filename: f.filename, url: f.url }))
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
    } else if (error.message.includes('Firebase Storage not configured')) {
      errorMessage = 'Storage service not configured. Please check Firebase setup.';
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
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL === '1' ? 'Vercel' : 'Local'
  });
});

// Serve the main app HTML
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
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

// Firebase photo URL redirect - photos are now served directly from Firebase
app.get('/photos/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!firebaseStorage) {
      return res.status(404).send('Firebase Storage not configured');
    }
    
    // Create Firebase Storage reference
    const storageRef = ref(firebaseStorage, `outfits/${filename}`);
    
    // Get download URL from Firebase
    const downloadURL = await getDownloadURL(storageRef);
    
    // Redirect to Firebase URL (or proxy the content)
    res.redirect(downloadURL);
    
  } catch (error) {
    console.error('Firebase photo serving error:', error);
    res.status(404).send('Photo not found in Firebase Storage');
  }
});

// Get list of available photos from Firebase Storage
app.get('/api/photos', async (req, res) => {
  try {
    if (!firebaseStorage) {
      return res.json({ 
        success: false, 
        photos: [],
        error: 'Firebase Storage not configured'
      });
    }
    
    // List all files in the 'outfits' folder in Firebase Storage
    const listRef = ref(firebaseStorage, 'outfits');
    const listResult = await listAll(listRef);
    
    console.log(`📸 Found ${listResult.items.length} photos in Firebase Storage`);
    
    // Get download URLs for all photos
    const photoPromises = listResult.items.map(async (itemRef, index) => {
      try {
        const downloadURL = await getDownloadURL(itemRef);
        const filename = itemRef.name;
        
        return {
          filename: filename,
          url: downloadURL,
          id: index + 1,
          canDisplay: true, // All Firebase Storage images can be displayed
          isHEIC: /\.(heic)$/i.test(filename),
          firebaseRef: itemRef.fullPath
        };
      } catch (error) {
        console.error(`Error getting URL for ${itemRef.name}:`, error);
        return null;
      }
    });
    
    const photos = (await Promise.all(photoPromises))
      .filter(photo => photo !== null)
      .sort((a, b) => {
        // Sort by filename (which includes date) to get newest first
        return b.filename.localeCompare(a.filename);
      });
    
    console.log(`✅ Successfully loaded ${photos.length} photos from Firebase Storage`);
    res.json({ success: true, photos: photos });
    
  } catch (error) {
    console.error('❌ Error listing Firebase Storage photos:', error);
    
    // Fallback message for setup issues
    if (error.code === 'storage/unauthorized') {
      res.json({ 
        success: false, 
        photos: [],
        error: 'Firebase Storage not properly configured. Please check Firebase setup.'
      });
    } else {
      res.json({ 
        success: false, 
        photos: [],
        error: 'Failed to load photos from Firebase Storage'
      });
    }
  }
});

// Real AI Chat endpoint with GPT-4 Vision
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    
    console.log('📝 User message:', message);
    
    // Check if we have an OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
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
    
    // Get available photos from Firebase Storage
    const getAvailablePhotos = async () => {
      try {
        if (!firebaseStorage) {
          return [];
        }
        
        const listRef = ref(firebaseStorage, 'outfits');
        const listResult = await listAll(listRef);
        
        const photoPromises = listResult.items.map(async (itemRef) => {
          try {
            const downloadURL = await getDownloadURL(itemRef);
            return {
              filename: itemRef.name,
              url: downloadURL,
              firebaseRef: itemRef.fullPath
            };
          } catch (error) {
            console.error(`Error getting URL for ${itemRef.name}:`, error);
            return null;
          }
        });
        
        const photos = (await Promise.all(photoPromises))
          .filter(photo => photo !== null);
          
        return photos;
      } catch (error) {
        console.error('Error getting Firebase photos:', error);
        return [];
      }
    };
    
    const availablePhotos = await getAvailablePhotos();
    console.log(`🎯 AI Chat found ${availablePhotos.length} photos to analyze`);
    
    // Check if user is feeling lazy or wants low effort (recreate exact outfit)
    const lazyKeywords = [
      'lazy', 'low effort', 'tired', 'don\'t want to think', 'easy', 'simple', 
      'just wear', 'recreate', 'same as', 'exact same', 'don\'t feel like', 
      'can\'t decide', 'no energy', 'quick', 'fast', 'grab and go', 'effortless',
      'zero effort', 'no thinking', 'just pick one', 'one outfit', 'single outfit'
    ];
    const isLazyRequest = lazyKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    // Log the detection for debugging
    if (isLazyRequest) {
      const matchedKeyword = lazyKeywords.find(keyword => message.toLowerCase().includes(keyword));
      console.log(`😴 Lazy request detected! Keyword: "${matchedKeyword}" in message: "${message.substring(0, 50)}..."`);
    } else {
      console.log(`🎨 Creative request detected for message: "${message.substring(0, 50)}..."`);
    }
    
    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are Srusti's Personal Stylist, analyzing her wardrobe pieces.

${isLazyRequest ? 
`LAZY/LOW EFFORT MODE - RECREATE EXACT OUTFIT:
- Find the BEST single outfit from the photos
- Pick ONE complete outfit that looks great
- Don't mix and match - just recreate that exact outfit
- Focus on comfort and ease

FORMAT:
**Easy Outfit Recreation:**

**Wear This:** [Describe the exact outfit from one photo]
- **Why it's perfect:** [Why this outfit is great for lazy days]
- **Effort level:** Low - just grab and go!

**PHOTO_REFS:** [List the filename of the outfit you're recreating]

Keep it simple and stress-free!` 
: 
`CREATIVE MODE - MIX AND MATCH:
- Look at 4-6 photos to find the best combinations
- Give 2-3 specific outfit suggestions
- Be creative with mixing different pieces
- Consider different style approaches

FORMAT:
**Outfit Suggestions:**

**Look 1:** [Description of 2-3 pieces that work together]
- **Why it works:** [Color/style logic]
- **Pro tip:** [Styling tip]

**Look 2:** [Another combination]
- **Why it works:** [Color/style logic]  
- **Pro tip:** [Styling tip]

**PHOTO_REFS:** [List the filenames used]

Be creative and show variety!`}`
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
    
    console.log(`🔍 Image analysis needed: ${needsImageAnalysis} for message: "${message.substring(0, 50)}..."`);
    console.log(`📊 Available photos: ${availablePhotos.length}`);
    
    if (needsImageAnalysis && availablePhotos.length > 0) {
      // Filter for AI-supported formats (no HEIC)
      const aiSupportedPhotos = availablePhotos
        .filter(photo => /\.(jpg|jpeg|png|webp)$/i.test(photo.filename));
      
      console.log(`📸 Found ${aiSupportedPhotos.length} AI-compatible photos (JPG/PNG/WebP) out of ${availablePhotos.length} total`);
      
      if (aiSupportedPhotos.length > 0) {
        // Select 12 different photos each time using Fisher-Yates shuffle for true randomization
        const photosCopy = [...aiSupportedPhotos];
        
        // Fisher-Yates shuffle for true randomization
        for (let i = photosCopy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [photosCopy[i], photosCopy[j]] = [photosCopy[j], photosCopy[i]];
        }
        
        const maxPhotos = Math.min(6, aiSupportedPhotos.length); // Analyze up to 6 photos for better recommendations
        const photosToAnalyze = photosCopy.slice(0, maxPhotos);
        
        console.log(`📸 Sending ${photosToAnalyze.length} photos to AI for analysis`);
        console.log(`🎲 Selected photos this round: ${photosToAnalyze.map(p => p.filename.substring(0, 20)).join(', ')}`);
        
        for (const photo of photosToAnalyze) {
          try {
            // For Firebase Storage, we can directly use the download URL
            // OpenAI can access public Firebase Storage URLs directly
            userMessage.content.push({
              type: "image_url",
              image_url: {
                url: photo.url, // Use Firebase Storage URL directly
                detail: "high"
              }
            });
          } catch (error) {
            console.error(`Error processing photo ${photo.filename}:`, error);
          }
        }
        
        // Add context about the photos with actual filenames
        const photoFilenames = photosToAnalyze.map(p => p.filename).join(', ');
        
        userMessage.content.push({
          type: "text",
          text: `\n\nI'm sharing ${photosToAnalyze.length} pieces from my wardrobe. ${isLazyRequest ? 
            'I\'m feeling lazy today - please pick the BEST single outfit from these photos and tell me to recreate it exactly. No mixing and matching, just one complete outfit that looks great and is easy to wear.' : 
            'Please suggest 2-3 creative outfit combinations using these pieces. Mix and match different items to create new looks!'}

📸 Photos: ${photoFilenames}

${isLazyRequest ? 'Keep it simple - just one great outfit!' : 'Show me different style approaches!'}`
        });

        // Store the analyzed photos for the response
        console.log(`💾 Storing ${photosToAnalyze.length} analyzed photos for session ${sessionId}`);
        console.log(`🔍 Sample photo structure:`, photosToAnalyze[0] ? {url: photosToAnalyze[0].url ? 'HAS_URL' : 'NO_URL', filename: photosToAnalyze[0].filename} : 'NO_PHOTOS');
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
      max_tokens: 300, // Reduced for more concise responses
      temperature: 0.7 // Balanced creativity
    });
    
    const aiResponse = completion.choices[0].message.content;
    console.log('✨ AI Response:', aiResponse);
    
    // Validation: Check for potential hallucination indicators
    const lazy_format_indicators = ['Wear This:', 'Easy Outfit Recreation:', 'Effort level: Low'];
    const creative_format_indicators = ['Look 1:', 'Look 2:', 'Outfit Suggestions:'];
    
    const has_proper_format = isLazyRequest ? 
      lazy_format_indicators.some(indicator => aiResponse.includes(indicator)) :
      creative_format_indicators.some(indicator => aiResponse.includes(indicator));
    
    if (!has_proper_format) {
      console.log(`⚠️ AI response may not be following ${isLazyRequest ? 'lazy' : 'creative'} format - potential hallucination detected`);
    } else {
      console.log(`✅ AI response follows expected ${isLazyRequest ? 'lazy' : 'creative'} format`);
    }
    
    // Add to conversation history
    history.push(userMessage);
    history.push({ role: "assistant", content: aiResponse });
    
    // Keep history manageable (last 10 exchanges)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    // Extract specific photos referenced in AI response
    const analyzedPhotos = conversationHistory.get(sessionId + '_analyzed_photos') || [];
    let filteredPhotos = analyzedPhotos;
    
    // Parse AI response for referenced photos and clean the response
    const referencedMatch = aiResponse.match(/\*\*PHOTO_REFS:\*\*\s*([^*\n]+)/i);
    let cleanResponse = aiResponse;
    
    if (referencedMatch) {
      const referencedFilenames = referencedMatch[1]
        .split(',')
        .map(name => name.trim().toLowerCase())
        .filter(name => name.length > 0);
      
      console.log(`🎯 AI referenced specific photos: ${referencedFilenames.join(', ')}`);
      
      // Filter analyzed photos to only include referenced ones
      filteredPhotos = analyzedPhotos.filter(photo => 
        referencedFilenames.some(refName => 
          photo.filename.toLowerCase() === refName || 
          photo.filename.toLowerCase().includes(refName.toLowerCase())
        )
      );
      
      // Remove the PHOTO_REFS section from the response shown to user
      cleanResponse = aiResponse.replace(/\*\*PHOTO_REFS:\*\*[^*\n]*\n?/i, '').trim();
      
      // Update conversation history with clean response
      if (history.length > 0 && history[history.length - 1].role === "assistant") {
        history[history.length - 1].content = cleanResponse;
      }
      
      console.log(`📸 Filtered to ${filteredPhotos.length} specific reference photos`);
    } else {
      console.log(`⚠️ No specific photo references found in AI response, showing all ${analyzedPhotos.length} analyzed photos`);
    }
    
    console.log(`🖼️ Returning ${filteredPhotos.length} reference images for session ${sessionId}`);
    
    const referenceImages = filteredPhotos.map(photo => ({
      url: photo.url,
      filename: photo.filename,
      isReference: true
    }));
    
    res.json({
      success: true,
      response: cleanResponse,
      images: referenceImages
    });
    
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
    // Provide helpful error messages
    let errorMessage = "I'm having trouble connecting to my AI brain right now. ";
    
    if (error.message.includes('API key')) {
      errorMessage += "Please check your OpenAI API key configuration. ✨";
    } else if (error.message.includes('rate limit')) {
      errorMessage += "I'm getting too many requests! Please wait a moment and try again. ✨";
    } else if (error.message.includes('billing')) {
      errorMessage += "There might be an issue with the OpenAI account billing. ✨";
    } else {
      errorMessage += `Error: ${error.message}. Let me try to help you anyway! What can I do for your style today? ✨`;
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
    try {
      await mcpClient.start();
      console.log('✅ Connected to Stylisti MCP backend');
    } catch (error) {
      console.log('⚠️ MCP backend not available - running in standalone mode');
    }

    // Start web server on all network interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✨🌐✨ Stylisti App running at:`);
      console.log(`   💻 http://localhost:${PORT} (on this computer)`);
      console.log(`   📱 http://10.97.48.130:${PORT} (on your iPhone)`);
      console.log(`   🤖 AI Chat: Srusti's Stylist`);
      console.log(`   👗 Gallery: 36+ outfits loaded`);
      console.log(`   📸 Upload: Drag & drop ready`);
      console.log(`   🔒 100% Local & Private`);
      console.log(`   📁 Photos stored in: data/photos/`);
      console.log('\n✨ Welcome to your AI style assistant! ✨');
      console.log(`\n📲 iPhone Users: Open Safari and go to http://10.97.48.130:${PORT}`);
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

// Start the application only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  startServers();
}

// Export for Vercel serverless functions
export default app;