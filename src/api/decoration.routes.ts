/**
 * @fileoverview Decoration Routes
 * 
 * Route definitions for decoration endpoints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDecorationById, getDecorationsByOwner, activateDecoration } from '@/controllers/decoration.controller';

/**
 * Registers decoration routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 * @param options - Route options
 */
export async function decorationRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // GET /decoration/:id - Get decoration details by ID
  app.get('/decoration/:id', getDecorationById);

  // GET /player/:address/decorations - Get all decorations owned by a player
  app.get('/player/:address/decorations', getDecorationsByOwner);

  // POST /decoration/:id/activate - Activate a decoration
  app.post('/decoration/:id/activate', activateDecoration);
}
