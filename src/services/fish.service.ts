/**
 * @fileoverview Fish Service
 * 
 * Handles business logic for fish operations including retrieval,
 * and synchronization between Supabase and on-chain data.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { ValidationError, NotFoundError, OnChainError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { logError } from '@/core/utils/logger';
import { getFishOnChain, feedFishBatch } from '@/core/utils/dojo-client';
import type { Fish } from '@/models/fish.model';

// ============================================================================
// FISH SERVICE
// ============================================================================

/**
 * Service for managing fish data and operations.
 */
export class FishService {
  
  // ============================================================================
  // FISH RETRIEVAL
  // ============================================================================

  /**
   * Retrieves a fish by its ID.
   * 
   * Combines data from:
   * 1. Off-chain (Supabase): owner, species, image, creation date
   * 2. On-chain (Dojo): xp, state, hunger, breeding status, dna
   * 
   * @param id - Fish ID
   * @returns Complete Fish data
   * @throws {ValidationError} If ID is invalid
   * @throws {NotFoundError} If fish doesn't exist
   */
  async getFishById(id: number): Promise<Fish> {
    // Validate ID
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new ValidationError('Invalid fish ID');
    }

    const supabase = getSupabaseClient();

    // 1. Get off-chain data from Supabase
    const { data: fishOffChain, error } = await supabase
      .from('fish')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Fish with ID ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!fishOffChain) {
      throw new NotFoundError(`Fish with ID ${id} not found`);
    }

    // 2. Get on-chain data from Dojo
    try {
      const fishOnChain = await getFishOnChain(id);

      // 3. Combine data
      const fish: Fish = {
        // On-chain data
        id: fishOnChain.id,
        xp: fishOnChain.xp,
        state: fishOnChain.state,
        hunger: fishOnChain.hunger,
        isReadyToBreed: fishOnChain.isReadyToBreed,
        dna: fishOnChain.dna,
        
        // Off-chain data
        owner: fishOffChain.owner,
        species: fishOffChain.species,
        imageUrl: fishOffChain.image_url, // Map snake_case to camelCase
        createdAt: new Date(fishOffChain.created_at), // Convert string to Date
      };

      return fish;
    } catch (error) {
      logError(`Failed to get on-chain data for fish ${id}`, error);
      // If on-chain fetch fails, we could either:
      // a) Throw error (strict consistency)
      // b) Return partial data (availability over consistency)
      // For now, we throw OnChainError as the fish is fundamentally an on-chain asset
      throw new OnChainError(
        `Failed to retrieve on-chain data for fish ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieves all fish owned by a specific player.
   * 
   * Combines data from:
   * 1. Off-chain (Supabase): owner, species, image, creation date
   * 2. On-chain (Dojo): xp, state, hunger, breeding status, dna
   * 
   * @param address - Player's Starknet wallet address
   * @returns Array of complete Fish data (empty array if player has no fish)
   * @throws {ValidationError} If address is invalid
   * @throws {NotFoundError} If player doesn't exist
   */
  async getFishByOwner(address: string): Promise<Fish[]> {
    // Validate address
    if (!address || address.trim().length === 0) {
      throw new ValidationError('Address is required');
    }

    // Basic Starknet address format validation (starts with 0x and is hex)
    const addressPattern = /^0x[a-fA-F0-9]{63,64}$/;
    if (!addressPattern.test(address.trim())) {
      throw new ValidationError('Invalid Starknet address format');
    }

    const supabase = getSupabaseClient();
    const trimmedAddress = address.trim();

    // 1. Validate that the player exists
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('address')
      .eq('address', trimmedAddress)
      .single();

    if (playerError) {
      if (playerError.code === 'PGRST116') {
        throw new NotFoundError(`Player with address ${address} not found`);
      }
      throw new Error(`Database error: ${playerError.message}`);
    }

    if (!player) {
      throw new NotFoundError(`Player with address ${address} not found`);
    }

    // 2. Get off-chain data from Supabase (all fish owned by this player)
    const { data: fishOffChainList, error: fishError } = await supabase
      .from('fish')
      .select('*')
      .eq('owner', trimmedAddress)
      .order('id', { ascending: true });

    if (fishError) {
      throw new Error(`Database error: ${fishError.message}`);
    }

    // If player has no fish, return empty array (not an error)
    if (!fishOffChainList || fishOffChainList.length === 0) {
      return [];
    }

    // Data type for Supabase fish row
    type FishRow = {
      id: number;
      owner: string;
      species: string;
      image_url: string;
      created_at: string;
    };

    // 3. Get on-chain data for all fish in parallel
    try {
      const fishOnChainPromises = fishOffChainList.map((fish: FishRow) =>
        getFishOnChain(fish.id)
      );
      const fishOnChainList = await Promise.all(fishOnChainPromises);

      // 4. Combine off-chain and on-chain data
      const fishList: Fish[] = fishOffChainList.map((fishOffChain: FishRow, index: number) => {
        const fishOnChain = fishOnChainList[index];
        return {
          // On-chain data
          id: fishOnChain.id,
          xp: fishOnChain.xp,
          state: fishOnChain.state,
          hunger: fishOnChain.hunger,
          isReadyToBreed: fishOnChain.isReadyToBreed,
          dna: fishOnChain.dna,

          // Off-chain data
          owner: fishOffChain.owner,
          species: fishOffChain.species,
          imageUrl: fishOffChain.image_url, // Map snake_case to camelCase
          createdAt: new Date(fishOffChain.created_at), // Convert string to Date
        };
      });

      return fishList;
    } catch (error) {
      logError(`Failed to get on-chain data for fish owned by ${address}`, error);
      // If on-chain fetch fails, we throw OnChainError as the fish is fundamentally an on-chain asset
      throw new OnChainError(
        `Failed to retrieve on-chain data for fish owned by ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============================================================================
  // FISH FEEDING
  // ============================================================================

  /**
   * Feeds multiple fish in a batch operation.
   * 
   * Validates ownership of all fish, then calls the on-chain feed_fish_batch
   * function which handles XP updates, last_fed_at timestamps, and applies
   * XP multipliers based on active tank decorations.
   * 
   * The backend does NOT update Supabase - all state changes happen on-chain.
   * Unity will query the updated state from the contract after receiving the tx_hash.
   * 
   * @param fishIds - Array of fish IDs to feed
   * @param owner - Owner's Starknet wallet address (for ownership validation)
   * @returns Transaction hash from the on-chain operation
   * @throws {ValidationError} If fishIds is empty, owner is invalid, or any fish doesn't exist or belong to owner
   * @throws {OnChainError} If the on-chain feed operation fails
   */
  async feedFishBatch(fishIds: number[], owner: string): Promise<string> {
    // Validate fishIds array
    if (!fishIds || !Array.isArray(fishIds) || fishIds.length === 0) {
      throw new ValidationError('fish_ids must be a non-empty array');
    }

    // Validate each fish ID
    for (const fishId of fishIds) {
      if (!fishId || fishId <= 0 || !Number.isInteger(fishId)) {
        throw new ValidationError(`Invalid fish ID: ${fishId}`);
      }
    }

    // Validate owner address
    if (!owner || owner.trim().length === 0) {
      throw new ValidationError('Owner address is required');
    }

    // Basic Starknet address format validation (starts with 0x and is hex)
    const addressPattern = /^0x[a-fA-F0-9]{63,64}$/;
    if (!addressPattern.test(owner.trim())) {
      throw new ValidationError('Invalid Starknet address format');
    }

    const supabase = getSupabaseClient();
    const trimmedOwner = owner.trim();

    // Validate that all fish exist and belong to the owner
    const { data: fishList, error } = await supabase
      .from('fish')
      .select('id, owner')
      .in('id', fishIds);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!fishList || fishList.length === 0) {
      throw new ValidationError('None of the specified fish IDs exist');
    }

    // Check if all requested fish were found
    if (fishList.length !== fishIds.length) {
      const foundIds = fishList.map((f) => f.id);
      const missingIds = fishIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Fish with IDs [${missingIds.join(', ')}] not found`);
    }

    // Validate ownership - all fish must belong to the specified owner
    const invalidOwnership = fishList.filter((fish) => fish.owner !== trimmedOwner);
    if (invalidOwnership.length > 0) {
      const invalidIds = invalidOwnership.map((f) => f.id);
      throw new ValidationError(
        `Fish with IDs [${invalidIds.join(', ')}] do not belong to owner ${trimmedOwner}`
      );
    }

    // Call on-chain feed_fish_batch function
    // This updates XP, last_fed_at, applies XP multipliers, and handles state changes
    try {
      const txHash = await feedFishBatch(fishIds);
      return txHash;
    } catch (error) {
      logError(`Failed to feed fish batch on-chain: [${fishIds.join(', ')}]`, error);
      throw new OnChainError(
        `Failed to feed fish batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

