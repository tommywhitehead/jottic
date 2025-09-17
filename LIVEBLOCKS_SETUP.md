# Liveblocks Collaborative Setup Guide

## Overview
Your Jottic app is ready for Liveblocks integration! The basic typing functionality is working, and this guide will help you set up real-time collaborative editing with live cursors and co-op editing.

## What's Been Added

### ✅ Features Implemented
- **Basic text editing** - Full typing functionality with auto-save to Supabase
- **UI fading** - Header and document title fade when typing
- **Tab support** - Proper tab insertion in the text editor
- **Auto-resize** - Textarea automatically resizes to fit content
- **Supabase integration** - Documents are saved to your Supabase database
- **Liveblocks-ready** - All components are prepared for collaborative features

### 🚧 Features Ready for Liveblocks
- **Real-time collaborative text editing** - Multiple users can edit the same document simultaneously
- **Live cursors** - See where other users are typing in real-time
- **User presence indicators** - Visual indicators showing who's currently in the document
- **Automatic conflict resolution** - Liveblocks handles merge conflicts automatically
- **Room-based collaboration** - Each document URL creates a unique collaboration room

### 🏗️ Architecture
- **RoomProvider** wraps the entire app and manages collaboration state
- **CollaborativeEditor** component handles real-time editing
- **Liveblocks client** manages WebSocket connections and data synchronization
- **Supabase integration** persists changes to your database

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Liveblocks Configuration (for production)
LIVEBLOCKS_SECRET_KEY=your-liveblocks-secret-key
```

### 2. Liveblocks Account Setup
1. Go to [liveblocks.io](https://liveblocks.io) and create an account
2. Create a new project
3. Get your secret key from the dashboard
4. Update your `.env.local` file with the secret key

### 3. Production Authentication
For production, you'll need to implement proper authentication. The current setup uses mock authentication for development.

Create an API endpoint (e.g., `/api/liveblocks-auth`) that:
1. Verifies the user's identity from your auth system
2. Returns a Liveblocks token

Example implementation:
```javascript
// api/liveblocks-auth.js
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export default async function handler(req, res) {
  // Verify user identity from your auth system
  const session = await getSession(req);
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Create a room session
  const room = liveblocks.prepareSession(req.body.room, {
    userId: session.user.id,
    userInfo: {
      name: session.user.name,
      color: session.user.color,
    },
  });

  // Grant permissions
  room.allow(req.body.room, room.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await room.authorize();
  return res.status(status).end(body);
}
```

## How It Works

### Document Rooms
- Each document URL creates a unique room (e.g., `/my-document` → `document-my-document`)
- Users in the same room see each other's cursors and edits in real-time
- Changes are automatically synchronized across all connected clients

### Data Flow
1. User types in the editor
2. Changes are sent to Liveblocks via WebSocket
3. Liveblocks broadcasts changes to all connected clients
4. Changes are also saved to Supabase (with debouncing)
5. Other users see the changes in real-time

### Cursor Tracking
- Mouse movements are tracked and sent to other users
- Each user gets a unique color for their cursor
- Cursor positions are updated in real-time

## Testing Collaboration

### Local Testing
1. Open your app in multiple browser tabs/windows
2. Navigate to the same document URL
3. Start typing in one tab - you should see changes in the other tab
4. Move your mouse - you should see cursor positions in other tabs

### Multi-User Testing
1. Share your development URL with others
2. Have them navigate to the same document
3. All users should see each other's cursors and edits in real-time

## Customization

### Styling
The collaborative features use CSS classes that you can customize:
- `.live-cursor` - Individual cursor styling
- `.cursor-pointer` - Cursor line styling
- `.cursor-label` - User name label styling
- `.presence-indicators` - User presence indicators
- `.presence-indicator` - Individual user indicator

### User Colors
User colors are randomly generated. You can customize this in `src/lib/liveblocks.ts`:
```typescript
const userInfo = {
  name: `User ${Math.floor(Math.random() * 1000)}`,
  color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Customize this
};
```

### Room Configuration
Room settings can be customized in `src/App.tsx`:
```typescript
<RoomProvider 
  id={roomId}
  initialPresence={{
    cursor: null,
    selection: null,
    user: {
      name: `User ${Math.floor(Math.random() * 1000)}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    },
  }}
  initialStorage={{
    content: '',
    lastModified: Date.now(),
  }}
>
```

## Troubleshooting

### Common Issues
1. **Cursors not showing**: Check browser console for WebSocket connection errors
2. **Changes not syncing**: Verify Liveblocks secret key is correct
3. **TypeScript errors**: Run `npm install` to ensure all dependencies are installed

### Debug Mode
Enable Liveblocks debug mode by adding this to your environment:
```bash
LIVEBLOCKS_DEBUG=1
```

## Next Steps

1. **Set up production authentication** - Implement proper user authentication
2. **Add user management** - Allow users to set their names and colors
3. **Add document permissions** - Control who can edit which documents
4. **Add real-time notifications** - Notify users when others join/leave
5. **Add conflict resolution UI** - Show users when conflicts occur

## Support

- [Liveblocks Documentation](https://liveblocks.io/docs)
- [Liveblocks Discord](https://discord.gg/liveblocks)
- [Supabase Documentation](https://supabase.com/docs)

Your collaborative note-taking app is now ready! 🎉
