/**
 * @fileoverview Auth Routes
 * 
 * Routes for authentication endpoints.
 */

import type { FastifyInstance } from 'fastify';
import { login } from '@/controllers/auth.controller';

/**
 * Registers authentication routes with the Fastify instance.
 * 
 * @param app - Fastify instance
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', login);
}
