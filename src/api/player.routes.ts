/**
 * @fileoverview Player Routes
 * 
 * Route definitions for player endpoints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getPlayerByAddress } from '@/controllers/player.controller';

/**
 * Registers player routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 * @param options - Route options
 */
export async function playerRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // GET /player/:address - Get player by address
  app.get('/player/:address', getPlayerByAddress);
}

