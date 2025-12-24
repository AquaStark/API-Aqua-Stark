/**
 * @fileoverview Fastify Application Setup
 * 
 * Main application configuration and route registration.
 * All routes and middleware are registered here.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from './core/middleware/error-handler';
import { registerRoutes } from './api';
import { PORT, NODE_ENV } from './core/config';
import { displayServerBanner } from './core/utils/server-banner';
import { initializeLogger } from './core/utils/logger';

/**
 * Creates and configures the Fastify application instance.
 * 
 * @returns Configured Fastify instance
 */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Initialize global logger with Fastify instance
  initializeLogger(app);

  // Decorate app with start time for uptime calculation
  app.decorate('startTime', Date.now());

  // Register global error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  await registerRoutes(app);

  return app;
}

/**
 * Starts the Fastify server.
 * 
 * @param app - Fastify instance
 */
export async function startServer(app: FastifyInstance): Promise<void> {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    
    // Clear console and display beautiful banner
    console.clear();
    await displayServerBanner();
    
    // Also log for production environments
    if (NODE_ENV === 'production') {
      app.log.info(`Server listening on port ${PORT}`);
    }
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

