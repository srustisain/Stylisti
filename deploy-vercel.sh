#!/bin/bash

echo "🚀 Stylisti App - Vercel Deployment"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Environment Variables Required:"
echo "   - OPENAI_API_KEY (for AI chat functionality)"
echo "   - FIREBASE_API_KEY (for photo storage)"
echo "   - FIREBASE_AUTH_DOMAIN"
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_STORAGE_BUCKET"
echo "   - FIREBASE_MESSAGING_SENDER_ID"
echo "   - FIREBASE_APP_ID"
echo ""

echo "🔑 Login Password: Set in the code"
echo "   (Check web-interface/app.html for the password)"
echo ""

read -p "Ready to deploy? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Vercel..."
    
    # Deploy to Vercel
    vercel --prod
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📱 Next Steps:"
    echo "   1. Go to your Vercel dashboard"
    echo "   2. Add your environment variables in Settings > Environment Variables"
    echo "   3. Your app will be available at your Vercel URL"
    echo "   4. Test the login with your password"
    echo "   5. Add to Home Screen for PWA experience!"
    echo ""
    echo "🎉 Your Stylisti app with login is now live worldwide!"
    echo ""
    echo "🔗 To update the password:"
    echo "   Edit web-interface/app.html and change the password in the code"
    echo "   Then redeploy with: vercel --prod"
else
    echo "❌ Deployment cancelled"
fi 