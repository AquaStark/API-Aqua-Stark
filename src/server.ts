/**
 * @fileoverview Server Entry Point
 * 
 * Main entry point for the application.
 * Creates the app and starts the server.
 */

// Register tsconfig-paths to resolve @/* aliases at runtime
import 'tsconfig-paths/register';

import { createApp, startServer } from './app';
import { setupGracefulShutdown } from './core/utils/shutdown';

/**
 * Main function that initializes and starts the server.
 */
async function main(): Promise<void> {
  const app = await createApp();
  await startServer(app);
  
  // Setup graceful shutdown handlers after server starts successfully
  setupGracefulShutdown(app);
}

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

