# Authentication Flow

This document describes the improved authentication flow implemented in Jottic.

## Overview

The authentication system now provides:
- Dedicated `/login` and `/logout` routes independent of Liveblocks
- URL preservation - users are redirected to their intended destination after login
- Protected routes that require authentication
- Graceful handling of authentication states

## Routes

### Public Routes
- `/login` - Login page with Google OAuth
- `/logout` - Logout page that signs out and redirects to login
- `/auth/callback` - OAuth callback handler

### Protected Routes
- `/*` - All other routes require authentication

## URL Preservation

When a user visits a protected URL while not authenticated:

1. They are redirected to `/login`
2. The intended URL is stored in `sessionStorage` as `intendedUrl`
3. After successful authentication via `/auth/callback`
4. The user is redirected to their originally intended URL
5. The stored URL is cleared from `sessionStorage`

## Components

### LoginPage
- Displays login form with Google OAuth
- Redirects authenticated users to intended destination
- Stores intended URL before initiating OAuth flow

### LogoutPage
- Handles logout process
- Clears session and intended URL
- Redirects to login page

### ProtectedRoute
- Wrapper component for protected content
- Redirects unauthenticated users to login
- Shows loading state during authentication check

### AuthCallback
- Handles OAuth callback
- Redirects to intended URL or home after successful authentication
- Handles authentication errors gracefully

## Usage

The authentication flow is now completely transparent to the user:

1. User visits any URL (e.g., `/test/note`)
2. If not authenticated, they see the login page
3. After login, they're taken to `/test/note`
4. If they click logout, they're taken to the login page
5. The next time they visit any URL, they'll be redirected after login

## Implementation Details

- Uses React Router for navigation
- Supabase for authentication
- Session storage for URL preservation
- React Context for authentication state management
