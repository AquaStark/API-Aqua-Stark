/**
 * @fileoverview Fish Service
 * 
 * Handles business logic for fish operations including retrieval,
 * feeding, breeding, and synchronization between Supabase and on-chain data.
 * 
 * Tank Capacity Rules:
 * - Each fish is assigned to a tank via tank_id
 * - Before breeding, the owner's tank capacity is validated
 * - New fish are automatically assigned to the owner's first tank
 * - If tank is at capacity, ConflictError is thrown
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { ValidationError, NotFoundError, OnChainError } from '@/core/errors';
import { TankService } from '@/services/tank.service';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { logError } from '@/core/utils/logger';
import { getFishOnChain, gainFishXp, gainPlayerXp, breedFish as breedFishOnChain } from '@/core/utils/dojo-client';
import { getActiveDecorationsMultiplier, getFeedBaseXp, calculateFishXp } from '@/core/utils/xp-calculator';
import { buildFishFamilyTree } from '@/core/utils/fish-genealogy';
import type { Fish } from '@/models/fish.model';
import { FishState } from '@/models/fish.model';
import type { FishFamilyTree } from '@/core/types/dojo-types';

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
        spriteUrl: fishOffChain.sprite_url ?? null, // Map sprite_url from database
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
      sprite_url: string | null;
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
          spriteUrl: fishOffChain.sprite_url ?? null, // Map sprite_url from database
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

  /**
   * Retrieves the complete family tree of a fish.
   * 
   * Builds and returns the fish's complete lineage including:
   * - The fish itself (generation 0)
   * - All ancestors (parents, grandparents, etc.)
   * - All descendants (children, grandchildren, etc.)
   * 
   * Uses the genealogy utility to traverse the family tree from Supabase data.
   * 
   * @param fishId - Fish ID
   * @returns Complete FishFamilyTree with ancestors and descendants
   * @throws {ValidationError} If ID is invalid
   * @throws {NotFoundError} If fish doesn't exist
   */
  async getFishFamily(fishId: number): Promise<FishFamilyTree> {
    // Validate ID
    if (!fishId || fishId <= 0 || !Number.isInteger(fishId)) {
      throw new ValidationError('Invalid fish ID');
    }

    // Use genealogy utility to build the complete family tree
    // This function handles:
    // - Verifying the fish exists (throws NotFoundError if not)
    // - Building ancestors tree (upwards)
    // - Building descendants tree (downwards)
    // - Preventing infinite recursion with MAX_GENERATION_DEPTH
    return await buildFishFamilyTree(fishId);
  }

  // ============================================================================
  // TANK CAPACITY
  // ============================================================================

  /**
   * Gets the count of fish in a specific tank.
   * 
   * Queries Supabase for fish with the specified tank_id.
   * Used for tank capacity validation before adding new fish.
   * 
   * @param tankId - Tank ID to count fish for
   * @returns Number of fish in the tank
   * @throws {ValidationError} If tankId is invalid
   */
  async getFishCountInTank(tankId: number): Promise<number> {
    // Validate tankId
    if (!tankId || tankId <= 0 || !Number.isInteger(tankId)) {
      throw new ValidationError('Invalid tank ID');
    }

    const supabase = getSupabaseClient();

    // Count fish with matching tank_id
    const { count, error } = await supabase
      .from('fish')
      .select('id', { count: 'exact', head: true })
      .eq('tank_id', tankId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count ?? 0;
  }

  // ============================================================================
  // FISH FEEDING
  // ============================================================================

  /**
   * Feeds multiple fish in a batch operation.
   * 
   * Validates ownership of all fish, retrieves the tank for the owner to calculate
   * decoration multipliers, calculates final XP with multipliers applied, then calls
   * on-chain XP gain functions for each fish and the player.
   * 
   * The XP calculation process:
   * 1. Gets base XP from food type (default: 10 XP)
   * 2. Gets active decorations multiplier for the tank
   * 3. Calculates final XP = baseXp * (1 + multiplier/100)
   * 4. Calls gainFishXp() on-chain for each fish
   * 5. Calls gainPlayerXp() on-chain with total XP gained
   * 6. Updates player.total_xp in Supabase
   * 7. Adds sync queue entries for all on-chain operations
   * 
   * @param fishIds - Array of fish IDs to feed
   * @param owner - Owner's Starknet wallet address (for ownership validation)
   * @returns Transaction hash from the player XP gain on-chain operation
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
      const foundIds = fishList.map((f: { id: number; owner: string }) => f.id);
      const missingIds = fishIds.filter((id: number) => !foundIds.includes(id));
      throw new NotFoundError(`Fish with IDs [${missingIds.join(', ')}] not found`);
    }

    // Validate ownership - all fish must belong to the specified owner
    const invalidOwnership = fishList.filter((fish: { id: number; owner: string }) => fish.owner !== trimmedOwner);
    if (invalidOwnership.length > 0) {
      const invalidIds = invalidOwnership.map((f: { id: number; owner: string }) => f.id);
      throw new ValidationError(
        `Fish with IDs [${invalidIds.join(', ')}] do not belong to owner ${trimmedOwner}`
      );
    }

    // Get tank for the owner (all fish in batch belong to same owner)
    // This is needed to calculate decoration multipliers
    const { data: tankData, error: tankError } = await supabase
      .from('tanks')
      .select('id')
      .eq('owner', trimmedOwner)
      .single();

    if (tankError) {
      if (tankError.code === 'PGRST116') {
        // Owner doesn't have a tank - this is acceptable, we'll use multiplier 0
        // (no active decorations means no bonus XP)
        logError(`Owner ${trimmedOwner} does not have a tank - will use multiplier 0`, tankError);
      } else {
        throw new Error(`Database error when retrieving tank: ${tankError.message}`);
      }
    }

    // Extract tank_id if available, otherwise null (will result in multiplier 0)
    const tankId: number | null = tankData?.id ?? null;

    // Calculate decoration multiplier for the tank
    // getActiveDecorationsMultiplier returns a decimal (e.g., 0.15 for 15%)
    // We need to convert it to percentage (15) for calculateFishXp()
    let multiplierPercentage = 0;

    if (tankId !== null) {
      try {
        const multiplierDecimal = await getActiveDecorationsMultiplier(tankId);
        // Convert decimal to percentage: 0.15 -> 15
        multiplierPercentage = multiplierDecimal * 100;
      } catch (error) {
        // If multiplier calculation fails, log error and use 0 (no bonus XP)
        logError(`Failed to calculate decoration multiplier for tank ${tankId}, using 0`, error);
        multiplierPercentage = 0;
      }
    }

    // Get base XP for feeding (currently using default, but can be extended to support food types)
    const baseXp = getFeedBaseXp(); // Defaults to FoodType.Basic (10 XP)

    // Calculate final XP for each fish applying decoration multiplier
    // All fish in the batch belong to the same owner/tank, so they all get the same multiplier
    const finalXp = calculateFishXp(baseXp, multiplierPercentage);

    // Calculate total XP gained by the player (sum of all fish XP)
    const totalXpGained = finalXp * fishIds.length;

    // Array to store all transaction hashes for sync queue
    const fishXpTxHashes: { fishId: number; txHash: string }[] = [];

    // Call gainFishXp on-chain for each fish
    try {
      for (const fishId of fishIds) {
        const txHash = await gainFishXp(fishId, finalXp);
        fishXpTxHashes.push({ fishId, txHash });
      }
    } catch (error) {
      logError(`Failed to grant XP to fish on-chain: [${fishIds.join(', ')}]`, error);
      throw new OnChainError(
        `Failed to grant fish XP on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Call gainPlayerXp on-chain with total XP gained
    let playerXpTxHash: string;
    try {
      playerXpTxHash = await gainPlayerXp(trimmedOwner, totalXpGained);
    } catch (error) {
      logError(`Failed to grant player XP on-chain: ${trimmedOwner}`, error);
      throw new OnChainError(
        `Failed to grant player XP on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Update player.total_xp in Supabase
    // First, get current total_xp value
    const { data: playerData, error: playerFetchError } = await supabase
      .from('players')
      .select('total_xp')
      .eq('address', trimmedOwner)
      .single();

    if (playerFetchError) {
      if (playerFetchError.code === 'PGRST116') {
        throw new NotFoundError(`Player with address ${trimmedOwner} not found`);
      }
      logError('Failed to fetch player data for XP update', { error: playerFetchError, address: trimmedOwner });
      throw new Error(`Failed to fetch player data: ${playerFetchError.message}`);
    }

    if (!playerData) {
      throw new NotFoundError(`Player with address ${trimmedOwner} not found`);
    }

    // Update player total_xp with the gained XP
    const currentTotalXp = playerData.total_xp || 0;
    const newTotalXp = currentTotalXp + totalXpGained;

    const { error: updateError } = await supabase
      .from('players')
      .update({ total_xp: newTotalXp })
      .eq('address', trimmedOwner);

    if (updateError) {
      logError('Failed to update player total_xp in Supabase', { error: updateError, address: trimmedOwner });
      throw new Error(`Failed to update player total_xp: ${updateError.message}`);
    }

    // Add sync queue entries for all on-chain XP operations
    // Entry for each fish XP gain
    for (const { fishId, txHash } of fishXpTxHashes) {
      const { error: syncError } = await supabase
        .from('sync_queue')
        .insert({
          tx_hash: txHash,
          entity_type: 'fish',
          entity_id: fishId.toString(),
          status: 'pending',
        });

      if (syncError) {
        // Log error but don't fail the operation - sync queue is for tracking
        logError(`Failed to add fish XP sync queue entry for fish ${fishId}`, { error: syncError, tx_hash: txHash });
      }
    }

    // Entry for player XP gain
    const { error: playerSyncError } = await supabase
      .from('sync_queue')
      .insert({
        tx_hash: playerXpTxHash,
        entity_type: 'player',
        entity_id: trimmedOwner,
        status: 'pending',
      });

    if (playerSyncError) {
      // Log error but don't fail the operation - sync queue is for tracking
      logError(`Failed to add player XP sync queue entry for ${trimmedOwner}`, { error: playerSyncError, tx_hash: playerXpTxHash });
    }

    // Return the player XP transaction hash as the main result
    return playerXpTxHash;
  }

  // ============================================================================
  // FISH BREEDING
  // ============================================================================

  /**
   * Breeds two fish together to create offspring.
   * 
   * Validates breeding conditions:
   * - Both fish must exist and belong to the same owner
   * - Both fish must be adults (state === Adult)
   * - Both fish must be ready to breed (isReadyToBreed === true)
   * - fish1_id must be different from fish2_id
   * - Owner's tank must have capacity for the new fish
   * 
   * Creates a new fish on-chain, saves it to Supabase with parent references,
   * assigns the fish to the owner's tank, and updates player statistics.
   * 
   * @param fish1Id - ID of first parent fish
   * @param fish2Id - ID of second parent fish
   * @param owner - Owner's Starknet wallet address (for ownership validation)
   * @returns Complete Fish data of the newly created offspring
   * @throws {ValidationError} If IDs are invalid, same, or breeding conditions not met
   * @throws {NotFoundError} If fish don't exist or owner has no tank
   * @throws {ConflictError} If tank is at capacity
   * @throws {OnChainError} If the on-chain breeding operation fails
   */
  async breedFish(fish1Id: number, fish2Id: number, owner: string): Promise<Fish> {
    // Validate that fish1_id !== fish2_id
    if (fish1Id === fish2Id) {
      throw new ValidationError('Cannot breed a fish with itself');
    }

    // Validate fish IDs
    if (!fish1Id || fish1Id <= 0 || !Number.isInteger(fish1Id)) {
      throw new ValidationError(`Invalid fish1_id: ${fish1Id}`);
    }

    if (!fish2Id || fish2Id <= 0 || !Number.isInteger(fish2Id)) {
      throw new ValidationError(`Invalid fish2_id: ${fish2Id}`);
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

    // Get both fish to validate existence, ownership, and breeding conditions
    let fish1: Fish;
    let fish2: Fish;

    try {
      fish1 = await this.getFishById(fish1Id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(`Fish with ID ${fish1Id} not found`);
      }
      throw error;
    }

    try {
      fish2 = await this.getFishById(fish2Id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(`Fish with ID ${fish2Id} not found`);
      }
      throw error;
    }

    // Validate ownership - both fish must belong to the specified owner
    if (fish1.owner !== trimmedOwner) {
      throw new ValidationError(`Fish with ID ${fish1Id} does not belong to owner ${trimmedOwner}`);
    }

    if (fish2.owner !== trimmedOwner) {
      throw new ValidationError(`Fish with ID ${fish2Id} does not belong to owner ${trimmedOwner}`);
    }

    // Validate that both fish are adults
    if (fish1.state !== FishState.Adult) {
      throw new ValidationError(`Fish with ID ${fish1Id} is not an adult (current state: ${fish1.state})`);
    }

    if (fish2.state !== FishState.Adult) {
      throw new ValidationError(`Fish with ID ${fish2Id} is not an adult (current state: ${fish2.state})`);
    }

    // Validate that both fish are ready to breed
    if (!fish1.isReadyToBreed) {
      throw new ValidationError(`Fish with ID ${fish1Id} is not ready to breed`);
    }

    if (!fish2.isReadyToBreed) {
      throw new ValidationError(`Fish with ID ${fish2Id} is not ready to breed`);
    }

    // Get owner's tank and validate capacity
    const tankService = new TankService();
    const tankId = await tankService.getFirstTankIdByOwner(trimmedOwner);

    if (tankId === null) {
      throw new NotFoundError(`Owner ${trimmedOwner} has no tank. Cannot breed fish without a tank.`);
    }

    // Validate tank has capacity for the new fish (1 fish will be added)
    await tankService.checkTankCapacity(tankId, 1);

    // Call on-chain breed_fish function
    let breedResult;
    try {
      breedResult = await breedFishOnChain(fish1Id, fish2Id);
    } catch (error) {
      logError(`Failed to breed fish on-chain: fish1=${fish1Id}, fish2=${fish2Id}`, error);
      throw new OnChainError(
        `Failed to breed fish on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const newFishId = breedResult.fish_id;

    // Determine species for the new fish
    // For now, inherit from the first parent (simple logic)
    // In the future, this could be more complex genetics logic based on on-chain data
    const inheritedSpecies = fish1.species;

    // Determine image URL based on species
    // For now, inherit from first parent
    // In the future, this could be based on species mapping or on-chain genetics
    const imageUrl = fish1.imageUrl;

    // Insert new fish into Supabase with parent references and tank assignment
    const { error: insertError } = await supabase
      .from('fish')
      .insert({
        id: newFishId,
        owner: trimmedOwner,
        species: inheritedSpecies,
        image_url: imageUrl,
        parent1_id: fish1Id,
        parent2_id: fish2Id,
        tank_id: tankId,
      })
      .select()
      .single();

    if (insertError) {
      // Handle race condition: if fish with same ID was inserted by another request
      if (insertError.code === '23505') { // PostgreSQL unique violation
        // Check if the existing fish belongs to the same owner
        const { data: existingFish } = await supabase
          .from('fish')
          .select('owner')
          .eq('id', newFishId)
          .single();

        if (existingFish && existingFish.owner === trimmedOwner) {
          // Fish already exists and belongs to owner - this is acceptable
          // Continue to update player stats and return the fish
        } else {
          logError('New fish ID conflict with different owner', { error: insertError, fish_id: newFishId });
          throw new Error(`New fish ID conflict: ${insertError.message}`);
        }
      } else {
        logError('Failed to save newly bred fish to Supabase', { error: insertError, fish_id: newFishId });
        throw new Error(`Failed to save newly bred fish: ${insertError.message}`);
      }
    }

    // Update player statistics: increment offspring_created and fish_count
    // First, get current values to increment them
    const { data: playerData, error: playerFetchError } = await supabase
      .from('players')
      .select('offspring_created, fish_count')
      .eq('address', trimmedOwner)
      .single();

    if (playerFetchError) {
      if (playerFetchError.code === 'PGRST116') {
        throw new NotFoundError(`Player with address ${trimmedOwner} not found`);
      }
      logError('Failed to fetch player data for stats update', { error: playerFetchError, address: trimmedOwner });
      throw new Error(`Failed to fetch player data: ${playerFetchError.message}`);
    }

    if (!playerData) {
      throw new NotFoundError(`Player with address ${trimmedOwner} not found`);
    }

    // Update player statistics
    const { error: updateError } = await supabase
      .from('players')
      .update({
        offspring_created: (playerData.offspring_created || 0) + 1,
        fish_count: (playerData.fish_count || 0) + 1,
      })
      .eq('address', trimmedOwner);

    if (updateError) {
      logError('Failed to update player statistics after breeding', { error: updateError, address: trimmedOwner });
      throw new Error(`Failed to update player statistics: ${updateError.message}`);
    }

    // Return the complete newly created fish
    return await this.getFishById(newFishId);
  }
}

