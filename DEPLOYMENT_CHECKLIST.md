# Production Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all placeholder values in `.env.local`
- [ ] Set up environment variables in Vercel dashboard:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_LIVEBLOCKS_SECRET_KEY`
  - [ ] `VITE_OAUTH_REDIRECT_URL` (set to your production domain)
  - [ ] `SUPABASE_URL` (same as VITE_SUPABASE_URL)
  - [ ] `SUPABASE_ANON_KEY` (same as VITE_SUPABASE_ANON_KEY)
  - [ ] `LIVEBLOCKS_SECRET_KEY` (same as VITE_LIVEBLOCKS_SECRET_KEY)

### 2. OAuth Configuration
- [ ] Google Cloud Console:
  - [ ] Add production domain to authorized redirect URIs
  - [ ] Keep existing Supabase callback URL
- [ ] Supabase Dashboard:
  - [ ] Update Site URL to production domain
  - [ ] Add production domain to Redirect URLs

### 3. Code Changes
- [ ] Verify `AuthContext.tsx` uses environment variable for redirect URL
- [ ] Verify `vercel.json` includes API function configuration
- [ ] Test locally with production environment variables

## Deployment

### 4. Deploy to Vercel
- [ ] Push changes to Git repository
- [ ] Verify Vercel build completes successfully
- [ ] Check that API routes are accessible

### 5. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test login flow (should redirect to Google OAuth)
- [ ] Verify OAuth callback works (redirects back to app)
- [ ] Test note creation/editing (Liveblocks authentication)
- [ ] Check browser console for any errors

## Troubleshooting

If OAuth still redirects to localhost:
1. Check that `VITE_OAUTH_REDIRECT_URL` is set correctly in Vercel
2. Verify the environment variable is being used in the code
3. Clear browser cache and try again

If API routes don't work:
1. Check Vercel function logs
2. Verify `vercel.json` configuration
3. Ensure environment variables are set for server-side usage

If you see CORS errors:
1. Add your production domain to Supabase allowed origins
2. Check that all redirect URLs are properly configured
