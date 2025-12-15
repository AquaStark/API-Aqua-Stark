/**
 * @fileoverview Fish Controller
 * 
 * Request handlers for fish endpoints.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse, createErrorResponse } from '@/core/responses';
import { FishService } from '@/services/fish.service';
import type { Fish } from '@/models/fish.model';

const fishService = new FishService();

/**
 * GET /fish/:id
 * 
 * Retrieves detailed information about a specific fish by its ID.
 * 
 * @param request - Fastify request with id parameter
 * @param reply - Fastify reply
 * @returns Fish data or error response
 */
export async function getFishById(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Fish>> {
  try {
    const { id } = request.params;
    const fishId = parseInt(id, 10);
    
    // Basic validation before service call (service does stricter validation)
    if (isNaN(fishId)) {
      throw new Error('Invalid fish ID format');
    }

    const fish = await fishService.getFishById(fishId);

    return createSuccessResponse(
      fish,
      'Fish retrieved successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

