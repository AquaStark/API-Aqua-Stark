/**
 * @fileoverview Asset Routes
 * 
 * Route definitions for asset endpoints.
 * Includes configuration for file uploads.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import multipart from '@fastify/multipart';
import { uploadFishSprite, uploadTankSprite } from '@/controllers/asset.controller';

/**
 * Registers asset routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 * @param options - Route options
 */
export async function assetRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Register multipart plugin for file uploads
  // Limit set to 10MB to support 3D assets
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1 // Only allow 1 file per request
    }
  });

  // POST /asset/fish/:id/sprite - Upload sprite/3D asset for a fish
  app.post('/asset/fish/:id/sprite', uploadFishSprite);

  // POST /asset/tank/:id/sprite - Upload sprite for a tank
  app.post('/asset/tank/:id/sprite', uploadTankSprite);
}

