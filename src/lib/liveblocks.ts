import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Create Liveblocks client
const client = createClient({
  publicApiKey: import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY || 'pk_test_2uHhOQ-SrPlXZZyyNBgdFst8o5D9VReJnvcgdkFHuTqebbAPpSpX4N-MTV3uA8EE',
  throttle: 16, // 60fps
  resolveUsers: async ({ userIds }) => {
    // Force all guest colors to be light gray (ghost-like)
    return userIds.map((userId) => ({
      id: userId,
      info: {
        name: `User ${userId.slice(-3)}`,
        color: '#CCCCCC', // Light gray for all guests
      },
    }));
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
