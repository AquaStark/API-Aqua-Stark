/**
 * @fileoverview Server Banner - Beautiful startup display
 * 
 * Displays an attractive server status banner on startup.
 */

import { PORT, NODE_ENV } from '../config';
import { validateSupabaseConnection } from './supabase-client';

/**
 * Displays a beautiful server startup banner.
 */
export async function displayServerBanner(): Promise<void> {
  const isDevelopment = NODE_ENV === 'development';
  const isProduction = NODE_ENV === 'production';
  
  // Check Supabase connection
  const supabaseConnected = await validateSupabaseConnection();
  const supabaseStatus = supabaseConnected ? '✅ CONNECTED' : '❌ DISCONNECTED';
  
  const status = isDevelopment ? '🟢 RUNNING' : isProduction ? '🔵 PRODUCTION' : '🟡 STARTING';
  const env = NODE_ENV.toUpperCase();
  const port = PORT.toString();
  const localUrl = `http://localhost:${port}`;
  const networkUrl = `http://0.0.0.0:${port}`;
  const startTime = new Date().toLocaleString();
  
  const banner = `
 █████╗  ██████╗ ██╗   ██╗ █████╗     ███████╗████████╗ █████╗ ██████╗ ██╗  ██╗
██╔══██╗██╔═══██╗██║   ██║██╔══██╗    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝
███████║██║   ██║██║   ██║███████║    ███████╗   ██║   ███████║██████╔╝█████╔╝ 
██╔══██║██║▄▄ ██║██║   ██║██╔══██║    ╚════██║   ██║   ██╔══██║██╔══██╗██╔═██╗ 
██║  ██║╚██████╔╝╚██████╔╝██║  ██║    ███████║   ██║   ██║  ██║██║  ██║██║  ██╗
╚═╝  ╚═╝ ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
                                                                               
🚀  Server Status:     ${status}
🌐  Environment:       ${env}
🔌  Port:              ${port}
🗄️  Supabase:          ${supabaseStatus}
📍  Local URL:         ${localUrl}
🌍  Network URL:       ${networkUrl}

📋  Available Endpoints:
   
   General:
   • GET  /health                        Health check
   • GET  /api                           API info
   
   Authentication:
   • POST /api/auth/login                Player login/registration
   
   Players:
   • GET  /api/player/:address           Get player by address
   
   Fish:
   • GET  /api/fish/:id                  Get fish details by ID
   • GET  /api/fish/:id/family           Get complete family tree of a fish
   • GET  /api/player/:address/fish      Get all fish owned by a player
   • POST /api/fish/feed                 Feed multiple fish in batch
   • POST /api/fish/breed                Breed two fish together
   • POST /api/asset/fish/:id/sprite     Upload fish sprite/3D asset
   
   Tanks:
   • GET  /api/tank/:id                  Get tank details by ID
   
   Decorations:
   • GET  /api/decoration/:id            Get decoration details by ID
   • GET  /api/player/:address/decorations Get all decorations owned by a player
   • POST /api/decoration/:id/activate    Activate a decoration

⏰  Started at:        ${startTime}
  `;

  console.log(banner);
  
  if (isDevelopment) {
    console.log('💡  Development mode: Hot reload enabled\n');
  }
}
