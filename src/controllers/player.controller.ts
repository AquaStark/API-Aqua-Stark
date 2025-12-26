/**
 * @fileoverview Player Controller
 * 
 * Request handlers for player endpoints.
 * 
 * ⚠️ IMPORTANT: All controllers MUST:
 * - Return ControllerResponse<T> or Promise<ControllerResponse<T>>
 * - Use createSuccessResponse() for success cases
 * - Use createErrorResponse() for error cases (or let errors bubble to middleware)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse, createErrorResponse } from '@/core/responses';
import { PlayerService } from '@/services/player.service';
import type { PlayerProfile } from '@/models/player.model';

const playerService = new PlayerService();

/**
 * GET /player/:address
 * 
 * Retrieves a complete player profile by their Starknet address.
 * Includes player data along with all owned tanks, fish, and decorations.
 * 
 * @param request - Fastify request with address parameter
 * @param reply - Fastify reply
 * @returns Complete PlayerProfile with all related assets or error response
 */
export async function getPlayerByAddress(
  request: FastifyRequest<{ Params: { address: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<PlayerProfile>> {
  try {
    const { address } = request.params;
    const playerProfile = await playerService.getPlayerByAddress(address);

    return createSuccessResponse(
      playerProfile,
      'Player profile retrieved successfully'
    );
  } catch (error) {
    // Errors can be caught and transformed, or let them bubble to middleware
    return createErrorResponse(error);
  }
}

