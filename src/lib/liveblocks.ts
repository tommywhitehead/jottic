import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { supabase } from "./supabase";

// Create Liveblocks client with authentication
const client = createClient({
  // Use authentication endpoint for proper room access
  authEndpoint: async (room) => {
    try {
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      let authToken;
      if (error || !session?.access_token) {
        // In development, fall back to using the anon key as a token
        if (import.meta.env.DEV) {
          console.log('No session found, using anon key for development');
          authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
        } else {
          throw new Error("No valid session found");
        }
      } else {
        // In development, always use anon key instead of real session token
        if (import.meta.env.DEV) {
          console.log('Development mode: using anon key instead of session token');
          authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
        } else {
          authToken = session.access_token;
        }
      }

      // Make the request to our auth endpoint with the token
      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ room }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth endpoint error:', response.status, errorText);
        throw new Error(`Auth failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Auth endpoint response:', result);
      
      // Validate the response format
      if (!result || !result.token) {
        console.error('Invalid auth response format:', result);
        throw new Error('Invalid auth response: missing token');
      }

      return result;
    } catch (error) {
      console.error("Liveblocks auth error:", error);
      throw error;
    }
  },
  throttle: 16, // 60fps
  resolveUsers: async ({ userIds }) => {
    // Get user info from Supabase for authenticated users
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // For authenticated users, return their actual info
        return userIds.map((userId) => {
          if (userId === session.user.id) {
            return {
              id: userId,
              info: {
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                avatar: session.user.user_metadata?.avatar_url || null,
              },
            };
          }
          // For other users, return basic info
          return {
            id: userId,
            info: {
              name: `User ${userId.slice(-3)}`,
              color: '#CCCCCC',
            },
          };
        });
      }
    } catch (error) {
      console.error('Error resolving users:', error);
    }
    
    // Fallback for unauthenticated users
    return userIds.map((userId) => ({
      id: userId,
      info: {
        name: `User ${userId.slice(-3)}`,
        color: '#CCCCCC', // Light gray for all guests
      },
    }));
  },
  resolveMentionSuggestions: async ({ text, roomId }) => {
    // Disable mention functionality - return empty array
    return [];
  },
});

// Define the types for our collaborative document
type Presence = {
  cursor: { x: number; y: number } | null;
  selection: { anchor: number; focus: number } | null;
  user: {
    name: string;
    color: string;
  };
};

type Storage = {
  content: string;
  lastModified: number;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
  };
};

type RoomEvent = {};

// Create the room context
export const {
  RoomProvider,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useHistory,
  useCanUndo,
  useCanRedo,
  useRoom,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export { client };
