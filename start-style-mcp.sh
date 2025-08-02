#!/bin/bash

# Stylist MCP Startup Script
# Starts both the MCP server and web interface

echo "🎨 Starting Stylist MCP..."
echo ""

# Check if built
if [ ! -d "dist" ]; then
    echo "📦 Building TypeScript..."
    npm run build
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down Stylist MCP..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start MCP server in background
echo "🔧 Starting MCP server..."
npm start > mcp.log 2>&1 &
MCP_PID=$!

# Wait a moment for MCP to start
sleep 2

# Start web interface in background
echo "🌐 Starting web interface..."
npm run web > web.log 2>&1 &
WEB_PID=$!

# Wait a moment for web server to start
sleep 2

echo ""
echo "✅ Stylist MCP is running!"
echo ""
echo "📱 Web Interface: http://localhost:3000"
echo "🔧 MCP Server: Running on stdio"
echo "📁 Photos: data/photos/"
echo "💾 Database: data/style.db"
echo ""
echo "🔒 100% Local & Private - Your data stays on your machine"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for either process to exit
wait $MCP_PID $WEB_PID