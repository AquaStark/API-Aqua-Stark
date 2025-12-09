// On-chain fields (from Dojo/Starknet)
export interface FishOnChain {
  id: number;
  xp: number;
  state: string;
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
