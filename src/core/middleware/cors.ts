/**
 * @fileoverview CORS Middleware
 * 
 * CORS (Cross-Origin Resource Sharing) configuration for Fastify.
 * Allows the API to accept requests from different origins (e.g., Unity frontend).
 * 
 * Configuration is controlled via environment variables:
 * - CORS_ORIGIN: Comma-separated list of allowed origins (empty = allow all)
 * - CORS_CREDENTIALS: Whether to allow credentials (default: true)
 */

import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { CORS_ORIGIN, CORS_CREDENTIALS } from '../config';

/**
 * Registers CORS middleware with the Fastify application.
 * 
 * @param app - Fastify instance
 */
export async function registerCors(app: FastifyInstance): Promise<void> {
  // Configure origin: allow all if CORS_ORIGIN is not set, otherwise use specified origins
  const origin = CORS_ORIGIN
    ? CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : true;

  await app.register(cors, {
    origin,
    credentials: CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

