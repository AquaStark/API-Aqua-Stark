/**
 * @fileoverview Dojo Client Utility
 * 
 * Provides stub functions for all on-chain contract interactions.
 * These stubs return mock data and will be replaced with real Dojo
 * contract calls when the contracts are deployed.
 * 
 * @see docs/dojo-stubs.md for implementation guide
 */

import { DOJO_ACCOUNT_ADDRESS, DOJO_PRIVATE_KEY } from '../config';
import { logDebug, logInfo, logWarn } from './logger';
import {
  DojoTransactionResult,
  FishFamilyTree,
  FishFamilyMember,
  DecorationKind,
} from '../types';

// Flag to track if client is initialized
let isInitialized = false;

/**
 * Generates a mock transaction hash.
 * Format: 0x + 64 hex characters (simulates Starknet tx hash)
 * 
 * @returns Mock transaction hash string
 */
function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Creates a successful transaction result with mock tx_hash.
 * 
 * @returns DojoTransactionResult with success=true
 */
function createMockTransactionResult(): DojoTransactionResult {
  return {
    tx_hash: generateMockTxHash(),
    success: true,
  };
}

/**
 * Initializes the Dojo client.
 * Validates that required environment variables are set.
 * 
 * @returns True if initialization successful, false otherwise
 */
export function initializeDojoClient(): boolean {
  if (isInitialized) {
    logDebug('Dojo client already initialized');
    return true;
  }

  if (!DOJO_ACCOUNT_ADDRESS || !DOJO_PRIVATE_KEY) {
    logWarn('Dojo client not configured - DOJO_ACCOUNT_ADDRESS or DOJO_PRIVATE_KEY missing');
    logWarn('Running in stub mode - all contract calls will return mock data');
    isInitialized = true;
    return true;
  }

  // TODO: Initialize real Dojo client here when contracts are ready
  // const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
  // const account = new Account(provider, DOJO_ACCOUNT_ADDRESS, DOJO_PRIVATE_KEY);

  logInfo('Dojo client initialized (stub mode)');
  isInitialized = true;
  return true;
}

/**
 * Validates that the Dojo client is ready for use.
 * 
 * @returns True if client is ready
 */
export function isDojoClientReady(): boolean {
  return isInitialized;
}

// ============================================================================
// PLAYER FUNCTIONS
// ============================================================================

/**
 * Registers a new player on-chain.
 * STUB: Returns mock transaction hash.
 * 
 * @param address - Player's wallet address
 * @returns Transaction hash
 */
export async function registerPlayer(address: string): Promise<string> {
  logDebug(`[STUB] registerPlayer called with address: ${address}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('register_player', [address]);
  
  const result = createMockTransactionResult();
  logInfo(`Player registered (stub): ${address}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Grants XP to a player.
 * STUB: Returns mock transaction hash.
 * 
 * @param address - Player's wallet address
 * @param amount - Amount of XP to grant
 * @returns Transaction hash
 */
export async function gainPlayerXp(address: string, amount: number): Promise<string> {
  logDebug(`[STUB] gainPlayerXp called - address: ${address}, amount: ${amount}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('gain_player_xp', [address, amount]);
  
  const result = createMockTransactionResult();
  logInfo(`Player XP granted (stub): ${address} +${amount}xp, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

// ============================================================================
// FISH FUNCTIONS
// ============================================================================

/**
 * Mints a new fish NFT for a player.
 * STUB: Returns mock transaction hash.
 * 
 * @param address - Owner's wallet address
 * @returns Transaction hash
 */
export async function mintFish(address: string): Promise<string> {
  logDebug(`[STUB] mintFish called with address: ${address}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('mint_fish', [address]);
  
  const result = createMockTransactionResult();
  logInfo(`Fish minted (stub): owner=${address}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Feeds multiple fish in a batch operation.
 * STUB: Returns mock transaction hash.
 * 
 * @param fishIds - Array of fish IDs to feed
 * @returns Transaction hash
 */
export async function feedFishBatch(fishIds: number[]): Promise<string> {
  logDebug(`[STUB] feedFishBatch called with fishIds: [${fishIds.join(', ')}]`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('feed_fish_batch', [fishIds]);
  
  const result = createMockTransactionResult();
  logInfo(`Fish fed (stub): ${fishIds.length} fish, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Grants XP to a specific fish.
 * STUB: Returns mock transaction hash.
 * 
 * @param fishId - ID of the fish
 * @param amount - Amount of XP to grant
 * @returns Transaction hash
 */
export async function gainFishXp(fishId: number, amount: number): Promise<string> {
  logDebug(`[STUB] gainFishXp called - fishId: ${fishId}, amount: ${amount}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('gain_fish_xp', [fishId, amount]);
  
  const result = createMockTransactionResult();
  logInfo(`Fish XP granted (stub): fish=${fishId} +${amount}xp, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Breeds two fish to create offspring.
 * STUB: Returns mock transaction hash.
 * 
 * @param fish1Id - ID of first parent fish
 * @param fish2Id - ID of second parent fish
 * @returns Transaction hash
 */
export async function breedFish(fish1Id: number, fish2Id: number): Promise<string> {
  logDebug(`[STUB] breedFish called - fish1: ${fish1Id}, fish2: ${fish2Id}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('breed_fish', [fish1Id, fish2Id]);
  
  const result = createMockTransactionResult();
  logInfo(`Fish bred (stub): parents=${fish1Id},${fish2Id}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Gets the family tree (ancestry) of a fish.
 * STUB: Returns mock family tree data.
 * 
 * @param fishId - ID of the fish
 * @returns FishFamilyTree with ancestors
 */
export async function getFishFamilyTree(fishId: number): Promise<FishFamilyTree> {
  logDebug(`[STUB] getFishFamilyTree called with fishId: ${fishId}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.call('get_fish_family_tree', [fishId]);
  
  // Mock family tree with 2 generations
  const ancestors: FishFamilyMember[] = [
    { id: fishId, parent1_id: fishId + 100, parent2_id: fishId + 101, generation: 0 },
    { id: fishId + 100, parent1_id: null, parent2_id: null, generation: 1 },
    { id: fishId + 101, parent1_id: null, parent2_id: null, generation: 1 },
  ];

  const familyTree: FishFamilyTree = {
    fish_id: fishId,
    ancestors,
    generation_count: 2,
  };

  logInfo(`Fish family tree retrieved (stub): fish=${fishId}, generations=${familyTree.generation_count}`);
  return familyTree;
}

// ============================================================================
// TANK FUNCTIONS
// ============================================================================

/**
 * Mints a new tank NFT for a player.
 * STUB: Returns mock transaction hash.
 * 
 * @param address - Owner's wallet address
 * @returns Transaction hash
 */
export async function mintTank(address: string): Promise<string> {
  logDebug(`[STUB] mintTank called with address: ${address}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('mint_tank', [address]);
  
  const result = createMockTransactionResult();
  logInfo(`Tank minted (stub): owner=${address}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Gets the total XP multiplier for a tank based on active decorations.
 * STUB: Returns mock multiplier value.
 * 
 * @param tankId - ID of the tank
 * @returns XP multiplier value
 */
export async function getXpMultiplier(tankId: number): Promise<number> {
  logDebug(`[STUB] getXpMultiplier called with tankId: ${tankId}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.call('get_xp_multiplier', [tankId]);
  
  // Mock multiplier (1.0 = no bonus, 1.5 = 50% bonus, etc.)
  const mockMultiplier = 1.25;
  
  logInfo(`XP multiplier retrieved (stub): tank=${tankId}, multiplier=${mockMultiplier}`);
  return mockMultiplier;
}

// ============================================================================
// DECORATION FUNCTIONS
// ============================================================================

/**
 * Mints a new decoration NFT for a player.
 * STUB: Returns mock transaction hash.
 * 
 * @param address - Owner's wallet address
 * @param kind - Type of decoration to mint
 * @returns Transaction hash
 */
export async function mintDecoration(address: string, kind: DecorationKind): Promise<string> {
  logDebug(`[STUB] mintDecoration called - address: ${address}, kind: ${kind}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('mint_decoration', [address, kind]);
  
  const result = createMockTransactionResult();
  logInfo(`Decoration minted (stub): owner=${address}, kind=${kind}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Activates a decoration (places it in a tank).
 * STUB: Returns mock transaction hash.
 * 
 * @param id - Decoration ID to activate
 * @returns Transaction hash
 */
export async function activateDecoration(id: number): Promise<string> {
  logDebug(`[STUB] activateDecoration called with id: ${id}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('activate_decoration', [id]);
  
  const result = createMockTransactionResult();
  logInfo(`Decoration activated (stub): id=${id}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}

/**
 * Deactivates a decoration (removes it from a tank).
 * STUB: Returns mock transaction hash.
 * 
 * @param id - Decoration ID to deactivate
 * @returns Transaction hash
 */
export async function deactivateDecoration(id: number): Promise<string> {
  logDebug(`[STUB] deactivateDecoration called with id: ${id}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('deactivate_decoration', [id]);
  
  const result = createMockTransactionResult();
  logInfo(`Decoration deactivated (stub): id=${id}, tx: ${result.tx_hash}`);
  return result.tx_hash;
}
