// Liveblocks authentication endpoint with Supabase integration
import { Liveblocks } from "@liveblocks/node";
import { createClient } from "@supabase/supabase-js";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    
    if (status !== 200) {
      console.error('Liveblocks authorization failed:', body);
      return res.status(status).json(body);
    }

    // Return the Liveblocks token in the expected format
    return res.status(200).json({
      token: body.token,
      user: {
        id: user.id,
        info: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          avatar: user.user_metadata?.avatar_url || null,
        },
      },
    });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}