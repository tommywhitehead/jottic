# Logout Troubleshooting Guide

## Issue: Logout not working when deployed

### Potential Causes & Solutions

#### 1. **Route Handling Issues**
- **Problem**: The `/logout` route might not be properly handled in production
- **Solution**: The `LoginButton` now has a direct logout function that doesn't rely on the `/logout` route
- **Test**: Try clicking the logout button in the header instead of navigating to `/logout`

#### 2. **Session State Not Clearing**
- **Problem**: Supabase session might not be properly cleared in production
- **Solution**: Added immediate local state clearing in `AuthContext.signOut()`
- **Test**: Check if user state is cleared immediately after logout

#### 3. **Storage Issues**
- **Problem**: `sessionStorage` might not be available or working in production
- **Solution**: Added fallback to clear both `sessionStorage` and `localStorage`
- **Test**: Check browser dev tools for any storage-related errors

#### 4. **Navigation Issues**
- **Problem**: React Router navigation might not work properly in production
- **Solution**: Added error handling and fallback navigation
- **Test**: Check browser console for navigation errors

### Debug Steps

1. **Enable Debug Mode**:
   - Add `?debug` to any URL to see the debug panel
   - Example: `https://your-app.vercel.app/?debug`

2. **Check Console Logs**:
   - Look for any error messages during logout
   - Check for Supabase authentication errors

3. **Test Both Logout Methods**:
   - Method 1: Click "logout" in header (direct logout)
   - Method 2: Navigate to `/logout` URL (route-based logout)

4. **Verify State Clearing**:
   - Check if user state is cleared immediately
   - Verify redirect to login page happens

### Production-Specific Issues

#### Vercel Configuration
- Ensure `vercel.json` has proper rewrites for SPA routing
- Check if there are any server-side redirects interfering

#### Environment Variables
- Verify Supabase configuration is correct in production
- Check if OAuth redirect URLs are properly configured

#### Browser Compatibility
- Test in different browsers
- Check for any CSP (Content Security Policy) issues

### Fallback Solutions

If logout still doesn't work, try these alternatives:

1. **Force Page Reload**:
   ```javascript
   window.location.href = '/login';
   ```

2. **Clear All Storage**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Manual State Reset**:
   ```javascript
   // This would need to be added to AuthContext
   const forceLogout = () => {
     setUser(null);
     setSession(null);
     navigate('/login');
   };
   ```

### Testing Checklist

- [ ] Logout button shows "logging out..." state
- [ ] User state is cleared immediately
- [ ] Redirect to login page happens
- [ ] No console errors during logout
- [ ] Works in both development and production
- [ ] Works in different browsers
- [ ] Debug panel shows correct state (if enabled)

### Contact Information

If issues persist, check:
1. Browser console for errors
2. Network tab for failed requests
3. Supabase dashboard for authentication logs
4. Vercel deployment logs
