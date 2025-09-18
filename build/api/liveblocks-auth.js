// Liveblocks authentication endpoint with Supabase integration
const { Liveblocks } = require("@liveblocks/node");
const { createClient } = require("@supabase/supabase-js");

// Check environment variables
console.log('Environment check:', {
  hasLiveblocksSecret: !!process.env.LIVEBLOCKS_SECRET_KEY,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  liveblocksSecretPrefix: process.env.LIVEBLOCKS_SECRET_KEY?.substring(0, 10) + '...',
  supabaseUrl: process.env.SUPABASE_URL
});

if (!process.env.LIVEBLOCKS_SECRET_KEY) {
  throw new Error('LIVEBLOCKS_SECRET_KEY environment variable is required');
}

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  console.log('Function called with method:', req.method);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Processing POST request');
    // Get the authorization header
    const authorization = req.headers.authorization;
    
    if (!authorization) {
      return res.status(401).json({ error: "No authorization header" });
    }

    // Extract the token from the header
    const token = authorization.replace("Bearer ", "");
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Supabase auth error:', error);
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get room from request body
    const { room } = req.body;
    if (!room) {
      return res.status(400).json({ error: "Room is required" });
    }

    // Create a Liveblocks session for the user
    const session = liveblocks.prepareSession(room, {
      userId: user.id,
      userInfo: {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        avatar: user.user_metadata?.avatar_url || null,
      },
    });

    // Grant full access to the room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the session and get the token
    const { status, body } = await session.authorize();
    
    console.log('Liveblocks authorization response:', { status, bodyType: typeof body, body });
    
    if (status !== 200) {
      console.error('Liveblocks authorization failed:', body);
      return res.status(status).json(body);
    }

    // Extract token from response - body might be a string or object
    let token = body;
    if (typeof body === 'object' && body.token) {
      token = body.token;
    } else if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        token = parsed.token;
      } catch (e) {
        // If it's not JSON, use the string as token
        token = body;
      }
    }

    if (!token) {
      console.error('No token in Liveblocks response:', body);
      return res.status(500).json({ error: "No token received from Liveblocks" });
    }

    // Return the Liveblocks token in the expected format
    const response = {
      token: token,
      user: {
        id: user.id,
        info: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          avatar: user.user_metadata?.avatar_url || null,
        },
      },
    };
    
    console.log('Sending response:', { hasToken: !!response.token, tokenLength: response.token?.length, user: response.user });
    
    return res.status(200).json(response);
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
