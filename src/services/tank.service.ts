/**
 * @fileoverview Tank Service
 * 
 * Handles business logic for tank operations including retrieval,
 * and synchronization between Supabase and on-chain data.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { ValidationError, NotFoundError, OnChainError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { logError } from '@/core/utils/logger';
import { getTankOnChain } from '@/core/utils/dojo-client';
import type { Tank } from '@/models/tank.model';
import type { FishSummary } from '@/models/fish.model';

// ============================================================================
// TANK SERVICE
// ============================================================================

/**
 * Service for managing tank data and operations.
 */
export class TankService {
  
  // ============================================================================
  // TANK RETRIEVAL
  // ============================================================================

  /**
   * Retrieves a tank by its ID.
   * 
   * Combines data from:
   * 1. Off-chain (Supabase): owner, name, creation date
   * 2. On-chain (Dojo): capacity
   * 3. Related data: list of fish owned by the tank owner
   * 
   * @param id - Tank ID
   * @returns Complete Tank data including fish summary list (without on-chain data)
   * @throws {ValidationError} If ID is invalid
   * @throws {NotFoundError} If tank doesn't exist
   */
  async getTankById(id: number): Promise<Tank & { fish: FishSummary[] }> {
    // Validate ID
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new ValidationError('Invalid tank ID');
    }

    const supabase = getSupabaseClient();

    // 1. Get off-chain data from Supabase
    const { data: tankOffChain, error } = await supabase
      .from('tanks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Tank with ID ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!tankOffChain) {
      throw new NotFoundError(`Tank with ID ${id} not found`);
    }

    // 2. Get on-chain data from Dojo
    let tankOnChain;
    try {
      tankOnChain = await getTankOnChain(id);
    } catch (error) {
      logError(`Failed to get on-chain data for tank ${id}`, error);
      throw new OnChainError(
        `Failed to retrieve on-chain data for tank ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 3. Get fish list for this owner
    // Since we don't have tank_id in fish table yet, we assume all fish of the owner are in their tank
    // (Simplification for now based on current schema)
    const { data: fishList, error: fishError } = await supabase
      .from('fish')
      .select('*')
      .eq('owner', tankOffChain.owner);

    if (fishError) {
      logError(`Failed to get fish list for tank owner ${tankOffChain.owner}`, fishError);
      // Return empty array if error occurs
    }

    // Map Supabase fish to FishSummary (off-chain data only)
    // For complete fish data with on-chain info, use GET /api/fish/:id endpoint
    const fish: FishSummary[] = (fishList || []).map(f => ({
      id: f.id,
      owner: f.owner,
      species: f.species,
      imageUrl: f.image_url,
      createdAt: new Date(f.created_at),
    }));

    // 4. Combine data
    const tank: Tank & { fish: FishSummary[] } = {
      // On-chain data
      id: tankOnChain.id,
      capacity: tankOnChain.capacity,
      
      // Off-chain data
      owner: tankOffChain.owner,
      name: tankOffChain.name,
      createdAt: new Date(tankOffChain.created_at),
      
      // Relations
      fish: fish
    };

    return tank;
  }
}

