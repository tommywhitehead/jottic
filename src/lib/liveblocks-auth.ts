// Liveblocks authentication for production
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || import.meta.env.VITE_LIVEBLOCKS_SECRET_KEY,
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