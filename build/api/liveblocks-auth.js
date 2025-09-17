// Simple Liveblocks authentication endpoint for development
// This is a mock endpoint - in production, implement proper authentication

export default async function handler(req, res) {
  // For development, create a simple user session
  const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
  const userInfo = {
    name: `User ${Math.floor(Math.random() * 1000)}`,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
  };

  // Mock response for development
  return res.status(200).json({
    token: `mock-token-${req.body.room}-${userId}`,
    user: {
      id: userId,
      info: userInfo,
    },
  });
}
