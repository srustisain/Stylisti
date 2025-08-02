# Style MCP Implementation Guide

## MCP Server Architecture

This guide outlines how to implement the Style MCP as a proper Modular Control Protocol server that can be integrated with various MCP clients.

## Core MCP Tools Structure

### 1. Outfit Management Tools

#### `log_outfit`
Captures and stores a new outfit entry with photo and metadata.

```typescript
{
  name: "log_outfit",
  description: "Log a new outfit with photo, tags, and context",
  inputSchema: {
    type: "object",
    properties: {
      photo_path: { type: "string", description: "Path to outfit photo" },
      occasion: { type: "array", items: { type: "string" } },
      style_tags: { type: "array", items: { type: "string" } },
      mood: { type: "string" },
      season: { type: "string" },
      weather_context: { type: "object" },
      notes: { type: "string" }
    },
    required: ["photo_path"]
  }
}
```

#### `rate_outfit`
Add ratings to an existing outfit entry.

```typescript
{
  name: "rate_outfit",
  description: "Rate an outfit's confidence, comfort, and success",
  inputSchema: {
    type: "object",
    properties: {
      outfit_id: { type: "string" },
      confidence: { type: "number", minimum: 1, maximum: 10 },
      comfort: { type: "number", minimum: 1, maximum: 10 },
      success: { type: "number", minimum: 1, maximum: 10 },
      repeat_likelihood: { type: "number", minimum: 1, maximum: 10 },
      feedback_notes: { type: "string" }
    },
    required: ["outfit_id"]
  }
}
```

### 2. Query and Analysis Tools

#### `get_outfit_recommendations`
Generate outfit suggestions based on context and history.

```typescript
{
  name: "get_outfit_recommendations",
  description: "Get AI-powered outfit recommendations for given context",
  inputSchema: {
    type: "object",
    properties: {
      occasion: { type: "string" },
      weather: { type: "object" },
      mood_preference: { type: "string" },
      style_preference: { type: "array", items: { type: "string" } },
      limit: { type: "number", default: 5 }
    }
  }
}
```

#### `analyze_style_patterns`
Analyze user's style patterns and provide insights.

```typescript
{
  name: "analyze_style_patterns",
  description: "Analyze outfit patterns and provide style insights",
  inputSchema: {
    type: "object",
    properties: {
      time_period: { type: "string", enum: ["week", "month", "season", "year"] },
      analysis_type: { 
        type: "string", 
        enum: ["confidence_trends", "comfort_patterns", "style_evolution", "wardrobe_gaps"] 
      }
    }
  }
}
```

#### `search_outfits`
Search through outfit history with filters.

```typescript
{
  name: "search_outfits",
  description: "Search outfits by tags, ratings, dates, or other criteria",
  inputSchema: {
    type: "object",
    properties: {
      tags: { type: "array", items: { type: "string" } },
      date_range: { type: "object" },
      min_confidence: { type: "number" },
      min_comfort: { type: "number" },
      occasion: { type: "string" },
      season: { type: "string" },
      limit: { type: "number", default: 20 }
    }
  }
}
```

### 3. Wardrobe Management Tools

#### `add_wardrobe_item`
Add new clothing items to wardrobe inventory.

```typescript
{
  name: "add_wardrobe_item",
  description: "Add a new item to your wardrobe inventory",
  inputSchema: {
    type: "object",
    properties: {
      item_name: { type: "string" },
      category: { type: "string", enum: ["tops", "bottoms", "shoes", "outerwear", "accessories"] },
      colors: { type: "array", items: { type: "string" } },
      style_tags: { type: "array", items: { type: "string" } },
      purchase_date: { type: "string" },
      cost: { type: "number" },
      brand: { type: "string" },
      care_instructions: { type: "string" }
    },
    required: ["item_name", "category"]
  }
}
```

#### `wardrobe_gap_analysis`
Identify missing pieces in wardrobe.

```typescript
{
  name: "wardrobe_gap_analysis",
  description: "Identify gaps in wardrobe and suggest additions",
  inputSchema: {
    type: "object",
    properties: {
      focus_area: { 
        type: "string", 
        enum: ["work", "casual", "formal", "seasonal", "color_palette"] 
      },
      budget_range: { type: "string" }
    }
  }
}
```

### 4. Data Management Tools

#### `export_outfit_data`
Export outfit data in various formats.

```typescript
{
  name: "export_outfit_data",
  description: "Export outfit data for backup or analysis",
  inputSchema: {
    type: "object",
    properties: {
      format: { type: "string", enum: ["json", "csv", "pdf_report"] },
      date_range: { type: "object" },
      include_photos: { type: "boolean", default: false }
    }
  }
}
```

#### `import_outfit_data`
Import outfit data from external sources.

```typescript
{
  name: "import_outfit_data",
  description: "Import outfit data from file or other sources",
  inputSchema: {
    type: "object",
    properties: {
      source_file: { type: "string" },
      format: { type: "string", enum: ["json", "csv"] },
      merge_strategy: { type: "string", enum: ["append", "overwrite", "merge"] }
    },
    required: ["source_file", "format"]
  }
}
```

## MCP Resources Structure

### 1. Outfit Resources

Each outfit becomes a resource that can be read and manipulated:

```typescript
// Resource URI: outfit://daily/{date}
// Resource URI: outfit://id/{outfit_id}
{
  uri: "outfit://daily/2024-01-15",
  name: "Daily Outfit - January 15, 2024",
  mimeType: "application/json",
  description: "Outfit worn on January 15, 2024"
}
```

### 2. Style Reports

Generated analysis reports as resources:

```typescript
// Resource URI: report://style-analysis/{period}
{
  uri: "report://style-analysis/2024-01",
  name: "January 2024 Style Analysis",
  mimeType: "application/json",
  description: "Monthly style patterns and insights"
}
```

### 3. Wardrobe Inventory

Current wardrobe state as a resource:

```typescript
// Resource URI: wardrobe://inventory
{
  uri: "wardrobe://inventory",
  name: "Current Wardrobe Inventory",
  mimeType: "application/json",
  description: "Complete list of clothing items"
}
```

## Server Implementation Structure

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class StyleMCPServer {
  private server: Server;
  private outfitDatabase: OutfitDatabase;
  private aiEngine: StyleAIEngine;

  constructor() {
    this.server = new Server(
      {
        name: "style-mcp",
        version: "1.0.0",
        description: "Personal style and outfit tracking MCP server"
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    this.setupTools();
    this.setupResources();
  }

  private setupTools() {
    // Register all outfit management tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // All tool definitions here
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case "log_outfit":
          return await this.handleLogOutfit(args);
        case "rate_outfit":
          return await this.handleRateOutfit(args);
        case "get_outfit_recommendations":
          return await this.handleGetRecommendations(args);
        // ... other handlers
      }
    });
  }

  private async handleLogOutfit(args: any) {
    // Implementation for logging new outfit
    const outfit = await this.outfitDatabase.createOutfit(args);
    const aiAnalysis = await this.aiEngine.analyzeOutfit(outfit);
    
    return {
      content: [{
        type: "text",
        text: `Outfit logged successfully. ID: ${outfit.id}\nAI Analysis: ${aiAnalysis.summary}`
      }]
    };
  }

  private async handleGetRecommendations(args: any) {
    // Implementation for generating recommendations
    const recommendations = await this.aiEngine.generateRecommendations(args);
    
    return {
      content: [{
        type: "text",
        text: this.formatRecommendations(recommendations)
      }]
    };
  }

  // ... other handler implementations
}
```

## Integration Examples

### 1. Daily Outfit Planning

```bash
# Morning routine
mcp-client call style-mcp get_outfit_recommendations \
  --occasion "work" \
  --weather '{"temp": 65, "condition": "sunny"}' \
  --mood_preference "confident"

# Evening reflection
mcp-client call style-mcp rate_outfit \
  --outfit_id "outfit_123" \
  --confidence 8 \
  --comfort 9 \
  --success 7
```

### 2. Style Analysis

```bash
# Monthly style review
mcp-client call style-mcp analyze_style_patterns \
  --time_period "month" \
  --analysis_type "confidence_trends"

# Wardrobe optimization
mcp-client call style-mcp wardrobe_gap_analysis \
  --focus_area "work" \
  --budget_range "medium"
```

### 3. AI Assistant Integration

The MCP can be integrated with AI assistants like Claude to provide natural language interaction:

```
User: "What should I wear to my job interview tomorrow?"

AI Assistant (via Style MCP): 
- Calls get_outfit_recommendations with occasion="interview"
- Analyzes your highest-rated professional outfits
- Considers weather forecast
- Suggests 3 options with confidence reasoning

User: "I want to track what I'm wearing today"

AI Assistant (via Style MCP):
- Guides photo capture process
- Suggests relevant tags based on context
- Prompts for mood and occasion
- Stores outfit with automatic weather data
```

## Data Storage Strategy

### Local SQLite Database Schema

```sql
-- Outfits table
CREATE TABLE outfits (
    id TEXT PRIMARY KEY,
    timestamp DATETIME,
    photo_paths TEXT, -- JSON array
    occasion_tags TEXT, -- JSON array
    style_tags TEXT, -- JSON array
    mood TEXT,
    season TEXT,
    weather_data TEXT, -- JSON object
    confidence_rating INTEGER,
    comfort_rating INTEGER,
    success_rating INTEGER,
    repeat_likelihood INTEGER,
    notes TEXT,
    ai_analysis TEXT, -- JSON object
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wardrobe items table
CREATE TABLE wardrobe_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    colors TEXT, -- JSON array
    style_tags TEXT, -- JSON array
    purchase_date DATE,
    cost DECIMAL(10,2),
    brand TEXT,
    care_instructions TEXT,
    worn_count INTEGER DEFAULT 0,
    last_worn DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT, -- JSON serialized value
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### File Organization

```
style-mcp/
├── src/
│   ├── server.ts              # Main MCP server
│   ├── database/
│   │   ├── sqlite.ts          # Database connection
│   │   ├── outfit-repo.ts     # Outfit data operations
│   │   └── wardrobe-repo.ts   # Wardrobe data operations
│   ├── ai/
│   │   ├── vision.ts          # Photo analysis
│   │   ├── recommendations.ts # Outfit suggestions
│   │   └── patterns.ts        # Pattern analysis
│   ├── tools/
│   │   ├── outfit-tools.ts    # Outfit management tools
│   │   ├── analysis-tools.ts  # Pattern analysis tools
│   │   └── wardrobe-tools.ts  # Wardrobe management tools
│   └── types/
│       ├── outfit.ts          # Type definitions
│       └── mcp.ts             # MCP-specific types
├── data/
│   ├── photos/                # Outfit photos storage
│   ├── style.db              # SQLite database
│   └── exports/              # Data export location
├── config/
│   └── default.json          # Configuration settings
└── package.json
```

## Deployment Options

### 1. Local MCP Server
- Runs as local process
- Data stored locally
- Privacy-focused approach
- Direct integration with MCP clients

### 2. Cloud-Hosted MCP
- Scalable server deployment
- Multi-user support
- Shared AI models
- Backup and sync capabilities

### 3. Hybrid Approach
- Local data storage
- Cloud AI processing
- Encrypted sync option
- Best of both worlds

## Development Roadmap

### Week 1-2: Core Infrastructure
- [ ] Set up MCP server framework
- [ ] Implement basic database schema
- [ ] Create outfit logging tool
- [ ] Add simple photo storage

### Week 3-4: Basic AI Integration
- [ ] Integrate computer vision API
- [ ] Implement basic tagging suggestions
- [ ] Add outfit rating system
- [ ] Create simple recommendation engine

### Week 5-6: Advanced Features
- [ ] Implement pattern analysis
- [ ] Add wardrobe gap detection
- [ ] Create style evolution tracking
- [ ] Build comprehensive query system

### Week 7-8: Polish & Testing
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] User experience refinement

## Testing Strategy

### Unit Tests
```typescript
describe('OutfitRecommendations', () => {
  test('should recommend weather-appropriate outfits', async () => {
    const weather = { temp: 75, condition: 'sunny' };
    const recommendations = await aiEngine.generateRecommendations({
      weather,
      occasion: 'casual'
    });
    
    expect(recommendations).toHaveLength(5);
    expect(recommendations[0].weatherScore).toBeGreaterThan(0.8);
  });
});
```

### Integration Tests
```typescript
describe('Style MCP Integration', () => {
  test('complete outfit workflow', async () => {
    // Log outfit
    const logResult = await mcpClient.callTool('log_outfit', {
      photo_path: 'test-outfit.jpg',
      occasion: ['work'],
      mood: 'confident'
    });
    
    // Rate outfit
    const rateResult = await mcpClient.callTool('rate_outfit', {
      outfit_id: logResult.outfit_id,
      confidence: 8,
      comfort: 9
    });
    
    // Get recommendations
    const recommendations = await mcpClient.callTool('get_outfit_recommendations', {
      occasion: 'work'
    });
    
    expect(recommendations.suggestions).toContain(logResult.outfit_id);
  });
});
```

## Privacy and Security Considerations

### Data Protection
- Local encryption of sensitive data
- Photo metadata scrubbing
- User consent for AI processing
- Configurable data retention policies

### Access Control
- User authentication for multi-user setups
- API key management for AI services
- Audit logging for data access
- Secure backup procedures

This implementation guide provides a comprehensive roadmap for building a production-ready Style MCP server that integrates seamlessly with the broader MCP ecosystem.