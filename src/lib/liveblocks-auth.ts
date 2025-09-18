// Liveblocks authentication for production
import { Liveblocks } from "@liveblocks/node";
import { supabase } from "./supabase";

const liveblocks = new Liveblocks({
  secret: import.meta.env.VITE_LIVEBLOCKS_SECRET_KEY || "sk_dev_mock_secret_key_for_development_only",
});

export async function authenticateUser(room: string, userId: string, userInfo: any) {
  try {
    // Create a room session
    const session = liveblocks.prepareSession(room, {
      userId,
      userInfo,
    });

    // Grant permissions
    session.allow(room, session.FULL_ACCESS);

    // Authorize the user and return the result
    const { status, body } = await session.authorize();
    return { status, body };
  } catch (error) {
    console.error("Liveblocks authentication error:", error);
    return { status: 500, body: { error: "Authentication failed" } };
  }
}

// New function to get user info from Supabase session
export async function getUserInfoFromSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }

    const user = session.user;
    return {
      id: user.id,
      info: {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color for now
        avatar: user.user_metadata?.avatar_url || null,
      },
    };
  } catch (error) {
    console.error("Error getting user info from session:", error);
    return null;
  }
}