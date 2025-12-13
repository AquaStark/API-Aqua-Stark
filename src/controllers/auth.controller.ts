/**
 * @fileoverview Auth Controller
 * 
 * Handles authentication endpoints for player login.
 * 
 * ⚠️ IMPORTANT: All controllers MUST:
 * - Return ControllerResponse<T> or Promise<ControllerResponse<T>>
 * - Use createSuccessResponse() for success cases
 * - Use createErrorResponse() for error cases (or let errors bubble to middleware)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse, createErrorResponse } from '@/core/responses';
import { ValidationError } from '@/core/errors';
import { PlayerService } from '@/services/player.service';
import type { Player } from '@/models/player.model';

const playerService = new PlayerService();

/**
 * Request body type for login endpoint.
 */
interface LoginDto {
  address: string;
}

/**
 * POST /auth/login endpoint.
 * 
 * Handles player login/registration via Cartridge.
 * If the player doesn't exist, creates a new player record.
 * 
 * @param request - Fastify request with address in body
 * @param reply - Fastify reply (unused, but required by Fastify)
 * @returns ControllerResponse<Player> with player data
 */
export async function login(
  request: FastifyRequest<{ Body: LoginDto }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Player>> {
  try {
    const { address } = request.body;

    // Validate that address is provided
    if (!address) {
      return createErrorResponse(new ValidationError('Address is required in request body'));
    }

    // Register or retrieve player
    const player = await playerService.registerPlayer(address);

    // Return success response with player data
    return createSuccessResponse(
      player,
      'Player logged in successfully'
    );
  } catch (error) {
    // Errors can be caught and transformed, or let them bubble to middleware
    return createErrorResponse(error);
  }
}
