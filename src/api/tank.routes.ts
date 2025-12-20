/**
 * @fileoverview Tank Routes
 * 
 * Route definitions for tank endpoints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getTankById, getTanksByOwner } from '@/controllers/tank.controller';

/**
 * Registers tank routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 * @param options - Route options
 */
export async function tankRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // GET /tank/:id - Get tank details by ID
  app.get('/tank/:id', getTankById);

  // GET /player/:address/tanks - Get all tanks owned by a player
  app.get('/player/:address/tanks', getTanksByOwner);
}

