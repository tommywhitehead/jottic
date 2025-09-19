# Debug Panel

## Overview

The debug panel is a hidden development tool that provides real-time information about the application state. It's accessible via hotkey and is useful for troubleshooting authentication, storage, and performance issues.

## Access

### Hotkey
- **Mac**: `Cmd + Shift + !`
- **Windows/Linux**: `Ctrl + Shift + !`

### Close
- Press `Esc` or click the `✕` button

## Features

### Authentication Status
- User login status
- Session presence
- Loading states
- Current URL and environment

### Storage Information
- Intended URL (for URL preservation)
- SessionStorage key count
- LocalStorage key count

### Performance Metrics
- Memory usage (if available)
- Real-time updates

### Actions
- **🔄 Reload**: Refresh the page
- **🗑️ Clear Storage**: Clear all storage and reload
- **🚨 Force Logout**: Emergency logout (if logged in)

### Raw Debug Data
- Expandable JSON with complete debug information
- Includes user details, session data, performance metrics
- Useful for detailed troubleshooting

## Use Cases

### Authentication Issues
- Check if user is properly logged in
- Verify session state
- Test force logout functionality

### URL Preservation Problems
- Check if intended URL is stored correctly
- Verify storage state

### Performance Debugging
- Monitor memory usage
- Check for memory leaks

### General Troubleshooting
- Clear storage to reset state
- Force reload to reset application
- Access detailed debug information

## Production Use

The debug panel is available in production but hidden by default. It can be accessed using the hotkey combination, making it useful for:

- Customer support troubleshooting
- Production issue diagnosis
- Performance monitoring
- Authentication debugging

## Technical Details

- Uses global keyboard event listeners
- Updates in real-time as application state changes
- Includes error handling for storage access
- Responsive design with scrollable content
- High z-index to appear above all content
