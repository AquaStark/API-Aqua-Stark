/**
 * @fileoverview Fish Controller
 * 
 * Request handlers for fish endpoints.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse, createErrorResponse } from '@/core/responses';
import { ValidationError } from '@/core/errors';
import { FishService } from '@/services/fish.service';
import type { Fish, FeedFishBatchDto, BreedFishDto } from '@/models/fish.model';
import type { FishFamilyTree } from '@/core/types/dojo-types';

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

/**
 * GET /fish/:id/family
 * 
 * Retrieves the complete family tree of a fish.
 * Returns the fish's complete lineage including ancestors and descendants.
 * 
 * @param request - Fastify request with id parameter
 * @param reply - Fastify reply
 * @returns FishFamilyTree data or error response
 */
export async function getFishFamily(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<FishFamilyTree>> {
  try {
    const { id } = request.params;
    const fishId = parseInt(id, 10);
    
    // Basic validation before service call (service does stricter validation)
    if (isNaN(fishId)) {
      throw new ValidationError('Invalid fish ID format');
    }

    const familyTree = await fishService.getFishFamily(fishId);

    return createSuccessResponse(
      familyTree,
      'Fish family tree retrieved successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * GET /player/:address/fish
 * 
 * Retrieves all fish owned by a specific player.
 * 
 * @param request - Fastify request with address parameter
 * @param reply - Fastify reply
 * @returns Array of Fish data or error response
 */
export async function getFishByOwner(
  request: FastifyRequest<{ Params: { address: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Fish[]>> {
  try {
    const { address } = request.params;
    const fishList = await fishService.getFishByOwner(address);

    return createSuccessResponse(
      fishList,
      'Fish retrieved successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /fish/feed
 * 
 * Feeds multiple fish in a batch operation.
 * Validates ownership and calls the on-chain feed_fish_batch function.
 * All state updates (XP, last_fed_at, multipliers) happen on-chain.
 * 
 * @param request - Fastify request with FeedFishBatchDto in body
 * @param reply - Fastify reply
 * @returns Transaction hash or error response
 */
export async function feedFish(
  request: FastifyRequest<{ Body: FeedFishBatchDto }>,
  _reply: FastifyReply
): Promise<ControllerResponse<{ tx_hash: string }>> {
  try {
    const { fish_ids, owner } = request.body;

    // Basic validation before service call (service does stricter validation)
    if (!fish_ids || !Array.isArray(fish_ids)) {
      throw new Error('fish_ids must be an array');
    }

    if (!owner) {
      throw new Error('owner is required');
    }

    const txHash = await fishService.feedFishBatch(fish_ids, owner);

    return createSuccessResponse(
      { tx_hash: txHash },
      'Fish fed successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /fish/breed
 * 
 * Breeds two fish together to create offspring.
 * Validates breeding conditions (both must be adults and ready to breed),
 * creates a new fish on-chain, saves it to Supabase with parent references,
 * and updates player statistics.
 * 
 * @param request - Fastify request with BreedFishDto in body
 * @param reply - Fastify reply
 * @returns Newly created Fish or error response
 */
export async function breedFish(
  request: FastifyRequest<{ Body: BreedFishDto }>,
  _reply: FastifyReply
): Promise<ControllerResponse<Fish>> {
  try {
    const { fish1_id, fish2_id, owner } = request.body;

    // Basic validation before service call (service does stricter validation)
    if (!fish1_id || typeof fish1_id !== 'number') {
      throw new Error('fish1_id must be a number');
    }

    if (!fish2_id || typeof fish2_id !== 'number') {
      throw new Error('fish2_id must be a number');
    }

    if (!owner) {
      throw new Error('owner is required');
    }

    const newFish = await fishService.breedFish(fish1_id, fish2_id, owner);

    return createSuccessResponse(
      newFish,
      'Fish bred successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

