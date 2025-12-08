/**
 * @fileoverview Server Banner - Beautiful startup display
 * 
 * Displays an attractive server status banner on startup.
 */

import { PORT, NODE_ENV } from '../config';

/**
 * Displays a beautiful server startup banner.
 */
export function displayServerBanner(): void {
  const isDevelopment = NODE_ENV === 'development';
  const isProduction = NODE_ENV === 'production';
  
  const status = isDevelopment ? '🟢 RUNNING' : isProduction ? '🔵 PRODUCTION' : '🟡 STARTING';
  const env = NODE_ENV.toUpperCase();
  const port = PORT.toString();
  const localUrl = `http://localhost:${port}`;
  const networkUrl = `http://0.0.0.0:${port}`;
  const startTime = new Date().toLocaleString();
  
  const banner = `
🐟  AQUA STARK BACKEND API  🐠

🚀  Server Status:     ${status}
🌐  Environment:      ${env}
🔌  Port:              ${port}
📍  Local URL:         ${localUrl}
🌍  Network URL:       ${networkUrl}

📋  Available Endpoints:
   • GET  /health          Health check
   • GET  /api             API info

⏰  Started at:        ${startTime}
  `;

  console.log(banner);
  
  if (isDevelopment) {
    console.log('💡  Development mode: Hot reload enabled\n');
  }
}

