/**
 * @fileoverview Decoration Controller
 * 
 * Request handlers for decoration endpoints.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse, createErrorResponse } from '@/core/responses';
import { ValidationError } from '@/core/errors';
import { DecorationService } from '@/services/decoration.service';
import type { Decoration } from '@/models/decoration.model';

const decorationService = new DecorationService();

/**
 * GET /decoration/:id
 * 
 * Retrieves detailed information about a specific decoration by its ID.
 * 
 * @param request - Fastify request with id parameter
 * @param reply - Fastify reply
 * @returns Decoration data or error response
 */
export async function getDecorationById(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Decoration>> {
  try {
    const { id } = request.params;
    const decorationId = parseInt(id, 10);
    
    // Basic validation before service call (service does stricter validation)
    if (isNaN(decorationId)) {
      throw new ValidationError('Invalid decoration ID format');
    }

    const decoration = await decorationService.getDecorationById(decorationId);

    return createSuccessResponse(
      decoration,
      'Decoration retrieved successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * GET /player/:address/decorations
 * 
 * Retrieves all decorations owned by a specific player.
 * 
 * @param request - Fastify request with address parameter
 * @param reply - Fastify reply
 * @returns Array of Decoration data or error response
 */
export async function getDecorationsByOwner(
  request: FastifyRequest<{ Params: { address: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Decoration[]>> {
  try {
    const { address } = request.params;
    const decorationList = await decorationService.getDecorationsByOwner(address);

    return createSuccessResponse(
      decorationList,
      'Decorations retrieved successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /decoration/:id/activate
 * 
 * Activates a decoration, making its XP multiplier apply to fish XP gains
 * in the associated tank.
 * 
 * @param request - Fastify request with id parameter and owner in body
 * @param reply - Fastify reply
 * @returns Updated Decoration data or error response
 */
export async function activateDecoration(
  request: FastifyRequest<{ 
    Params: { id: string }, 
    Body: { owner: string } 
  }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Decoration>> {
  try {
    const { id } = request.params;
    const { owner } = request.body;

    const decorationId = parseInt(id, 10);
    
    // Basic validation before service call (service does stricter validation)
    if (isNaN(decorationId)) {
      throw new ValidationError('Invalid decoration ID format');
    }

    if (!owner) {
      throw new ValidationError('Owner address is required in request body');
    }

    const decoration = await decorationService.activateDecoration(decorationId, owner);

    return createSuccessResponse(
      decoration,
      'Decoration activated successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}