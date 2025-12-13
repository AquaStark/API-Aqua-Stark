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
🐟  AQUA STARK BACKEND API  🐠

🚀  Server Status:     ${status}
🌐  Environment:       ${env}
🔌  Port:              ${port}
🗄️  Supabase:          ${supabaseStatus}
📍  Local URL:         ${localUrl}
🌍  Network URL:       ${networkUrl}

📋  Available Endpoints:
   • GET  /health          Health check
   • GET  /api             API info
   • POST /api/auth/login  Player login/registration

⏰  Started at:        ${startTime}
  `;

  console.log(banner);
  
  if (isDevelopment) {
    console.log('💡  Development mode: Hot reload enabled\n');
  }
}
