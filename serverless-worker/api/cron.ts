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
    console.log("Cron job started");
    
    // Call the dump endpoint for each network and depth combination
    const networks = ["devnet", "mainnet"];
    const depths = [20, 10, 5];
    
    for (const network of networks) {
      for (const depth of depths) {
        try {
          // Construct the URL for the dump endpoint
          const dumpUrl = new URL(`/api/dump?network=${network}&depth=${depth}`, `http://${req.headers.host}`);
          
          // Call the dump endpoint
          const response = await fetch(dumpUrl.toString());
          const result = await response.json();
          
          console.log(`Cron job processed: network=${network}, depth=${depth}, result:`, result);
        } catch (error: any) {
          console.error(`Cron job error: network=${network}, depth=${depth}, error:`, error);
        }
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Cron job completed successfully"
    });
  } catch (error: any) {
    console.error("Error processing cron job:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
} 