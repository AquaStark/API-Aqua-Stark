# Getting Started

This guide will help you set up and start developing with the Aqua Stark Backend API.

## Prerequisites

- **Node.js** `20.10.0` (exact version required)
- **npm** or **yarn** package manager
- Access to:
  - Supabase project
  - Starknet RPC endpoint
  - Cartridge authentication URL

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd API-Aqua-Stark
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_DB_URL=your_db_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_DB_PASSWORD=your_supabase_password

# =============================================================================
# STARKNET CONFIGURATION
# =============================================================================
STARKNET_RPC=https://starknet-mainnet.public.blastapi.io
STARKNET_CHAIN_ID=SN_MAIN

# =============================================================================
# CARTRIDGE AUTHENTICATION
# =============================================================================
CARTRIDGE_AUTH_URL=https://cartridge.gg/auth

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=4000
NODE_ENV=development

# =============================================================================
# DOJO CONFIGURATION (Optional)
# =============================================================================
DOJO_ACCOUNT_ADDRESS=
DOJO_PRIVATE_KEY=

# =============================================================================
# CORS Configuration
# =============================================================================
CORS_ORIGIN=
CORS_CREDENTIALS=true
```

### 4. Verify Installation

```bash
# Check TypeScript compilation
npm run type-check

# Should complete without errors
```

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Available Scripts

| Script          | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript     |
| `npm start`     | Start production server              |
| `npm run type-check` | Verify types without compiling |

### Project Structure

```
/src
├── api/              # Route definitions
├── controllers/      # Request handlers
├── services/         # Business logic
├── models/           # Data models
└── core/             # Core system
    ├── types/        # Type definitions
    ├── errors/       # Error classes
    ├── responses/    # Response helpers
    ├── middleware/   # Middleware
    ├── utils/        # Utilities
    └── config/       # Configuration
```

## Creating Your First Endpoint

### 1. Create a Model

```typescript
// src/models/player.model.ts
export interface Player {
  id: string;
  address: string;
  username?: string;
  xp: number;
  level: number;
}

export interface CreatePlayerDto {
  address: string;
  username?: string;
}
```

### 2. Create a Service

```typescript
// src/services/player.service.ts
import { ValidationError, NotFoundError } from '../core/errors';
import type { Player, CreatePlayerDto } from '../models/player.model';

export class PlayerService {
  async create(dto: CreatePlayerDto): Promise<Player> {
    if (!dto.address) {
      throw new ValidationError('Address is required');
    }
    
    // Implementation here
    return player;
  }
  
  async getByAddress(address: string): Promise<Player> {
    // Implementation here
    if (!player) {
      throw new NotFoundError(`Player not found: ${address}`);
    }
    return player;
  }
}
```

### 3. Create a Controller

```typescript
// src/controllers/player.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '../core/types';
import { createSuccessResponse } from '../core/responses';
import { PlayerService } from '../services/player.service';
import type { CreatePlayerDto } from '../models/player.model';

const playerService = new PlayerService();

export async function getPlayer(
  request: FastifyRequest<{ Params: { address: string } }>,
  reply: FastifyReply
): Promise<ControllerResponse<Player>> {
  const { address } = request.params;
  const player = await playerService.getByAddress(address);
  return createSuccessResponse(player, 'Player retrieved successfully');
}

export async function createPlayer(
  request: FastifyRequest<{ Body: CreatePlayerDto }>,
  reply: FastifyReply
): Promise<ControllerResponse<Player>> {
  const dto = request.body;
  const player = await playerService.create(dto);
  return createSuccessResponse(player, 'Player created successfully');
}
```

### 4. Register Routes

```typescript
// src/api/player.routes.ts
import type { FastifyInstance } from 'fastify';
import { getPlayer, createPlayer } from '../controllers/player.controller';

export async function playerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/player/:address', getPlayer);
  app.post('/api/player', createPlayer);
}
```

```typescript
// src/api/index.ts
import type { FastifyInstance } from 'fastify';
import { playerRoutes } from './player.routes';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(playerRoutes);
}
```

## Testing Your Endpoint

### Using curl

```bash
# GET request
curl http://localhost:3000/api/player/0x123...

# POST request
curl -X POST http://localhost:3000/api/player \
  -H "Content-Type: application/json" \
  -d '{"address": "0x123...", "username": "Player1"}'
```

### Using Postman or Insomnia

1. Create a new request
2. Set method (GET, POST, etc.)
3. Set URL: `http://localhost:3000/api/player/:address`
4. Add headers: `Content-Type: application/json`
5. Add body (for POST): JSON with required fields

## Common Tasks

### Adding a New Error Type

1. Create error class in `src/core/errors/`:

```typescript
// src/core/errors/custom-error.ts
import { BaseError } from './base-error';

export class CustomError extends BaseError {
  constructor(message: string) {
    super(message, 418, 'CustomError');
  }
}
```

2. Export it in `src/core/errors/index.ts`:

```typescript
export { CustomError } from './custom-error';
```

### Adding Configuration

1. Add to `.env.example`:

```env
NEW_CONFIG_KEY=default_value
```

2. Add to `src/core/config/index.ts`:

```typescript
export const NEW_CONFIG_KEY = getEnv('NEW_CONFIG_KEY', 'default');
```

### Adding Utility Functions

Create in `src/core/utils/`:

```typescript
// src/core/utils/helpers.ts
export function calculateXP(level: number): number {
  return level * 100;
}
```

## Next Steps

- Read [Architecture](./architecture.md) to understand the system design
- Read [Standards](./standards.md) for coding conventions
- Read [Error Handling](./error-handling.md) for error management
- Read [Models](./models.md) for data structure guidelines
- Read [Responses](./responses.md) for response system details

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Type Errors

```bash
# Verify types
npm run type-check

# Check for missing dependencies
npm install
```

### Environment Variables Not Loading

- Ensure `.env` file exists in root directory
- Check variable names match exactly
- Restart development server after changes

### CORS Issues

If you're experiencing CORS errors when making requests from your frontend:

**Development:**
- Leave `CORS_ORIGIN` empty or unset to allow all origins
- This is suitable for local development

**Production:**
- Set `CORS_ORIGIN` to a comma-separated list of allowed origins
- Example: `CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com`
- Ensure `CORS_CREDENTIALS=true` if you need to send cookies or authentication headers

**Common CORS Errors:**
- `Access-Control-Allow-Origin` error: Check that your frontend origin is included in `CORS_ORIGIN`
- `Access-Control-Allow-Credentials` error: Ensure `CORS_CREDENTIALS=true` in your `.env` file
- Preflight requests failing: Verify that OPTIONS method is allowed (configured by default)

**Testing CORS:**
- Check browser console for CORS error messages
- Verify CORS headers in the response using browser DevTools Network tab
- Test with curl to verify CORS headers are present:
  ```bash
  curl -H "Origin: https://yourdomain.com" \
       -H "Access-Control-Request-Method: POST" \
       -H "Access-Control-Request-Headers: Content-Type" \
       -X OPTIONS \
       http://localhost:3000/api/health
  ```

## Getting Help

- Check the documentation in `/docs`
- Review example files in `/src/controllers`, `/src/services`, `/src/models`
- Ensure you're following the standards in `docs/standards.md`

