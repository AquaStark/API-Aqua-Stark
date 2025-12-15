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
import { getFishOnChain } from '@/core/utils/dojo-client';
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
}

