# Google OAuth Setup for Liveblocks Authentication

This guide will help you set up Google OAuth authentication to resolve Liveblocks rate limiting issues.

## Prerequisites

- Supabase project already set up
- Liveblocks account with secret key
- Google Cloud Console access

## Step 1: Set up Google OAuth in Supabase

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication → Providers
   - Find "Google" in the list and click "Enable"

2. **Configure Google OAuth**
   - You'll need to set up a Google Cloud project first (see Step 2)
   - Enter your Google Client ID and Client Secret
   - Set redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

3. **Add your domain to allowed redirect URLs**
   - In the Supabase dashboard, go to Authentication → URL Configuration
   - Add your production domain and localhost for development:
     - `http://localhost:5173/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)

## Step 2: Set up Google Cloud Console

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`

4. **Get your credentials**
   - Copy the Client ID and Client Secret
   - Add them to your Supabase Google provider settings

## Step 3: Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Supabase (you should already have these)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Liveblocks (you should already have these)
VITE_LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key

# For production deployment, also add:
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

## Step 4: Test the Authentication Flow

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test the login flow**
   - Click the "login" button in the header
   - You should be redirected to Google OAuth
   - After authentication, you'll be redirected back to your app
   - The header should show your name and a "logout" button

3. **Verify Liveblocks authentication**
   - Open browser dev tools → Network tab
   - Create a new note or edit an existing one
   - Look for requests to `/api/liveblocks-auth`
   - They should return 200 status (not 401/403)

## Step 5: Deploy to Production

1. **Update your deployment environment variables**
   - Add all the environment variables from Step 3
   - Make sure to use production URLs

2. **Update Google OAuth settings**
   - Add your production domain to authorized redirect URIs in Google Cloud Console
   - Update Supabase URL configuration with your production domain

## How It Works

1. **User clicks "login"** → Redirected to Google OAuth
2. **Google authenticates** → Redirects back to Supabase
3. **Supabase creates session** → User is logged in
4. **Liveblocks requests auth** → API endpoint verifies Supabase session
5. **Liveblocks gets token** → User can collaborate without rate limits

## Troubleshooting

### "Invalid token" errors
- Check that your Supabase session is valid
- Verify environment variables are set correctly
- Make sure the user is actually logged in

### OAuth redirect issues
- Verify redirect URLs in Google Cloud Console
- Check Supabase URL configuration
- Ensure your domain is added to allowed origins

### Rate limits still occurring
- Verify you're using the secret key (not public key)
- Check that the auth endpoint is being called
- Look for 401/403 errors in network tab

## Benefits

- ✅ **No more rate limits** - Uses private key with authentication
- ✅ **Real user identities** - Shows actual names in collaboration
- ✅ **Secure** - Proper OAuth flow with JWT tokens
- ✅ **Scalable** - Works for any number of users
- ✅ **User management** - Built-in with Supabase

## Next Steps

Once authentication is working:
1. Consider adding user avatars to the collaboration cursors
2. Implement user-specific note permissions
3. Add user profiles and settings
4. Consider adding other OAuth providers (GitHub, etc.)
