/**
 * Simple test endpoint to verify that the serverless function is working correctly
 * 
 * @param req - The request object from Vercel
 * @param res - The response object from Vercel
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({ 
      success: true, 
      message: 'Test endpoint is working correctly',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error in test endpoint:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 