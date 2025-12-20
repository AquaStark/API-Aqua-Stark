export enum FishState {
  Baby = 'Baby',
  Juvenile = 'Juvenile',
  YoungAdult = 'YoungAdult',
  Adult = 'Adult',
}

// On-chain fields (from Dojo/Starknet)
export interface FishOnChain {
  id: number;
  xp: number;
  state: FishState | string;
  hunger: number;
  isReadyToBreed: boolean;
  dna: string;
}

// Off-chain fields (from Supabase)
export interface FishOffChain {
  id: number;
  owner: string;
  species: string;
  imageUrl: string;
  createdAt: Date;
}

export interface Fish extends FishOnChain, Omit<FishOffChain, 'id'> {
  id: number;
}

/**
 * Summary of fish data without on-chain information.
 * Used for lists where full on-chain data is not needed.
 * For complete fish data, use the Fish interface or GET /api/fish/:id endpoint.
 */
export interface FishSummary extends FishOffChain {
  id: number;
}

export interface CreateFishDto {
  id: number;
  owner: string;
  species: string;
  imageUrl: string;
}

export interface UpdateFishDto {
  species?: string;
  imageUrl?: string;
}

/**
 * DTO for feeding multiple fish in a batch operation.
 * Used in POST /fish/feed endpoint.
 */
export interface FeedFishBatchDto {
  fish_ids: number[];
  owner: string;
}

/**
 * DTO for breeding two fish together.
 * Used in POST /fish/breed endpoint.
 */
export interface BreedFishDto {
  fish1_id: number;
  fish2_id: number;
  owner: string;
}