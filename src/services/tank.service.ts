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
    type SupabaseFishRow = {
      id: number;
      owner: string;
      species: string;
      image_url: string;
      created_at: string;
    };

    const fish: FishSummary[] = (fishList || []).map((f: SupabaseFishRow) => ({
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

  /**
   * Retrieves all tanks owned by a specific player.
   * 
   * Combines data from:
   * 1. Off-chain (Supabase): owner, name, creation date
   * 2. On-chain (Dojo): capacity
   * 3. Calculated: fish count per tank (current fish count vs capacity)
   * 
   * @param address - Player's Starknet wallet address
   * @returns Array of Tank data with fish count (empty array if player has no tanks)
   * @throws {ValidationError} If address is invalid
   * @throws {NotFoundError} If player doesn't exist
   */
  async getTanksByOwner(address: string): Promise<(Tank & { fishCount: number; capacityUsage: number })[]> {
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

    // 2. Get off-chain data from Supabase (all tanks owned by this player)
    const { data: tanksOffChain, error: tanksError } = await supabase
      .from('tanks')
      .select('*')
      .eq('owner', trimmedAddress)
      .order('id', { ascending: true });

    if (tanksError) {
      throw new Error(`Database error: ${tanksError.message}`);
    }

    // If player has no tanks, return empty array (not an error)
    if (!tanksOffChain || tanksOffChain.length === 0) {
      return [];
    }

    // 3. Get fish count for this owner (simplified: all fish belong to the owner's tanks)
    const { data: fishList, error: fishError } = await supabase
      .from('fish')
      .select('id')
      .eq('owner', trimmedAddress);

    if (fishError) {
      logError(`Failed to get fish count for owner ${trimmedAddress}`, fishError);
    }

    const totalFishCount = fishList?.length || 0;

    // Data type for Supabase tank row
    type TankRow = {
      id: number;
      owner: string;
      name: string | null;
      created_at: string;
    };

    // 4. Get on-chain data for all tanks in parallel
    try {
      const tanksOnChainPromises = tanksOffChain.map((tank: TankRow) =>
        getTankOnChain(tank.id)
      );
      const tanksOnChainList = await Promise.all(tanksOnChainPromises);

      // 5. Combine off-chain and on-chain data
      const tanksList = tanksOffChain.map((tankOffChain: TankRow, index: number) => {
        const tankOnChain = tanksOnChainList[index];

        // Simplified: distribute fish count evenly across tanks
        // In a real scenario, fish table would have tank_id field
        const fishCount = tanksOffChain.length > 0
          ? Math.floor(totalFishCount / tanksOffChain.length) + (index === 0 ? totalFishCount % tanksOffChain.length : 0)
          : 0;

        const capacityUsage = tankOnChain.capacity > 0
          ? Number((fishCount / tankOnChain.capacity).toFixed(2))
          : 0;

        return {
          // On-chain data
          id: tankOnChain.id,
          capacity: tankOnChain.capacity,

          // Off-chain data
          owner: tankOffChain.owner,
          name: tankOffChain.name,
          createdAt: new Date(tankOffChain.created_at),

          // Calculated fields
          fishCount,
          capacityUsage,
        };
      });

      return tanksList;
    } catch (error) {
      logError(`Failed to get on-chain data for tanks owned by ${address}`, error);
      throw new OnChainError(
        `Failed to retrieve on-chain data for tanks owned by ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

