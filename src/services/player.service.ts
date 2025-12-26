/**
 * @fileoverview Player Service
 * 
 * Handles business logic for player operations including registration,
 * retrieval, starter pack minting, and synchronization between Supabase and on-chain data.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { ValidationError, NotFoundError, OnChainError, ConflictError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { logError } from '@/core/utils/logger';
import {
  registerPlayer as registerPlayerOnChain,
  mintTank,
  mintFish,
  generateRandomDna,
} from '@/core/utils/dojo-client';
import { SyncService } from '@/services/sync.service';
import type { Player, CreatePlayerDto } from '@/models/player.model';
import type { MintTankResult, MintFishResult } from '@/core/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const STARTER_PACK_TANK_CAPACITY = 10;
const STARTER_PACK_FISH_SPECIES = 'Starter Fish';
const STARTER_PACK_FISH_IMAGE_URL = '/images/fish/starter-fish.png';

// ============================================================================
// PLAYER SERVICE
// ============================================================================

/**
 * Service for managing player data and operations.
 * 
 * Handles:
 * - Player registration (both Supabase and on-chain)
 * - Player retrieval from Supabase
 * - Synchronization between off-chain and on-chain data
 */
export class PlayerService {
  // ============================================================================
  // PLAYER REGISTRATION
  // ============================================================================

  /**
   * Registers a new player or returns existing player.
   * 
   * If player doesn't exist:
   * - Creates player record in Supabase with default values
   * - Registers player on-chain via Dojo contract
   * - Returns the created player
   * 
   * If player exists:
   * - Returns the existing player data
   * 
   * @param address - Player's Starknet wallet address
   * @returns Player data (combined on-chain and off-chain)
   * @throws {ValidationError} If address is invalid
   * @throws {OnChainError} If on-chain registration fails
   */
  async registerPlayer(address: string): Promise<Player> {
    // Validate input
    if (!address || address.trim().length === 0) {
      throw new ValidationError('Address is required');
    }

    const supabase = getSupabaseClient();

    // Check if player exists in Supabase
    const { data: existingPlayer, error: queryError } = await supabase
      .from('players')
      .select('*')
      .eq('address', address)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 is "not found" - expected when player doesn't exist
      // Other errors are actual problems
      throw new Error(`Failed to query player: ${queryError.message}`);
    }

    // If player exists, return it
    if (existingPlayer) {
      return this.mapSupabaseToPlayer(existingPlayer);
    }

    // Player doesn't exist - create new player
    const newPlayerDto: CreatePlayerDto = {
      address: address.trim(),
    };

    // Create player in Supabase with default values
    const { data: createdPlayer, error: insertError } = await supabase
      .from('players')
      .insert({
        address: newPlayerDto.address,
        total_xp: 0,
        fish_count: 0,
        tournaments_won: 0,
        reputation: 0,
        offspring_created: 0,
        avatar_url: newPlayerDto.avatar_url || null,
      })
      .select()
      .single();

    if (insertError) {
      // Handle race condition: if player was created by another request between our check and insert
      if (insertError.code === '23505') { // PostgreSQL unique violation
        // Fetch the existing player that was just created
        const { data: existingPlayerAfterRace, error: fetchError } = await supabase
          .from('players')
          .select('*')
          .eq('address', address)
          .single();
        
        if (fetchError || !existingPlayerAfterRace) {
          throw new Error(`Failed to fetch player after race condition: ${fetchError?.message}`);
        }
        
        return this.mapSupabaseToPlayer(existingPlayerAfterRace);
      }
      throw new Error(`Failed to create player in Supabase: ${insertError.message}`);
    }

    if (!createdPlayer) {
      throw new Error('Player creation failed - no data returned');
    }

    // Register player on-chain
    let registerTxHash: string;
    try {
      registerTxHash = await registerPlayerOnChain(address);
    } catch (error) {
      // If on-chain registration fails, we should still have the Supabase record
      // but we throw an error to indicate the operation wasn't fully successful
      throw new OnChainError(
        `Failed to register player on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined
      );
    }

    // Add player registration to sync queue
    try {
      const syncService = new SyncService();
      await syncService.addToSyncQueue(registerTxHash, 'player', address.trim());
    } catch (syncError) {
      // Log error but don't fail the operation - sync queue is for tracking
      logError('Failed to add player registration to sync queue', { 
        error: syncError, 
        tx_hash: registerTxHash, 
        address: address.trim() 
      });
    }

    // Mint starter pack for new player (1 tank + 2 fish)
    try {
      await this.mintStarterPack(address);
      // Re-fetch player to get updated fish_count
      const { data: updatedPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('address', address)
        .single();
      
      if (updatedPlayer) {
        return this.mapSupabaseToPlayer(updatedPlayer);
      }
    } catch (error) {
      // If starter pack minting fails, we still return the player
      // but log the error for debugging
      logError('Failed to mint starter pack', error);
      // Player was created successfully, just without starter pack
    }

    return this.mapSupabaseToPlayer(createdPlayer);
  }

  // ============================================================================
  // STARTER PACK MINTING
  // ============================================================================

  /**
   * Mints the starter pack for a new player.
   * 
   * The starter pack includes:
   * - 1 tank (capacity: 10)
   * - 2 fish (species: "Starter Fish", random DNA, assigned to the new tank)
   * 
   * Flow:
   * 1. Validate player exists and has no starter pack yet
   * 2. Mint all assets on-chain (tank + 2 fish)
   * 3. Save all assets to Supabase with tank_id assignment
   * 4. Update player's fish_count
   * 
   * Note: Fish are automatically assigned to the newly created tank via tank_id.
   * 
   * @param address - Player's wallet address
   * @returns Object with tank_id and fish_ids
   * @throws {ValidationError} If address is invalid
   * @throws {ConflictError} If player already has starter pack
   * @throws {OnChainError} If on-chain minting fails
   */
  async mintStarterPack(address: string): Promise<{
    tank_id: number;
    fish_ids: number[];
  }> {
    // PHASE 1: Validation
    if (!address || address.trim().length === 0) {
      throw new ValidationError('Address is required');
    }

    const supabase = getSupabaseClient();
    const trimmedAddress = address.trim();

    // Check if player exists
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('address, fish_count')
      .eq('address', trimmedAddress)
      .single();

    if (playerError || !player) {
      throw new ValidationError('Player not found. Register first before minting starter pack.');
    }

    // Check if player already has starter pack (has fish or tanks)
    // Use a more robust check that prevents race conditions
    const { data: existingTanks, error: tanksError } = await supabase
      .from('tanks')
      .select('id')
      .eq('owner', trimmedAddress)
      .limit(1);

    if (tanksError && tanksError.code !== 'PGRST116') {
      // PGRST116 is "not found" - expected when no tanks exist
      logError('Error checking for existing tanks', { error: tanksError });
      throw new Error(`Failed to check for existing tanks: ${tanksError.message}`);
    }

    if (existingTanks && existingTanks.length > 0) {
      throw new ConflictError('Player already has a starter pack (tank exists)');
    }

    // Also check fish count in database (more reliable than player.fish_count which might be stale)
    const { count: fishCount, error: fishCountError } = await supabase
      .from('fish')
      .select('id', { count: 'exact', head: true })
      .eq('owner', trimmedAddress);

    if (fishCountError) {
      logError('Error checking for existing fish', { error: fishCountError });
      throw new Error(`Failed to check for existing fish: ${fishCountError.message}`);
    }

    if ((fishCount ?? 0) > 0) {
      throw new ConflictError(`Player already has a starter pack (${fishCount} fish exist)`);
    }

    if (player.fish_count > 0) {
      throw new ConflictError('Player already has a starter pack (fish_count > 0)');
    }

    // PHASE 2: Mint all assets on-chain first
    // If any mint fails, we stop immediately without saving anything to Supabase
    let tankResult: MintTankResult;
    let fish1Result: MintFishResult;
    let fish2Result: MintFishResult;

    try {
      // Mint tank on-chain
      tankResult = await mintTank(trimmedAddress, STARTER_PACK_TANK_CAPACITY);
    } catch (error) {
      throw new OnChainError(
        `Failed to mint tank on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    try {
      // Mint fish #1 on-chain
      fish1Result = await mintFish(
        trimmedAddress,
        STARTER_PACK_FISH_SPECIES,
        generateRandomDna()
      );
    } catch (error) {
      throw new OnChainError(
        `Failed to mint fish #1 on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tankResult.tx_hash
      );
    }

    try {
      // Mint fish #2 on-chain
      fish2Result = await mintFish(
        trimmedAddress,
        STARTER_PACK_FISH_SPECIES,
        generateRandomDna()
      );
    } catch (error) {
      throw new OnChainError(
        `Failed to mint fish #2 on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fish1Result.tx_hash
      );
    }

    // PHASE 3: Save all assets to Supabase with rollback on failure
    // Track what we've saved so we can rollback if needed
    let tankSaved = false;
    let fish1Saved = false;
    let fish2Saved = false;

    try {
      // Save tank to Supabase
      const { data: tankData, error: tankInsertError } = await supabase
        .from('tanks')
        .insert({
          id: tankResult.tank_id,
          owner: trimmedAddress,
          name: 'Starter Tank',
        })
        .select();

      if (tankInsertError) {
        // Handle race condition: if tank with same ID was inserted by another request
        if (tankInsertError.code === '23505') { // PostgreSQL unique violation
          // Verify if this is the same owner (should not happen, but check anyway)
          const { data: existingTank } = await supabase
            .from('tanks')
            .select('owner')
            .eq('id', tankResult.tank_id)
            .single();
          
          if (existingTank && existingTank.owner === trimmedAddress) {
            // Same owner, consider it success (idempotent operation)
            tankSaved = true;
          } else {
            // Different owner or other issue - this should not happen
            logError('Tank ID conflict with different owner', { error: tankInsertError, tank_id: tankResult.tank_id });
            throw new Error(`Tank ID conflict: ${tankInsertError.message}`);
          }
        } else {
          logError('Failed to save tank to Supabase', { error: tankInsertError, tank_id: tankResult.tank_id });
          throw new Error(`Failed to save tank: ${tankInsertError.message}`);
        }
      } else if (!tankData || tankData.length === 0) {
        logError('Tank insert returned no data', { tank_id: tankResult.tank_id });
        throw new Error('Failed to save tank: No data returned from insert');
      } else {
        tankSaved = true;
      }

      // Save fish #1 to Supabase with tank assignment
      const { data: fish1Data, error: fish1InsertError } = await supabase
        .from('fish')
        .insert({
          id: fish1Result.fish_id,
          owner: trimmedAddress,
          species: STARTER_PACK_FISH_SPECIES,
          image_url: STARTER_PACK_FISH_IMAGE_URL,
          tank_id: tankResult.tank_id,
        })
        .select();

      if (fish1InsertError) {
        // Handle race condition: if fish with same ID was inserted by another request
        if (fish1InsertError.code === '23505') { // PostgreSQL unique violation
          const { data: existingFish } = await supabase
            .from('fish')
            .select('owner')
            .eq('id', fish1Result.fish_id)
            .single();
          
          if (existingFish && existingFish.owner === trimmedAddress) {
            fish1Saved = true;
          } else {
            logError('Fish #1 ID conflict with different owner', { error: fish1InsertError, fish_id: fish1Result.fish_id });
            throw new Error(`Fish #1 ID conflict: ${fish1InsertError.message}`);
          }
        } else {
          logError('Failed to save fish #1 to Supabase', { error: fish1InsertError, fish_id: fish1Result.fish_id });
          throw new Error(`Failed to save fish #1: ${fish1InsertError.message}`);
        }
      } else if (!fish1Data || fish1Data.length === 0) {
        logError('Fish #1 insert returned no data', { fish_id: fish1Result.fish_id });
        throw new Error('Failed to save fish #1: No data returned from insert');
      } else {
        fish1Saved = true;
      }

      // Save fish #2 to Supabase with tank assignment
      const { data: fish2Data, error: fish2InsertError } = await supabase
        .from('fish')
        .insert({
          id: fish2Result.fish_id,
          owner: trimmedAddress,
          species: STARTER_PACK_FISH_SPECIES,
          image_url: STARTER_PACK_FISH_IMAGE_URL,
          tank_id: tankResult.tank_id,
        })
        .select();

      if (fish2InsertError) {
        // Handle race condition: if fish with same ID was inserted by another request
        if (fish2InsertError.code === '23505') { // PostgreSQL unique violation
          const { data: existingFish } = await supabase
            .from('fish')
            .select('owner')
            .eq('id', fish2Result.fish_id)
            .single();
          
          if (existingFish && existingFish.owner === trimmedAddress) {
            fish2Saved = true;
          } else {
            logError('Fish #2 ID conflict with different owner', { error: fish2InsertError, fish_id: fish2Result.fish_id });
            throw new Error(`Fish #2 ID conflict: ${fish2InsertError.message}`);
          }
        } else {
          logError('Failed to save fish #2 to Supabase', { error: fish2InsertError, fish_id: fish2Result.fish_id });
          throw new Error(`Failed to save fish #2: ${fish2InsertError.message}`);
        }
      } else if (!fish2Data || fish2Data.length === 0) {
        logError('Fish #2 insert returned no data', { fish_id: fish2Result.fish_id });
        throw new Error('Failed to save fish #2: No data returned from insert');
      } else {
        fish2Saved = true;
      }

      // Update player's fish_count
      const { data: updateData, error: updateError } = await supabase
        .from('players')
        .update({ fish_count: 2 })
        .eq('address', trimmedAddress)
        .select();

      if (updateError) {
        logError('Failed to update fish_count', { error: updateError, address: trimmedAddress });
        throw new Error(`Failed to update fish_count: ${updateError.message}`);
      }
      
      if (!updateData || updateData.length === 0) {
        logError('Player update returned no data', { address: trimmedAddress });
        throw new Error('Failed to update fish_count: No data returned from update');
      }

      // Add all on-chain transactions to sync queue
      const syncService = new SyncService();
      
      // Add tank mint to sync queue
      try {
        await syncService.addToSyncQueue(
          tankResult.tx_hash,
          'tank',
          tankResult.tank_id.toString()
        );
      } catch (syncError) {
        logError('Failed to add tank mint to sync queue', {
          error: syncError,
          tx_hash: tankResult.tx_hash,
          tank_id: tankResult.tank_id,
        });
      }

      // Add fish #1 mint to sync queue
      try {
        await syncService.addToSyncQueue(
          fish1Result.tx_hash,
          'fish',
          fish1Result.fish_id.toString()
        );
      } catch (syncError) {
        logError('Failed to add fish #1 mint to sync queue', {
          error: syncError,
          tx_hash: fish1Result.tx_hash,
          fish_id: fish1Result.fish_id,
        });
      }

      // Add fish #2 mint to sync queue
      try {
        await syncService.addToSyncQueue(
          fish2Result.tx_hash,
          'fish',
          fish2Result.fish_id.toString()
        );
      } catch (syncError) {
        logError('Failed to add fish #2 mint to sync queue', {
          error: syncError,
          tx_hash: fish2Result.tx_hash,
          fish_id: fish2Result.fish_id,
        });
      }

      // All successful!
      return {
        tank_id: tankResult.tank_id,
        fish_ids: [fish1Result.fish_id, fish2Result.fish_id],
      };
    } catch (error) {
      // Rollback: delete what we saved
      await this.rollbackSupabaseInserts(
        supabase,
        tankSaved ? tankResult.tank_id : undefined,
        [
          ...(fish1Saved ? [fish1Result.fish_id] : []),
          ...(fish2Saved ? [fish2Result.fish_id] : []),
        ]
      );

      throw new Error(
        `Starter pack minting failed during Supabase save: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `On-chain mints were successful (tank_tx: ${tankResult.tx_hash}, fish1_tx: ${fish1Result.tx_hash}, fish2_tx: ${fish2Result.tx_hash}). ` +
        `Rollback attempted.`
      );
    }
  }

  // ============================================================================
  // PLAYER RETRIEVAL
  // ============================================================================

  /**
   * Retrieves a player by their Starknet address.
   * 
   * @param address - Starknet wallet address
   * @returns Player data
   * @throws ValidationError if address is invalid
   * @throws NotFoundError if player doesn't exist
   */
  async getPlayerByAddress(address: string): Promise<Player> {
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

    // Query Supabase
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('address', address.trim())
      .single();

    // Handle Supabase errors
    if (error) {
      // Supabase returns error when no rows found
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Player with address ${address} not found`);
      }
      // Other database errors
      throw new Error(`Database error: ${error.message}`);
    }

    // Double check data exists
    if (!data) {
      throw new NotFoundError(`Player with address ${address} not found`);
    }

    return this.mapSupabaseToPlayer(data);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Maps Supabase player data to Player type.
   * Converts database timestamps to Date objects and ensures all required fields are present.
   */
  private mapSupabaseToPlayer(supabasePlayer: any): Player {
    return {
      address: supabasePlayer.address,
      total_xp: supabasePlayer.total_xp ?? 0,
      fish_count: supabasePlayer.fish_count ?? 0,
      tournaments_won: supabasePlayer.tournaments_won ?? 0,
      reputation: supabasePlayer.reputation ?? 0,
      offspring_created: supabasePlayer.offspring_created ?? 0,
      avatar_url: supabasePlayer.avatar_url ?? null, // Always include avatar_url, null if not set
      created_at: new Date(supabasePlayer.created_at),
      updated_at: new Date(supabasePlayer.updated_at),
    };
  }

  /**
   * Rollback helper: deletes saved records from Supabase.
   * Used when a later operation fails and we need to clean up.
   * 
   * @param supabase - Supabase client instance
   * @param tankId - Tank ID to delete (if saved)
   * @param fishIds - Fish IDs to delete (if saved)
   */
  private async rollbackSupabaseInserts(
    supabase: ReturnType<typeof getSupabaseClient>,
    tankId?: number,
    fishIds: number[] = []
  ): Promise<void> {
    // Delete fish first (foreign key order)
    for (const fishId of fishIds) {
      try {
        await supabase.from('fish').delete().eq('id', fishId);
      } catch (error) {
        // Log but don't throw - best effort rollback
        logError(`Rollback: Failed to delete fish ${fishId}`, error);
      }
    }

    // Delete tank
    if (tankId !== undefined) {
      try {
        await supabase.from('tanks').delete().eq('id', tankId);
      } catch (error) {
        // Log but don't throw - best effort rollback
        logError(`Rollback: Failed to delete tank ${tankId}`, error);
      }
    }
  }
}
