# Stylisti - Build Your Own AI Style Assistant PWA 👗✨

A complete template for building your own AI-powered style assistant. This Progressive Web App (PWA) helps users upload outfits, get AI recommendations, and track their personal style journey - all from their mobile device!

## 🌟 Features You Can Build

- **📱 Progressive Web App**: Install on users' phone home screens like a native app
- **📸 Outfit Upload**: Drag & drop or tap to upload outfit photos
- **🤖 AI Chat Assistant**: Chat with GPT-4 Vision for personalized style advice
- **📋 Occasion Planner**: Get outfit suggestions based on weather, occasion, and mood
- **👗 Digital Lookbook**: Browse outfit history with real-time updates
- **☁️ Cloud Storage**: Photos securely stored in Firebase Storage
- **📅 Calendar Integration**: Track outfits by date
- **🎨 Custom Branding**: Beautiful custom icons and modern UI

## 💻 Tech Stack

### Frontend
- **HTML5 + CSS3 + JavaScript** (Vanilla JS, no frameworks)
- **Progressive Web App** (PWA) with Service Worker
- **Responsive Design** optimized for mobile
- **Firebase Storage** for photo management

### Backend
- **Node.js + Express.js** server
- **Vercel Serverless** deployment
- **OpenAI GPT-4 Vision** for AI recommendations
- **Firebase Authentication** (anonymous)
- **Sharp** for image processing

### Deployment
- **Vercel** for hosting and deployment
- **GitHub** for version control
- **Custom Domain** ready

## 📂 Project Structure

```
Stylisti-1/
├── web-interface/
│   ├── app.html          # Main PWA interface
│   ├── server.js         # Express.js backend
│   ├── manifest.json     # PWA manifest
│   ├── sw.js            # Service Worker
│   ├── icon-192.png     # App icons
│   └── icon-512.png     
├── src/                  # Optional MCP components (not used in deployment)
│   ├── server.ts         # MCP server (development only)
│   ├── database/         # Data layer
│   ├── ai/              # AI recommendations
│   └── tools/           # Style analysis tools
├── vercel.json          # Vercel deployment config
├── package.json         # Dependencies
└── README.md           # This file
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Firebase project (for photo storage)
- OpenAI API key (for AI chat)

### Setup Your Own Stylisti App

1. **Clone the repository**
   ```bash
   git clone https://github.com/srustisain/Stylisti.git
   cd Stylisti-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

4. **Customize your app**
   - Edit `web-interface/manifest.json` for your app name and branding
   - Replace icons in `web-interface/` with your own
   - Update colors and styling in `web-interface/app.html`

5. **Start development server**
   ```bash
   npm start
   # or
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🚀 Deploy Your App

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Add your Firebase and OpenAI environment variables
   - Redeploy

3. **Custom Domain** (Optional)
   - Add your custom domain in Vercel settings
   - Update DNS records as instructed

## 📱 App Features You'll Build

### 🏠 Dashboard
- Overview of user's style journey
- Quick access to all features
- Recent outfit activity

### 📸 Upload Outfit
1. Tap "Upload Outfit"
2. Select/take a photo
3. Tag with occasion, style, and mood
4. Add optional notes
5. Submit to lookbook

### 🤖 AI Chat
1. Tap "Chat" to open AI assistant
2. Ask for style advice, outfit suggestions, or fashion tips
3. AI can see uploaded outfits for personalized advice
4. Get real-time recommendations

### 📋 Occasion Planner
1. Select date and occasion
2. Choose weather conditions
3. Get AI-powered outfit suggestions
4. Based on personal style and wardrobe

### 👗 Lookbook
- Browse all uploaded outfits
- Organized by date
- Tap any outfit to view details
- See tags and notes

## 🔧 Customization

### PWA Settings
Edit `web-interface/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "YourApp",
  "theme_color": "#8b2635",
  "background_color": "#FFFFFF"
}
```

### Service Worker Cache
Edit `web-interface/sw.js` to modify caching strategy:
```javascript
const CACHE_NAME = 'your-app-v1';
const urlsToCache = [
  '/app.html',
  '/manifest.json',
  // Add more assets
];
```

### Core Backend (Express.js)
The main app runs on a simple Express.js server with:
- **Firebase Storage**: Photo upload and management
- **OpenAI Integration**: GPT-4 Vision for style analysis
- **Anonymous Authentication**: No signup required
- **PWA Support**: Service worker and manifest handling

### Optional MCP Components
The `src/` folder contains optional MCP (Model Context Protocol) components for advanced features (development only):
- **Outfit Analysis**: Advanced style pattern recognition  
- **Recommendation Engine**: Personalized suggestions
- **Wardrobe Management**: Track and organize clothing items
- **Style Evolution**: Monitor style changes over time

## 🔐 Privacy & Security

- ✅ **Firebase Security**: Photos stored securely in Firebase Storage
- ✅ **Anonymous Auth**: No personal data collection required
- ✅ **HTTPS**: All traffic encrypted
- ✅ **Environment Variables**: API keys stored securely
- ✅ **Client-Side Processing**: Most processing happens in browser

## 📊 Advanced Features

### AI Assistant Capabilities
- **Style Analysis**: AI analyzes outfits and provides feedback
- **Weather Recommendations**: Suggests appropriate clothing for weather
- **Color Coordination**: Helps with color matching and combinations
- **Occasion Matching**: Recommends outfits for specific events
- **Personal Style Evolution**: Tracks style journey over time

### PWA Benefits
- **Offline Access**: Works without internet connection
- **Home Screen Install**: Native app experience
- **Push Notifications**: Stay updated with style tips
- **Fast Loading**: Cached assets for instant loading
- **Mobile Optimized**: Perfect touch experience

## 🎯 Potential Enhancements

- [ ] **Outfit Sharing**: Share looks with friends
- [ ] **Style Analytics**: Detailed insights into style patterns
- [ ] **Shopping Assistant**: AI-powered shopping recommendations
- [ ] **Wardrobe Planner**: Plan outfits for the week
- [ ] **Style Challenges**: Gamify the style journey
- [ ] **Social Features**: Connect with other fashion enthusiasts
- [ ] **Weather Integration**: Real-time weather-based suggestions
- [ ] **Calendar Sync**: Plan outfits for upcoming events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 Vision API
- **Firebase** for cloud storage and authentication
- **Vercel** for seamless deployment
- **Progressive Web App** standards and community

---

*Build your own AI-powered style companion! 📱✨*

## 💡 Getting Help

If you're building your own Stylisti app and need help:
1. Check the existing code comments for guidance
2. Review the included examples
3. Open an issue for technical questions
4. Contribute improvements back to the project

**Happy building!** 🎉