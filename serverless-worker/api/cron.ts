/**
 * Vercel Cron Job handler
 * This file simply calls the dump.ts endpoint with the appropriate parameters
 * 
 * @param req - The request object from Vercel
 * @param res - The response object from Vercel
 */
export default async function handler(req, res) {
    console.log("Cron job started");
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the cron job key
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const key = searchParams.get("key");
  
  if (key !== "123") {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // For local development, we need to use the full URL
    // For production, we can use a relative URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://${req.headers.host}`;
    
    // Call the dump endpoint for each network and depth combination
    const networks = ["devnet", "mainnet"];
    const depths = [20, 10, 5];
    
    // Process one network and depth at a time to avoid timeout
    const network = networks[0]; // Start with the first network
    const depth = depths[0]; // Start with the first depth
    
    // Construct the URL for the dump endpoint
    const dumpUrl = `${baseUrl}/api/dump?network=${network}&depth=${depth}`;
    
    console.log(`Calling dump endpoint: ${dumpUrl}`);
    
    // Call the dump endpoint
    const response = await fetch(dumpUrl);
    const result = await response.json();
    
    console.log(`Cron job processed: network=${network}, depth=${depth}, result:`, result);
    
    return res.status(200).json({ 
      success: true, 
      message: "Cron job completed successfully",
      processed: {
        network,
        depth
      }
    });
  } catch (error: any) {
    console.error("Error processing cron job:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
} 