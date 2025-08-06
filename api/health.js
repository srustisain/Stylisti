export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    server: 'Stylisti App',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL === '1' ? 'Vercel' : 'Local'
  });
} 