# Dojo Contract Stubs

This document describes the stub implementation for Dojo contract interactions and provides guidance for replacing them with real implementations.

## Overview

The Dojo client (`src/core/utils/dojo-client.ts`) provides stub functions for all on-chain contract interactions. These stubs:

- Return mock transaction hashes and data
- Log all calls for debugging purposes
- Follow the exact function signatures expected by the real contracts

## Configuration

Set these environment variables in `.env`:

```env
DOJO_ACCOUNT_ADDRESS=0x...
DOJO_PRIVATE_KEY=0x...
```

If not configured, the client runs in stub mode with warning logs.

## Available Functions

### Player Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `registerPlayer` | `address: string` | `tx_hash` | Registers a new player on-chain |
| `gainPlayerXp` | `address: string, amount: number` | `tx_hash` | Grants XP to a player |

### Fish Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `mintFish` | `address: string` | `tx_hash` | Mints a new fish NFT |
| `feedFishBatch` | `fishIds: number[]` | `tx_hash` | Feeds multiple fish |
| `gainFishXp` | `fishId: number, amount: number` | `tx_hash` | Grants XP to a fish |
| `breedFish` | `fish1Id: number, fish2Id: number` | `tx_hash` | Breeds two fish |
| `getFishFamilyTree` | `fishId: number` | `FishFamilyTree` | Gets fish ancestry |

### Tank Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `mintTank` | `address: string` | `tx_hash` | Mints a new tank NFT |
| `getXpMultiplier` | `tankId: number` | `number` | Gets XP multiplier from decorations |

### Decoration Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `mintDecoration` | `address: string, kind: DecorationKind` | `tx_hash` | Mints a decoration NFT |
| `activateDecoration` | `id: number` | `tx_hash` | Activates a decoration |
| `deactivateDecoration` | `id: number` | `tx_hash` | Deactivates a decoration |

## Types Management

### Centralized Type System

**All on-chain types MUST be defined or re-exported in `src/core/types/dojo-types.ts`.**

This is the **single source of truth** for all Dojo-related types. This centralization:

- Ensures consistency across the codebase
- Makes imports simpler (one import instead of multiple)
- Facilitates maintenance and future development
- Keeps types organized and discoverable

### Current Types Structure

All types are defined in `src/core/types/dojo-types.ts`:

```typescript
// Re-exported on-chain model types (from models/)
export type { PlayerOnChain } from '../../models/player.model';
export type { TankOnChain } from '../../models/tank.model';
export type { FishOnChain } from '../../models/fish.model';
export type { DecorationOnChain } from '../../models/decoration.model';

// Re-exported enums
export { DecorationKind } from '../../models/decoration.model';

// Dojo-specific types
interface DojoTransactionResult {
  tx_hash: string;
  success: boolean;
}

interface FishFamilyTree {
  fish_id: number;
  ancestors: FishFamilyMember[];
  generation_count: number;
}
```

### Adding New Types

When you need to add new types for Dojo operations, follow this process:

#### 1. If it's an on-chain model type:

If the type represents data from a model that comes from Dojo/Starknet:

1. **Add the type to the model file** (e.g., `src/models/new-model.model.ts`):
   ```typescript
   export interface NewModelOnChain {
     id: number;
     // ... on-chain fields
   }
   ```

2. **Re-export it in `dojo-types.ts`**:
   ```typescript
   export type { NewModelOnChain } from '../../models/new-model.model';
   ```

3. **Export it from `src/core/types/index.ts`**:
   ```typescript
   export type { NewModelOnChain } from './dojo-types';
   ```

#### 2. If it's a Dojo-specific operation type:

If the type is specific to Dojo operations (not a model):

1. **Define it directly in `dojo-types.ts`**:
   ```typescript
   /**
    * Result of a batch operation on-chain.
    */
   export interface BatchOperationResult {
     tx_hash: string;
     items_processed: number;
     success: boolean;
   }
   ```

2. **Export it from `src/core/types/index.ts`**:
   ```typescript
   export type { BatchOperationResult } from './dojo-types';
   ```

### Usage Pattern

**Always import Dojo types from the centralized location (`src/core/types/index.ts`):**

```typescript
// ✅ CORRECT - Import from the centralized types index
// From src/core/utils/ or src/services/
import { 
  PlayerOnChain, 
  FishOnChain, 
  DojoTransactionResult,
  DecorationKind
} from '../types';

// From src/controllers/ or src/api/
import { 
  PlayerOnChain, 
  FishOnChain 
} from '../core/types';

// ❌ WRONG - Don't import directly from dojo-types.ts
import { PlayerOnChain } from '../types/dojo-types';

// ❌ WRONG - Don't import directly from models
import { PlayerOnChain } from '../models/player.model';
import { FishOnChain } from '../models/fish.model';
```

**Note:** The path depends on your file location:
- From `src/core/utils/` or `src/services/`: use `'../types'`
- From `src/controllers/` or `src/api/`: use `'../core/types'`
- Always use the index (`index.ts`), never import directly from `dojo-types.ts`

### Why This Structure?

1. **Single Import Point**: All Dojo types come from one place
2. **Clear Separation**: On-chain types (Dojo) vs off-chain types (Supabase)
3. **Easy Discovery**: Developers know where to find/add types
4. **Maintainability**: Changes to types happen in one place
5. **Type Safety**: TypeScript ensures consistency across the codebase

### Future Development

When adding new Dojo contract interactions:

1. Define any new types in `dojo-types.ts` (or re-export from models)
2. Add the stub function in `dojo-client.ts`
3. Use the types in your service/controller code
4. Update this documentation if adding new patterns

## Replacing Stubs with Real Implementations

Each stub function contains a `TODO` comment showing where to add the real contract call:

```typescript
export async function registerPlayer(address: string): Promise<string> {
  logDebug(`[STUB] registerPlayer called with address: ${address}`);
  
  // TODO: Replace with real Dojo contract call
  // const result = await contract.invoke('register_player', [address]);
  
  const result = createMockTransactionResult();
  return result.tx_hash;
}
```

### Implementation Steps

1. **Initialize the real Dojo client** in `initializeDojoClient()`:

```typescript
import { RpcProvider, Account } from 'starknet';

const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
const account = new Account(provider, DOJO_ACCOUNT_ADDRESS, DOJO_PRIVATE_KEY);
```

2. **Replace stub logic** with actual contract calls:

```typescript
export async function registerPlayer(address: string): Promise<string> {
  const result = await contract.invoke('register_player', [address]);
  return result.transaction_hash;
}
```

3. **Handle errors** using `OnChainError` from `src/core/errors/`:

```typescript
import { OnChainError } from '../errors';

try {
  const result = await contract.invoke('register_player', [address]);
  return result.transaction_hash;
} catch (error) {
  throw new OnChainError('Failed to register player', { address, error });
}
```

## Debugging

All stub calls are logged:

- `logDebug`: Shows function name and parameters
- `logInfo`: Shows operation result and mock tx_hash

Enable debug logging by setting `NODE_ENV=development`.

## Dependencies

The project already includes required dependencies:

- `@dojoengine/core`: 1.8.5
- `starknet`: 5.14.0
