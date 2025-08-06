# Stylisti App - Personal Outfit Tracking & Recommendations

A Modular Control Protocol (MCP) server for organizing and optimizing personal outfit tracking with AI-powered style recommendations.

## 🌟 Features

- **📸 Outfit Logging**: Capture outfits with photos, tags, and context
- **🎯 Smart Recommendations**: AI-powered outfit suggestions based on weather, occasion, and personal style
- **📊 Style Analytics**: Track confidence trends, comfort patterns, and style evolution
- **👗 Wardrobe Management**: Complete inventory tracking with usage analytics
- **🔍 Pattern Analysis**: Identify successful outfit formulas and wardrobe gaps
- **🤖 AI Integration**: Computer vision for outfit analysis and personalized insights
- **🌐 Web Interface**: Drag & drop photo uploads with mobile-friendly design
- **🔒 Privacy-First**: 100% local processing - your photos never leave your device

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Stylisti-1

# Install dependencies
npm install

# Initialize database
npm run build
npm start
```

### Basic Usage

#### Option 1: Complete Web App (Recommended) 🌟
```bash
# One command starts everything!
npm run app

# Opens automatically:
# 📱 Web Interface: http://localhost:3000
# 🔧 MCP Server: Background process
# Drag & drop photos, tag outfits, get instant AI analysis!
```

#### Option 2: Manual Startup
```bash
# Start the MCP server
npm start

# In another terminal, start the web interface
npm run web

# Open your browser to http://localhost:3000
```

#### Option 3: Command Line Interface
1. **Log your first outfit:**
   ```bash
   # Using MCP client
   mcp-client call style-mcp log_outfit \
     --photo_path "my-outfit.jpg" \
     --occasion '["work"]' \
     --mood "confident" \
     --style_tags '["professional", "minimalist"]'
   ```

2. **Get outfit recommendations:**
   ```bash
   mcp-client call style-mcp get_outfit_recommendations \
     --occasion "work" \
     --weather '{"temperature": 72, "condition": "sunny"}'
   ```

3. **Rate your outfit at day's end:**
   ```bash
   mcp-client call style-mcp rate_outfit \
     --outfit_id "outfit-123" \
     --confidence 8 \
     --comfort 9 \
     --success 7
   ```

## 📋 MCP Tools Available

### Outfit Management
- `log_outfit` - Log new outfits with photos and context
- `rate_outfit` - Rate outfit performance throughout the day
- `get_outfit_recommendations` - Get AI-powered suggestions
- `search_outfits` - Search your outfit history
- `get_outfit_details` - View detailed outfit information

### Style Analysis
- `analyze_style_patterns` - Identify trends and patterns
- `get_style_insights` - Get personalized recommendations
- `generate_style_report` - Create comprehensive style reports
- `track_confidence_trends` - Monitor confidence over time
- `identify_go_to_outfits` - Find your most successful combinations

### Wardrobe Management
- `add_wardrobe_item` - Add items to your inventory
- `get_wardrobe_inventory` - View and filter your wardrobe
- `wardrobe_gap_analysis` - Identify missing pieces
- `analyze_wardrobe_usage` - Track item wear frequency
- `calculate_cost_per_wear` - Analyze clothing value

## 🏗️ Architecture

```
Style MCP/
├── Core Server (MCP Protocol)
├── Database Layer (SQLite)
├── AI Engine (Style Analysis)
├── Photo Management
└── Analytics & Reporting
```

### Key Components

- **MCP Server**: Standard MCP protocol implementation
- **Database**: SQLite for local data storage
- **AI Engine**: Pattern recognition and recommendations
- **Photo Storage**: Local file management with metadata
- **Analytics**: Pattern analysis and insight generation

## 📊 Data Structure

### Outfit Entry
```json
{
  "id": "unique_id",
  "timestamp": "2024-01-15T08:30:00Z",
  "photos": ["photo1.jpg"],
  "tags": {
    "occasion": ["work"],
    "style": ["professional"],
    "mood": "confident",
    "colors": ["navy", "white"],
    "season": "winter"
  },
  "ratings": {
    "confidence": 8,
    "comfort": 9,
    "success": 8
  }
}
```

### Wardrobe Item
```json
{
  "id": "item_id",
  "name": "Navy Blazer",
  "category": "outerwear",
  "colors": ["navy"],
  "styleTags": ["professional", "classic"],
  "wornCount": 12,
  "costPerWear": 8.33
}
```

## 🎯 Use Cases

### Daily Workflow
1. **Morning**: Get weather-appropriate outfit recommendations
2. **Logging**: Capture outfit photo with quick tags
3. **Evening**: Rate the outfit's performance
4. **Weekly**: Review patterns and insights

### Style Development
- Track confidence trends over time
- Identify most successful outfit formulas
- Discover wardrobe gaps and optimization opportunities
- Experiment with new styles while maintaining what works

### Wardrobe Optimization
- Calculate cost-per-wear for clothing investments
- Identify underutilized items
- Plan strategic purchases to fill gaps
- Track seasonal wardrobe needs

## 🔧 Configuration

Edit `config/default.json` to customize:

```json
{
  "ai": {
    "provider": "openai",
    "model": "gpt-4-vision-preview"
  },
  "recommendations": {
    "maxSuggestions": 5,
    "weatherApiEnabled": true
  },
  "privacy": {
    "localProcessingOnly": false,
    "encryptSensitiveData": true
  }
}
```

## 🔐 Privacy & Security

- **Local-first**: Data stored locally by default
- **Encryption**: Sensitive data encrypted at rest
- **Export Control**: Full data portability
- **AI Processing**: Optional cloud processing with consent

## 📈 Analytics & Insights

### Available Reports
- Monthly style summaries
- Confidence trend analysis
- Color palette optimization
- Wardrobe efficiency metrics
- Cost-per-wear analysis

### Pattern Recognition
- Weather-outfit correlations
- Occasion-specific success patterns
- Color combination effectiveness
- Style evolution tracking

## 🛠️ Development

### Setup Development Environment
```bash
npm install
npm run dev  # Watch mode with hot reload
npm test     # Run test suite
npm run lint # Check code quality
```

### Project Structure
```
src/
├── server.ts           # Main MCP server
├── database/           # Data layer
├── ai/                 # AI and recommendations
├── tools/              # MCP tool definitions
└── types/              # TypeScript definitions
```

## 📚 Documentation

- [Design Document](STYLE_MCP_DESIGN.md) - Complete system design
- [Implementation Guide](MCP_IMPLEMENTATION_GUIDE.md) - Technical details
- [App Options Guide](APP_OPTIONS.md) - Privacy & ease comparison
- [API Reference](docs/api.md) - Tool specifications
- [User Guide](docs/user-guide.md) - Usage examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔮 Future Enhancements

- [ ] Mobile app integration
- [ ] Social style sharing
- [ ] Shopping assistant integration
- [ ] Advanced computer vision
- [ ] Trend prediction algorithms
- [ ] Sustainable fashion metrics

---

*Style MCP - Bringing AI-powered insights to your personal style journey*
