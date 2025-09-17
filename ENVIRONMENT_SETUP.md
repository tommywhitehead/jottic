# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Liveblocks Configuration
VITE_LIVEBLOCKS_PUBLIC_KEY=your-liveblocks-public-key
VITE_LIVEBLOCKS_SECRET_KEY=your-liveblocks-secret-key
```

## How to Get These Values

### Supabase
1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy the Project URL and anon/public key

### Liveblocks
1. Go to your Liveblocks dashboard
2. Go to your project settings
3. Copy the **public key** (starts with `pk_`)
4. Copy the **secret key** (starts with `sk_`)

## Testing the Setup

1. Add your environment variables to `.env.local`
2. Restart your development server (`npm run dev`)
3. Open multiple browser tabs to the same document URL
4. Start typing in one tab - you should see live cursors and real-time updates in other tabs!

## Troubleshooting

- Make sure all environment variables start with `VITE_`
- Restart the development server after adding environment variables
- Check the browser console for any authentication errors
- Verify your Liveblocks secret key is correct
