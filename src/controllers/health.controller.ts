/**
 * @fileoverview Health Controller
 * 
 * Handles health check endpoints.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse } from '@/core/responses';
import pkg from '../../package.json';

/**
 * Health check response data
 */
interface HealthData {
  status: 'ok';
  version: string;
  timestamp: string;
  uptime: number;
}

/**
 * Extended FastifyInstance for startTime
 */
declare module 'fastify' {
  interface FastifyInstance {
    startTime: number;
  }
}

/**
 * GET /health endpoint.
 * 
 * Returns system health status, version, and uptime.
 * 
 * @param request - Fastify request
 * @param _reply - Fastify reply
 * @returns ControllerResponse<HealthData>
 */
export async function getHealth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<ControllerResponse<HealthData>> {
  const startTime = request.server.startTime || Date.now();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return createSuccessResponse({
    status: 'ok',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptime
  });
}

