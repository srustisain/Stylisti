#!/bin/bash

echo "🚀 Stylisti App Deployment Script"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Please make sure you have your environment variables ready:"
echo "   - OPENAI_API_KEY"
echo "   - FIREBASE_API_KEY"
echo "   - FIREBASE_AUTH_DOMAIN"
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_STORAGE_BUCKET"
echo "   - FIREBASE_MESSAGING_SENDER_ID"
echo "   - FIREBASE_APP_ID"
echo ""

read -p "Are you ready to deploy? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo ""
    echo "✅ Deployment complete!"
    echo "📱 Next steps:"
    echo "   1. Go to your Vercel dashboard"
    echo "   2. Add your environment variables"
    echo "   3. Open your app URL on your iPhone"
    echo "   4. Add to Home Screen!"
    echo ""
    echo "🎉 Your Stylisti app is now live worldwide!"
else
    echo "❌ Deployment cancelled"
fi