#!/usr/bin/env node

/**
 * Style MCP Server
 * Personal outfit tracking and recommendation system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { OutfitDatabase } from './database/sqlite.js';
import { StyleAIEngine } from './ai/recommendations.js';
import { setupOutfitTools } from './tools/outfit-tools.js';
import { setupAnalysisTools } from './tools/analysis-tools.js';
import { setupWardrobeTools } from './tools/wardrobe-tools.js';

class StyleMCPServer {
  private server: Server;
  private database: OutfitDatabase;
  private aiEngine: StyleAIEngine;

  constructor() {
    this.server = new Server(
      {
        name: 'style-mcp',
        version: '1.0.0',
        description: 'Personal style and outfit tracking MCP server',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.database = new OutfitDatabase();
    this.aiEngine = new StyleAIEngine();
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // Tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const outfitTools = setupOutfitTools();
      const analysisTools = setupAnalysisTools();
      const wardrobeTools = setupWardrobeTools();

      return {
        tools: [...outfitTools, ...analysisTools, ...wardrobeTools],
      };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'log_outfit':
            return await this.handleLogOutfit(args);
          
          case 'rate_outfit':
            return await this.handleRateOutfit(args);
          
          case 'get_outfit_recommendations':
            return await this.handleGetRecommendations(args);
          
          case 'search_outfits':
            return await this.handleSearchOutfits(args);
          
          case 'analyze_style_patterns':
            return await this.handleAnalyzePatterns(args);
          
          case 'add_wardrobe_item':
            return await this.handleAddWardrobeItem(args);
          
          case 'wardrobe_gap_analysis':
            return await this.handleWardrobeGapAnalysis(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'outfit://recent',
            name: 'Recent Outfits',
            mimeType: 'application/json',
            description: 'Last 30 days of outfit entries',
          },
          {
            uri: 'wardrobe://inventory',
            name: 'Wardrobe Inventory',
            mimeType: 'application/json',
            description: 'Complete wardrobe item list',
          },
          {
            uri: 'report://monthly',
            name: 'Monthly Style Report',
            mimeType: 'application/json',
            description: 'Current month style analysis',
          },
        ],
      };
    });

    // Resource reading handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri === 'outfit://recent') {
          const recentOutfits = await this.database.getRecentOutfits(30);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(recentOutfits, null, 2),
              },
            ],
          };
        }

        if (uri === 'wardrobe://inventory') {
          const inventory = await this.database.getWardrobeInventory();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(inventory, null, 2),
              },
            ],
          };
        }

        if (uri === 'report://monthly') {
          const report = await this.aiEngine.generateMonthlyReport();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(report, null, 2),
              },
            ],
          };
        }

        throw new Error(`Unknown resource: ${uri}`);
      } catch (error) {
        throw new Error(`Error reading resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  private async handleLogOutfit(args: any) {
    const outfit = await this.database.createOutfit(args);
    const aiAnalysis = await this.aiEngine.analyzeOutfit(outfit);
    
    await this.database.updateOutfitAnalysis(outfit.id, aiAnalysis);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Outfit logged successfully!
          
**Outfit ID:** ${outfit.id}
**Date:** ${outfit.timestamp.toLocaleDateString()}
**Tags:** ${outfit.tags.occasion.join(', ')} | ${outfit.tags.style.join(', ')}
**Mood:** ${outfit.tags.mood}

**AI Analysis:**
- Style Coherence: ${Math.round(aiAnalysis.styleCoherence * 100)}%
- Color Harmony: ${Math.round(aiAnalysis.colorHarmony * 100)}%
- Occasion Fit: ${Math.round(aiAnalysis.occasionAppropriateness * 100)}%

${aiAnalysis.summary}

*Don't forget to rate this outfit at the end of the day!*`,
        },
      ],
    };
  }

  private async handleRateOutfit(args: any) {
    await this.database.updateOutfitRatings(args.outfit_id, args);
    
    const outfit = await this.database.getOutfit(args.outfit_id);
    if (!outfit) {
      throw new Error(`Outfit with ID ${args.outfit_id} not found`);
    }
    
    const insights = await this.aiEngine.generateRatingInsights(outfit);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Outfit rated successfully!
          
**Ratings Added:**
- Confidence: ${args.confidence}/10
- Comfort: ${args.comfort}/10
- Success: ${args.success}/10

**Quick Insights:**
${insights.join('\n')}

This data will help improve future recommendations!`,
        },
      ],
    };
  }

  private async handleGetRecommendations(args: any) {
    const recommendations = await this.aiEngine.generateRecommendations(args);

    const formattedRecs = recommendations
      .slice(0, 5)
      .map((rec, index) => {
        return `**${index + 1}. ${rec.reasoning[0]}** (Score: ${Math.round(rec.score * 100)}%)
- ${rec.reasoning.slice(1).join('\n- ')}
- Weather fit: ${Math.round(rec.weatherScore * 100)}%
- Personal style: ${Math.round(rec.personalScore * 100)}%`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `🎯 **Outfit Recommendations**

Based on: ${args.occasion || 'current context'} | ${args.weather?.condition || 'current weather'} | ${args.mood_preference || 'your style'}

${formattedRecs}

*Choose an option or ask for more specific recommendations!*`,
        },
      ],
    };
  }

  private async handleSearchOutfits(args: any) {
    const results = await this.database.searchOutfits(args);
    
    const formattedResults = results
      .slice(0, 10)
      .map(outfit => {
        const avgRating = outfit.ratings 
          ? Math.round((outfit.ratings.confidence + outfit.ratings.comfort + outfit.ratings.success) / 3)
          : 'Not rated';
        
        return `**${outfit.timestamp.toLocaleDateString()}** - ${outfit.tags.occasion.join(', ')}
- Style: ${outfit.tags.style.join(', ')}
- Mood: ${outfit.tags.mood}
- Rating: ${avgRating}/10
- Notes: ${outfit.notes || 'No notes'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔍 **Search Results** (${results.length} found)

${formattedResults || 'No outfits found matching your criteria.'}`,
        },
      ],
    };
  }

  private async handleAnalyzePatterns(args: any) {
    const patterns = await this.aiEngine.analyzeStylePatterns(args);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Style Pattern Analysis** - ${args.time_period}

${patterns.insights.map(insight => 
  `**${insight.category}:** ${insight.description} (${insight.trend})`
).join('\n')}

**Recommendations:**
${patterns.recommendations.map(rec => `• ${rec}`).join('\n')}`,
        },
      ],
    };
  }

  private async handleAddWardrobeItem(args: any) {
    const item = await this.database.addWardrobeItem(args);

    return {
      content: [
        {
          type: 'text',
          text: `✅ **Wardrobe item added!**

**${item.name}** (${item.category})
- Colors: ${item.colors.join(', ')}
- Style tags: ${item.styleTags.join(', ')}
- Added: ${item.createdAt.toLocaleDateString()}

Your wardrobe now has ${await this.database.getWardrobeCount()} items.`,
        },
      ],
    };
  }

  private async handleWardrobeGapAnalysis(args: any) {
    const gaps = await this.aiEngine.analyzeWardrobeGaps(args);

    return {
      content: [
        {
          type: 'text',
          text: `🎯 **Wardrobe Gap Analysis** - ${args.focus_area}

${gaps.map(gap => 
  `**${gap.category}** (${gap.priority} priority)
${gap.description}
Suggested: ${gap.suggestedItems.join(', ')}
Budget: ${gap.estimatedBudget || 'Variable'}`
).join('\n\n')}`,
        },
      ],
    };
  }

  async run() {
    await this.database.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Style MCP server running on stdio');
  }
}

// Start the server
const server = new StyleMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});