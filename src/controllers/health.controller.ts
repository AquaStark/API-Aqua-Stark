/**
 * @fileoverview Health Controller
 * 
 * Handles health check endpoints.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse } from '@/core/responses';
import { validateSupabaseConnection } from '@/core/utils/supabase-client';
import { validateDojoConnection, initializeDojoClient } from '@/core/utils/dojo-client';
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
 * Service status information
 */
interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
}

/**
 * Status endpoint response data
 */
interface StatusData {
  status: 'ok';
  version: string;
  timestamp: string;
  uptime: number;
  services: ServiceStatus[];
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

/**
 * GET /status endpoint.
 * 
 * Returns comprehensive system status including health checks for all services.
 * 
 * @param request - Fastify request
 * @param _reply - Fastify reply
 * @returns ControllerResponse<StatusData>
 */
export async function getStatus(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<ControllerResponse<StatusData>> {
  const startTime = request.server.startTime || Date.now();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Ensure Dojo client is initialized before checking
  initializeDojoClient();

  // Check Supabase connection
  const supabaseHealthy = await validateSupabaseConnection();
  const supabaseStatus: ServiceStatus = supabaseHealthy
    ? {
        name: 'Supabase',
        status: 'healthy'
      }
    : {
        name: 'Supabase',
        status: 'unhealthy',
        message: 'Connection failed or timeout'
      };

  // Check Dojo/Starknet connection
  const dojoHealthy = await validateDojoConnection(5000);
  const dojoStatus: ServiceStatus = dojoHealthy
    ? {
        name: 'Dojo/Starknet',
        status: 'healthy'
      }
    : {
        name: 'Dojo/Starknet',
        status: 'unhealthy',
        message: 'Connection failed or timeout'
      };

  return createSuccessResponse({
    status: 'ok',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptime,
    services: [supabaseStatus, dojoStatus]
  });
}

