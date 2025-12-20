/**
 * @fileoverview Fish Routes
 * 
 * Route definitions for fish endpoints.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getFishById, getFishByOwner, feedFish, breedFish } from '@/controllers/fish.controller';

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

  // GET /player/:address/fish - Get all fish owned by a player
  app.get('/player/:address/fish', getFishByOwner);

  // POST /fish/feed - Feed multiple fish in a batch operation
  app.post('/fish/feed', feedFish);

  // POST /fish/breed - Breed two fish together to create offspring
  app.post('/fish/breed', breedFish);
}

