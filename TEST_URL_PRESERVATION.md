# URL Preservation Test

## How to Test

1. **Start the development server:**
   ```bash
   npm run dev -- --port 3001
   ```

2. **Test URL Preservation:**
   - Open browser and go to `http://localhost:3001/test/note/123`
   - You should be redirected to `/login`
   - Click "Sign in with Google"
   - After authentication, you should be redirected back to `/test/note/123`

3. **Test Different URLs:**
   - Try: `http://localhost:3001/another/test/url`
   - Try: `http://localhost:3001/some/deep/nested/path`
   - Try: `http://localhost:3001/` (should redirect to a random note after login)

4. **Test Logout:**
   - While logged in, click "logout"
   - You should be redirected to `/login`
   - Try visiting any protected URL again

## Expected Behavior

- ✅ Unauthenticated users visiting any URL should see login page
- ✅ After login, users should be redirected to their originally intended URL
- ✅ Logout should redirect to login page
- ✅ Root URL (`/`) should redirect to a random note after login
- ✅ URL preservation should work for any depth of nested paths

## Debugging

If URL preservation doesn't work, check the browser console for any error messages. The flow should be:

1. `ProtectedRoute` redirects to `/login` with location state
2. `LoginPage` stores the intended URL in sessionStorage
3. `AuthCallback` retrieves and redirects to the stored URL
