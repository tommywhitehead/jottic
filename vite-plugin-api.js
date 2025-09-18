import { Liveblocks } from "@liveblocks/node";
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

export function apiPlugin(env = {}) {
  return {
    name: 'api-plugin',
    writeBundle() {
      // Copy API function to build directory after build
      const apiDir = path.join(process.cwd(), 'api');
      const buildApiDir = path.join(process.cwd(), 'build', 'api');
      
      if (fs.existsSync(apiDir)) {
        if (!fs.existsSync(buildApiDir)) {
          fs.mkdirSync(buildApiDir, { recursive: true });
        }
        
        const files = fs.readdirSync(apiDir);
        files.forEach(file => {
          if (file.endsWith('.js')) {
            fs.copyFileSync(
              path.join(apiDir, file),
              path.join(buildApiDir, file)
            );
            console.log(`Copied API function: ${file}`);
          }
        });
      }
    },
    configureServer(server) {
      // Get environment variables from Vite
      const liveblocksSecret = env.LIVEBLOCKS_SECRET_KEY || env.VITE_LIVEBLOCKS_SECRET_KEY || "sk_dev_mock_secret_key_for_development_only";
      const supabaseUrl = env.VITE_SUPABASE_URL;
      const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

      console.log('Environment variables loaded:', {
        hasLiveblocksSecret: !!liveblocksSecret,
        liveblocksSecretPrefix: liveblocksSecret?.substring(0, 10) + '...',
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseAnonKey: !!supabaseAnonKey
      });

      // Initialize Liveblocks with the real secret key
      const liveblocks = new Liveblocks({
        secret: liveblocksSecret,
      });

      // Initialize Supabase client
      const supabase = createClient(
        supabaseUrl,
        supabaseAnonKey
      );

      server.middlewares.use('/api/liveblocks-auth', async (req, res, next) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === 'POST') {
          try {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const { room } = JSON.parse(body);
                const authorization = req.headers.authorization;
                
                console.log('Auth request received:', { room, hasAuth: !!authorization });
                
                if (!authorization) {
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: "No authorization header" }));
                  return;
                }

                if (!room) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: "Room is required" }));
                  return;
                }

                // Extract the token from the header
                const token = authorization.replace("Bearer ", "");
                
                console.log('Received token:', {
                  tokenLength: token.length,
                  tokenPrefix: token.substring(0, 20) + '...',
                  tokenSuffix: '...' + token.substring(token.length - 20),
                  isSupabaseAnonKey: token === supabaseAnonKey,
                  isSupabaseAnonKeyPrefix: token.startsWith(supabaseAnonKey?.substring(0, 20))
                });
                
                // For development, allow any token (including mock tokens)
                let user;
                
                if (token === "mock-token-for-development" || token.startsWith("mock-")) {
                  // Mock user for development
                  user = {
                    id: `guest-${Date.now()}`,
                    info: {
                      name: `Guest ${Date.now().toString().slice(-3)}`,
                      color: '#CCCCCC',
                    },
                  };
                } else {
                  // Verify the token with Supabase
                  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
                  
                  if (error || !supabaseUser) {
                    console.error('Supabase auth error:', error);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Invalid token" }));
                    return;
                  }
                  
                  user = {
                    id: supabaseUser.id,
                    info: {
                      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                      avatar: supabaseUser.user_metadata?.avatar_url || null,
                    },
                  };
                }

                // Create a Liveblocks session for the user
                console.log('Creating Liveblocks session for user:', user.id, 'in room:', room);
                
                try {
                  const session = liveblocks.prepareSession(room, {
                    userId: user.id,
                    userInfo: user.info,
                  });

                  // Grant full access to the room - this is the correct way
                  session.allow(room, session.FULL_ACCESS);
                  
                  console.log('Session permissions granted for room:', room);
                  
                  // Authorize the session and get the token
                  const { status, body } = await session.authorize();
                  
                  console.log('Session authorize result:', { status, hasBody: !!body, bodyKeys: body ? Object.keys(body) : 'no body' });
                  
                  if (status !== 200) {
                    console.error('Liveblocks authorization failed:', body);
                    res.writeHead(status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(body));
                    return;
                  }
                  
                  // The body might be a stringified JSON object with a token property
                  let token = body;
                  
                  // Check if body is a stringified JSON object
                  if (typeof body === 'string' && body.startsWith('{"token":"')) {
                    try {
                      const parsed = JSON.parse(body);
                      token = parsed.token;
                      console.log('Parsed token from JSON object:', token.substring(0, 50) + '...');
                    } catch (e) {
                      console.error('Failed to parse token JSON:', e);
                      res.writeHead(500, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ 
                        error: "Failed to parse token response",
                        details: e.message
                      }));
                      return;
                    }
                  }
                  
                  if (!token || typeof token !== 'string') {
                    console.error('Invalid token in response:', body);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                      error: "Invalid token in Liveblocks response",
                      details: "Expected string token, got: " + typeof token
                    }));
                    return;
                  }
                  
                  // Check if we accidentally got the Supabase anon key
                  if (token === supabaseAnonKey) {
                    console.error('ERROR: Returning Supabase anon key instead of Liveblocks token!');
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                      error: "Token generation failed - returned Supabase anon key",
                      details: "This should not happen"
                    }));
                    return;
                  }
                  
                  console.log('Successfully created Liveblocks token');
                  console.log('Token length:', token.length);
                  console.log('Token preview:', token.substring(0, 50) + '...');
                  
                  const response = {
                    token: token,
                    user: user,
                  };
                  console.log('Response being sent:', { 
                    hasToken: !!response.token, 
                    tokenLength: response.token?.length,
                    user: response.user,
                    room: room
                  });
                  
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(response));
                } catch (authError) {
                  console.error('Liveblocks session error:', authError);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    error: "Liveblocks token creation failed", 
                    details: authError.message 
                  }));
                  return;
                }
              } catch (error) {
                console.error("API error:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Authentication failed" }));
              }
            });
          } catch (error) {
            console.error("API error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Authentication failed" }));
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });
    }
  };
}
