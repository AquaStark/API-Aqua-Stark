/**
 * @fileoverview API Routes Registration
 * 
 * Central route registration point.
 * All route modules should be imported and registered here.
 */

import type { FastifyInstance } from 'fastify';
import { authRoutes } from '@/api/auth.routes';
import { playerRoutes } from '@/api/player.routes';

/**
 * Registers all API routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Register route modules here
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(playerRoutes, { prefix: '/api' });
  // await app.register(fishRoutes, { prefix: '/api/fish' });

  // Placeholder route for testing
  app.get('/api', async () => {
    return {
      message: 'Aqua Stark Backend API',
      version: '1.0.0',
    };
  });
}

