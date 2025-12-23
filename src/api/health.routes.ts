/**
 * @fileoverview Health Routes
 * 
 * Routes for health check endpoints.
 */

import type { FastifyInstance } from 'fastify';
import { getHealth } from '@/controllers/health.controller';

/**
 * Registers health routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', getHealth);
}

