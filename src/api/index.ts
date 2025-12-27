/**
 * @fileoverview API Routes Registration
 * 
 * Central route registration point.
 * All route modules should be imported and registered here.
 */

import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { playerRoutes } from './player.routes';
import { fishRoutes } from './fish.routes';
import { tankRoutes } from './tank.routes';
import { decorationRoutes } from './decoration.routes';
import { assetRoutes } from './asset.routes';
import { healthRoutes } from './health.routes';

/**
 * Registers all API routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Register route modules here
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(playerRoutes, { prefix: '/api' });
  await app.register(fishRoutes, { prefix: '/api' });
  await app.register(tankRoutes, { prefix: '/api' });
  await app.register(decorationRoutes, { prefix: '/api' });
  await app.register(assetRoutes, { prefix: '/api' });

  // Placeholder route for testing
  app.get('/api', async () => {
    return {
      message: 'Aqua Stark Backend API',
      version: '1.0.0',
    };
  });
}

