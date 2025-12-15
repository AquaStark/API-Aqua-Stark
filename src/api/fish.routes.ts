/**
 * @fileoverview Fish Routes
 * 
 * Route definitions for fish endpoints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getFishById } from '@/controllers/fish.controller';

/**
 * Registers fish routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 * @param options - Route options
 */
export async function fishRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // GET /fish/:id - Get fish details by ID
  app.get('/fish/:id', getFishById);
}

