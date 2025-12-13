/**
 * @fileoverview Player Service
 * 
 * Handles business logic for player operations including registration,
 * retrieval, and synchronization between Supabase and on-chain data.
 */

import { ValidationError, OnChainError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { registerPlayer as registerPlayerOnChain } from '@/core/utils/dojo-client';
import type { Player, CreatePlayerDto } from '@/models/player.model';

/**
 * Service for managing player data and operations.
 * 
 * Handles:
 * - Player registration (both Supabase and on-chain)
 * - Player retrieval from Supabase
 * - Synchronization between off-chain and on-chain data
 */
export class PlayerService {
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
      throw new Error(`Failed to create player in Supabase: ${insertError.message}`);
    }

    if (!createdPlayer) {
      throw new Error('Player creation failed - no data returned');
    }

    // Register player on-chain
    try {
      await registerPlayerOnChain(address);
    } catch (error) {
      // If on-chain registration fails, we should still have the Supabase record
      // but we throw an error to indicate the operation wasn't fully successful
      throw new OnChainError(
        `Failed to register player on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined
      );
    }

    return this.mapSupabaseToPlayer(createdPlayer);
  }

  /**
   * Maps Supabase player data to Player type.
   * 
   * Converts database timestamps to Date objects and ensures
   * all required fields are present.
   * 
   * @param supabasePlayer - Raw player data from Supabase
   * @returns Player object with proper types
   */
  private mapSupabaseToPlayer(supabasePlayer: any): Player {
    return {
      address: supabasePlayer.address,
      total_xp: supabasePlayer.total_xp ?? 0,
      fish_count: supabasePlayer.fish_count ?? 0,
      tournaments_won: supabasePlayer.tournaments_won ?? 0,
      reputation: supabasePlayer.reputation ?? 0,
      offspring_created: supabasePlayer.offspring_created ?? 0,
      avatar_url: supabasePlayer.avatar_url ?? undefined,
      created_at: new Date(supabasePlayer.created_at),
      updated_at: new Date(supabasePlayer.updated_at),
    };
  }
}
