/**
 * @fileoverview Decoration Service
 * 
 * Handles business logic for decoration operations including retrieval,
 * and synchronization between Supabase and on-chain data.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { ValidationError, NotFoundError, OnChainError, ConflictError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { logError } from '@/core/utils/logger';
import { getDecorationOnChain, activateDecoration as activateDecorationOnChain, deactivateDecoration as deactivateDecorationOnChain } from '@/core/utils/dojo-client';
import { SyncService } from '@/services/sync.service';
import type { Decoration, DecorationKind } from '@/models/decoration.model';

// ============================================================================
// DECORATION SERVICE
// ============================================================================

/**
 * Service for managing decoration data and operations.
 */
export class DecorationService {
  
  // ============================================================================
  // DECORATION RETRIEVAL
  // ============================================================================

  /**
   * Retrieves a decoration by its ID.
   * 
   * Combines data from:
   * 1. Off-chain (Supabase): owner, kind, is_active, image_url, created_at
   * 2. On-chain (Dojo): id, owner, kind, xp_multiplier
   * 
   * @param id - Decoration ID
   * @returns Complete Decoration data
   * @throws {ValidationError} If ID is invalid
   * @throws {NotFoundError} If decoration doesn't exist
   */
  async getDecorationById(id: number): Promise<Decoration> {
    // Validate ID
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new ValidationError('Invalid decoration ID');
    }

    const supabase = getSupabaseClient();

    // 1. Get off-chain data from Supabase
    const { data: decorationOffChain, error } = await supabase
      .from('decorations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Decoration with ID ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!decorationOffChain) {
      throw new NotFoundError(`Decoration with ID ${id} not found`);
    }

    // 2. Get on-chain data from Dojo
    try {
      const decorationOnChain = await getDecorationOnChain(id);

      // 3. Combine data
      const decoration: Decoration = {
        // On-chain data
        id: decorationOnChain.id,
        owner: decorationOnChain.owner,
        kind: decorationOnChain.kind,
        xp_multiplier: decorationOnChain.xp_multiplier,
        
        // Off-chain data
        is_active: decorationOffChain.is_active,
        imageUrl: decorationOffChain.image_url, 
        sprite_url: decorationOffChain.image_url ?? null, // Map image_url to sprite_url
        createdAt: new Date(decorationOffChain.created_at), 
      };

      return decoration;
    } catch (error) {
      logError(`Failed to get on-chain data for decoration ${id}`, error);
      // If on-chain fetch fails, we throw OnChainError as the decoration is fundamentally an on-chain asset
      throw new OnChainError(
        `Failed to retrieve on-chain data for decoration ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieves all decorations owned by a specific player.
   * 
   * Combines data from:
   * 1. Off-chain (Supabase): owner, kind, is_active, image_url, created_at
   * 2. On-chain (Dojo): id, owner, kind, xp_multiplier
   * 
   * @param address - Player's Starknet wallet address
   * @returns Array of complete Decoration data (empty array if player has no decorations)
   * @throws {ValidationError} If address is invalid
   * @throws {NotFoundError} If player doesn't exist
   */
  async getDecorationsByOwner(address: string): Promise<Decoration[]> {
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

    // 2. Get off-chain data from Supabase (all decorations owned by this player)
    const { data: decorationsOffChainList, error: decorationsError } = await supabase
      .from('decorations')
      .select('*')
      .eq('owner', trimmedAddress)
      .order('id', { ascending: true });

    if (decorationsError) {
      throw new Error(`Database error: ${decorationsError.message}`);
    }

    // If player has no decorations, return empty array (not an error)
    if (!decorationsOffChainList || decorationsOffChainList.length === 0) {
      return [];
    }

    // Data type for Supabase decoration row
    type DecorationRow = {
      id: number;
      owner: string;
      kind: DecorationKind;
      is_active: boolean;
      image_url: string;
      created_at: string;
    };

    // 3. Get on-chain data for all decorations in parallel
    try {
      const decorationsOnChainPromises = decorationsOffChainList.map((decoration: DecorationRow) =>
        getDecorationOnChain(decoration.id)
      );
      const decorationsOnChainList = await Promise.all(decorationsOnChainPromises);

      // 4. Combine off-chain and on-chain data
      const decorationList: Decoration[] = decorationsOffChainList.map((decorationOffChain: DecorationRow, index: number) => {
        const decorationOnChain = decorationsOnChainList[index];
        return {
          // On-chain data
          id: decorationOnChain.id,
          owner: decorationOnChain.owner,
          kind: decorationOnChain.kind,
          xp_multiplier: decorationOnChain.xp_multiplier,

          // Off-chain data
          is_active: decorationOffChain.is_active,
          imageUrl: decorationOffChain.image_url, 
          sprite_url: decorationOffChain.image_url ?? null, // Map image_url to sprite_url
          createdAt: new Date(decorationOffChain.created_at), 
        };
      });

      return decorationList;
    } catch (error) {
      logError(`Failed to get on-chain data for decorations owned by ${address}`, error);
      // If on-chain fetch fails, we throw OnChainError as the decoration is fundamentally an on-chain asset
      throw new OnChainError(
        `Failed to retrieve on-chain data for decorations owned by ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============================================================================
  // DECORATION ACTIVATION
  // ============================================================================

  /**
   * Activates a decoration, making its XP multiplier apply to fish XP gains
   * in the associated tank.
   * 
   * Flow:
   * 1. Validate decoration ID and owner address
   * 2. Get decoration to validate existence and ownership
   * 3. Validate decoration is not already active
   * 4. Call activateDecoration() on-chain
   * 5. Update is_active to true in Supabase
   * 6. Return updated decoration
   * 
   * @param id - Decoration ID
   * @param owner - Owner's Starknet wallet address
   * @returns Updated Decoration with is_active = true
   * @throws {ValidationError} If ID or address is invalid, or ownership doesn't match
   * @throws {NotFoundError} If decoration doesn't exist
   * @throws {ConflictError} If decoration is already active
   * @throws {OnChainError} If on-chain activation fails
   */
  async activateDecoration(id: number, owner: string): Promise<Decoration> {
    // Validate ID
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new ValidationError('Invalid decoration ID');
    }

    // Validate address
    if (!owner || owner.trim().length === 0) {
      throw new ValidationError('Owner address is required');
    }

    // Basic Starknet address format validation (starts with 0x and is hex)
    const addressPattern = /^0x[a-fA-F0-9]{63,64}$/;
    if (!addressPattern.test(owner.trim())) {
      throw new ValidationError('Invalid Starknet address format');
    }

    const trimmedOwner = owner.trim();

    // Get decoration to validate existence and get current state
    const decoration = await this.getDecorationById(id);

    // Validate ownership
    if (decoration.owner !== trimmedOwner) {
      throw new ValidationError(`Decoration with ID ${id} does not belong to owner ${trimmedOwner}`);
    }

    // Validate decoration is not already active
    if (decoration.is_active) {
      throw new ConflictError(`Decoration with ID ${id} is already active`);
    }

    // Call on-chain activateDecoration function
    let activateTxHash: string;
    try {
      activateTxHash = await activateDecorationOnChain(id);
    } catch (error) {
      logError(`Failed to activate decoration ${id} on-chain`, error);
      throw new OnChainError(
        `Failed to activate decoration ${id} on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Add activation transaction to sync queue
    try {
      const syncService = new SyncService();
      await syncService.addToSyncQueue(activateTxHash, 'decoration', id.toString());
    } catch (syncError) {
      // Log error but don't fail the operation - sync queue is for tracking
      logError('Failed to add decoration activation to sync queue', {
        error: syncError,
        tx_hash: activateTxHash,
        decoration_id: id,
      });
    }

    // Update is_active to true in Supabase
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from('decorations')
      .update({ is_active: true })
      .eq('id', id);

    if (updateError) {
      logError(`Failed to update decoration ${id} in Supabase`, updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    // Return updated decoration
    return await this.getDecorationById(id);
  }

  // ============================================================================
  // DECORATION DEACTIVATION
  // ============================================================================

  /**
   * Deactivates a decoration, removing its XP multiplier from fish XP gains
   * in the associated tank.
   * 
   * Flow:
   * 1. Validate decoration ID and owner address
   * 2. Get decoration to validate existence and ownership
   * 3. Validate decoration is currently active
   * 4. Call deactivateDecoration() on-chain
   * 5. Update is_active to false in Supabase
   * 6. Return updated decoration
   * 
   * @param id - Decoration ID
   * @param owner - Owner's Starknet wallet address
   * @returns Updated Decoration with is_active = false
   * @throws {ValidationError} If ID or address is invalid, or ownership doesn't match
   * @throws {NotFoundError} If decoration doesn't exist
   * @throws {ConflictError} If decoration is already inactive
   * @throws {OnChainError} If on-chain deactivation fails
   */
  async deactivateDecoration(id: number, owner: string): Promise<Decoration> {
    // Validate ID
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new ValidationError('Invalid decoration ID');
    }

    // Validate address
    if (!owner || owner.trim().length === 0) {
      throw new ValidationError('Owner address is required');
    }

    // Basic Starknet address format validation (starts with 0x and is hex)
    const addressPattern = /^0x[a-fA-F0-9]{63,64}$/;
    if (!addressPattern.test(owner.trim())) {
      throw new ValidationError('Invalid Starknet address format');
    }

    const trimmedOwner = owner.trim();

    // Get decoration to validate existence and get current state
    const decoration = await this.getDecorationById(id);

    // Validate ownership
    if (decoration.owner !== trimmedOwner) {
      throw new ValidationError(`Decoration with ID ${id} does not belong to owner ${trimmedOwner}`);
    }

    // Validate decoration is currently active
    if (!decoration.is_active) {
      throw new ConflictError(`Decoration with ID ${id} is already inactive`);
    }

    // Call on-chain deactivateDecoration function
    let deactivateTxHash: string;
    try {
      deactivateTxHash = await deactivateDecorationOnChain(id);
    } catch (error) {
      logError(`Failed to deactivate decoration ${id} on-chain`, error);
      throw new OnChainError(
        `Failed to deactivate decoration ${id} on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Add deactivation transaction to sync queue
    try {
      const syncService = new SyncService();
      await syncService.addToSyncQueue(deactivateTxHash, 'decoration', id.toString());
    } catch (syncError) {
      // Log error but don't fail the operation - sync queue is for tracking
      logError('Failed to add decoration deactivation to sync queue', {
        error: syncError,
        tx_hash: deactivateTxHash,
        decoration_id: id,
      });
    }

    // Update is_active to false in Supabase
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from('decorations')
      .update({ is_active: false })
      .eq('id', id);

    if (updateError) {
      logError(`Failed to update decoration ${id} in Supabase`, updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    // Return updated decoration
    return await this.getDecorationById(id);
  }
}
