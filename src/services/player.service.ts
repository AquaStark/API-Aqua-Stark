/**
 * @fileoverview Player Service
 * 
 * Business logic for player operations.
 * Handles validation, database queries, and error handling.
 */

import { NotFoundError, ValidationError } from '../core/errors';
import { supabase } from '../core/utils/supabase';
import type { Player } from '../models/player.model';

/**
 * Player service for managing player data.
 */
export class PlayerService {
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

    // Map Supabase response to Player model
    // Supabase returns dates as ISO strings, convert to Date objects
    const player: Player = {
      address: data.address,
      total_xp: data.total_xp ?? 0,
      fish_count: data.fish_count ?? 0,
      tournaments_won: data.tournaments_won ?? 0,
      reputation: data.reputation ?? 0,
      offspring_created: data.offspring_created ?? 0,
      avatar_url: data.avatar_url ?? undefined,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };

    return player;
  }
}

