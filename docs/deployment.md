# Deployment Guide

This guide covers the complete deployment process for the Aqua Stark Backend API across different environments (development, staging, and production).

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Dojo/Starknet Configuration](#dojostarknet-configuration)
- [Database Migrations](#database-migrations)
- [Deployment by Environment](#deployment-by-environment)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

## Introduction

This deployment guide provides step-by-step instructions for setting up and deploying the Aqua Stark Backend API. It covers:

- Environment configuration for different deployment scenarios
- External service setup (Supabase, Starknet, Dojo)
- Database migration processes
- Environment-specific deployment strategies
- Common issues and solutions

For initial setup and development, see [Getting Started](./getting-started.md).

## Prerequisites

Before deploying, ensure you have:

- **Node.js** `>=20.10.0` (exact version required)
- **npm** or **yarn** package manager
- **Supabase CLI** (for database migrations)
- Access to:
  - Supabase project (or ability to create one)
  - Starknet RPC endpoint
  - Cartridge authentication URL
  - Dojo account (optional, for on-chain operations)

## Environment Variables

All configuration is managed through environment variables. Below is a complete reference of all available variables.

### Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ Yes | - | Your Supabase project URL |
| `SUPABASE_KEY` | ✅ Yes | - | Supabase anonymous key (anon key) |
| `SUPABASE_DB_URL` | ❌ No | - | Database connection URL (for migrations) |
| `SUPABASE_ANON_KEY` | ❌ No | - | Alternative anon key (if different from SUPABASE_KEY) |
| `SUPABASE_DB_PASSWORD` | ❌ No | - | Database password (for migrations) |
| `STARKNET_RPC` | ✅ Yes | - | Starknet RPC endpoint URL |
| `STARKNET_CHAIN_ID` | ❌ No | `SN_MAIN` | Starknet chain ID (SN_MAIN, SN_SEPOLIA, etc.) |
| `CARTRIDGE_AUTH_URL` | ✅ Yes | - | Cartridge authentication service URL |
| `PORT` | ❌ No | `3000` | Server listening port |
| `NODE_ENV` | ❌ No | `development` | Environment mode (development, staging, production) |
| `CORS_ORIGIN` | ❌ No | - | Comma-separated list of allowed origins |
| `CORS_CREDENTIALS` | ❌ No | `true` | Enable CORS credentials |
| `DOJO_ACCOUNT_ADDRESS` | ❌ No | - | Dojo account address for on-chain operations |
| `DOJO_PRIVATE_KEY` | ❌ No | - | Dojo account private key |
| `SHUTDOWN_TIMEOUT` | ❌ No | `10000` | Graceful shutdown timeout in milliseconds |

### Environment Examples

#### Development

```env
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_DB_PASSWORD=your_supabase_password

# =============================================================================
# STARKNET CONFIGURATION
# =============================================================================
STARKNET_RPC=https://starknet-sepolia.public.blastapi.io
STARKNET_CHAIN_ID=SN_SEPOLIA

# =============================================================================
# CARTRIDGE AUTHENTICATION
# =============================================================================
CARTRIDGE_AUTH_URL=https://cartridge.gg/auth

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=3000
NODE_ENV=development

# =============================================================================
# DOJO CONFIGURATION (Optional)
# =============================================================================
DOJO_ACCOUNT_ADDRESS=0x...
DOJO_PRIVATE_KEY=0x...

# =============================================================================
# CORS Configuration
# =============================================================================
CORS_ORIGIN=
CORS_CREDENTIALS=true

# =============================================================================
# Shutdown Configuration
# =============================================================================
SHUTDOWN_TIMEOUT=15000
```

#### Staging

```env
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_KEY=your_staging_anon_key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.your-staging-project.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your_staging_password

# =============================================================================
# STARKNET CONFIGURATION
# =============================================================================
STARKNET_RPC=https://starknet-sepolia.public.blastapi.io
STARKNET_CHAIN_ID=SN_SEPOLIA

# =============================================================================
# CARTRIDGE AUTHENTICATION
# =============================================================================
CARTRIDGE_AUTH_URL=https://cartridge.gg/auth

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=4000
NODE_ENV=staging

# =============================================================================
# DOJO CONFIGURATION
# =============================================================================
DOJO_ACCOUNT_ADDRESS=0x...
DOJO_PRIVATE_KEY=0x...

# =============================================================================
# CORS Configuration
# =============================================================================
CORS_ORIGIN=https://staging.yourdomain.com
CORS_CREDENTIALS=true

# =============================================================================
# Shutdown Configuration
# =============================================================================
SHUTDOWN_TIMEOUT=10000
```

#### Production

```env
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_KEY=your_production_anon_key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.your-production-project.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your_production_password

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
NODE_ENV=production

# =============================================================================
# DOJO CONFIGURATION
# =============================================================================
DOJO_ACCOUNT_ADDRESS=0x...
DOJO_PRIVATE_KEY=0x...

# =============================================================================
# CORS Configuration
# =============================================================================
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
CORS_CREDENTIALS=true

# =============================================================================
# Shutdown Configuration
# =============================================================================
SHUTDOWN_TIMEOUT=10000
```

### Variable Validation

The application validates required environment variables on startup. If a required variable is missing, the server will fail to start with a clear error message:

```
Error: Missing required environment variable: SUPABASE_URL
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save this for `SUPABASE_DB_PASSWORD`)
   - **Region**: Select closest region
   - **Pricing Plan**: Choose appropriate plan

### 2. Get Project Credentials

After project creation, navigate to **Settings > API**:

- **Project URL**: Use for `SUPABASE_URL`
  - Example: `https://abcdefghijklmnop.supabase.co`
- **anon/public key**: Use for `SUPABASE_KEY`
  - This is the public anonymous key
- **service_role key**: Keep secret (not used in this API)

### 3. Configure Storage Buckets

Storage buckets are automatically created via migrations. See [Supabase Storage Setup](./supabase-storage-setup.md) for details.

The following buckets are created:
- `fish` - Fish sprites
- `tanks` - Tank sprites
- `decorations` - Decoration sprites
- `avatars` - Player avatars

### 4. Row Level Security (RLS)

RLS policies are automatically enabled via migrations. All tables have appropriate policies:
- `players` - Public read, authenticated write
- `fish` - Public read, authenticated write
- `tanks` - Public read, authenticated write
- `decorations` - Public read, authenticated write
- `sync_queue` - Authenticated read/write

### 5. Database Connection URL

For migrations, you'll need the database connection URL:

1. Go to **Settings > Database**
2. Find "Connection string" section
3. Select "URI" format
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. Use this for `SUPABASE_DB_URL`

Example format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
```

For detailed Supabase setup instructions, see [Supabase Setup Guide](./supabase-setup.md).

## Dojo/Starknet Configuration

### RPC Endpoints

Choose the appropriate RPC endpoint based on your environment:

#### Mainnet (Production)
```env
STARKNET_RPC=https://starknet-mainnet.public.blastapi.io
STARKNET_CHAIN_ID=SN_MAIN
```

Alternative mainnet endpoints:
- `https://starknet-mainnet.public.blastapi.io`
- `https://starknet-mainnet.public.chainstack.com`
- `https://rpc.starknet.lava.build`

#### Sepolia Testnet (Development/Staging)
```env
STARKNET_RPC=https://starknet-sepolia.public.blastapi.io
STARKNET_CHAIN_ID=SN_SEPOLIA
```

Alternative testnet endpoints:
- `https://starknet-sepolia.public.blastapi.io`
- `https://starknet-sepolia.public.chainstack.com`

#### Local Devnet (Local Development)
```env
STARKNET_RPC=http://localhost:5050
STARKNET_CHAIN_ID=SN_GOERLI
```

### Dojo Account Setup

For on-chain operations, configure a Dojo account:

1. **Generate or Import Account**:
   - Use Starknet wallet (ArgentX, Braavos) or generate programmatically
   - Ensure account has sufficient funds for transactions

2. **Set Environment Variables**:
```env
DOJO_ACCOUNT_ADDRESS=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
DOJO_PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**Security Note**: 
- Never commit private keys to version control
- Use secrets management in production
- Rotate keys regularly
- Use different accounts for different environments

3. **Verify Configuration**:
   - If `DOJO_ACCOUNT_ADDRESS` and `DOJO_PRIVATE_KEY` are not set, the Dojo client runs in stub mode
   - Stub mode logs all calls but doesn't execute real transactions
   - See [Dojo Stubs Documentation](./dojo-stubs.md) for details

### Chain IDs Reference

| Chain | Chain ID | Use Case |
|-------|----------|----------|
| `SN_MAIN` | Mainnet | Production |
| `SN_SEPOLIA` | Sepolia Testnet | Development, Staging |
| `SN_GOERLI` | Goerli Testnet | Legacy, Local Devnet |

## Database Migrations

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

Or use npx (recommended):
```bash
npx supabase --version
```

2. Login to Supabase:
```bash
npx supabase login
```

This opens your browser for authentication.

### Migration Process

1. **Link Your Project**:
```bash
npx supabase link --project-ref your-project-ref
```

Replace `your-project-ref` with your Supabase project reference ID (found in project URL).

You'll be prompted for your database password.

2. **Apply Migrations**:
```bash
npx supabase db push
```

This command:
- Shows all pending migrations
- Asks for confirmation
- Executes migrations in chronological order
- Applies all SQL files from `supabase/migrations/`

### Migration Files

Migrations are located in `supabase/migrations/` and follow this naming convention:
- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20250108000000_create_players_table.sql`

Migrations are applied in alphabetical order (by filename timestamp).

### Verify Migrations

Check migration status:
```bash
npx supabase migration list
```

### Rollback

Supabase doesn't support automatic rollbacks. To rollback:
1. Create a new migration that reverses changes
2. Or manually modify the database via Supabase Dashboard

For detailed migration instructions, see [Supabase Setup Guide](./supabase-setup.md).

## Deployment by Environment

### Development

#### Local Setup

1. **Clone Repository**:
```bash
git clone <repository-url>
cd API-Aqua-Stark
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env with development values
```

4. **Run Migrations** (if needed):
```bash
npx supabase db push
```

5. **Start Development Server**:
```bash
npm run dev
```

The server starts with hot-reload on `http://localhost:3000` (or your configured PORT).

#### Development Features

- Hot-reload enabled (automatic restart on file changes)
- Debug logging enabled
- CORS allows all origins (if `CORS_ORIGIN` is empty)
- Detailed error messages
- TypeScript source maps for debugging

### Staging

#### Deployment Steps

1. **Build Application**:
```bash
npm run build
```

2. **Verify Build**:
```bash
npm run type-check
```

3. **Set Environment Variables**:
   - Use staging Supabase project
   - Use testnet RPC endpoints
   - Configure staging CORS origins

4. **Run Migrations**:
```bash
npx supabase db push
```

5. **Start Server**:
```bash
npm start
```

#### Staging Considerations

- Use separate Supabase project
- Use testnet for Starknet operations
- Configure CORS for staging domain
- Enable logging for debugging
- Use test accounts for Dojo operations
- Monitor error rates and performance

### Production

#### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Supabase storage buckets configured
- [ ] RLS policies enabled and tested
- [ ] CORS origins configured correctly
- [ ] Dojo account funded and tested
- [ ] Secrets stored securely (not in code)
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

#### Deployment Steps

1. **Build for Production**:
```bash
npm run build
```

2. **Verify Production Build**:
```bash
# Type check
npm run type-check

# Test production build locally
NODE_ENV=production npm start
```

3. **Set Production Environment Variables**:
   - Use production Supabase project
   - Use mainnet RPC endpoints
   - Configure production CORS origins
   - Set `NODE_ENV=production`

4. **Run Migrations**:
```bash
npx supabase db push
```

5. **Start Production Server**:
```bash
npm start
```

#### Production Optimizations

- **Process Manager**: Use PM2, systemd, or similar
- **Reverse Proxy**: Use Nginx or similar for SSL termination
- **Load Balancing**: For high traffic, use multiple instances
- **Monitoring**: Set up application monitoring (e.g., Sentry, DataDog)
- **Logging**: Centralized logging (e.g., ELK stack, CloudWatch)
- **Health Checks**: Configure health check endpoints

#### Example PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'aqua-stark-api',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Troubleshooting

### Connection Issues

#### Supabase Connection Failed

**Error**: `Missing required environment variable: SUPABASE_URL`

**Solution**:
1. Verify `.env` file exists in project root
2. Check `SUPABASE_URL` is set correctly
3. Ensure URL format: `https://your-project.supabase.co`
4. Restart server after changing `.env`

**Error**: `Invalid API key`

**Solution**:
1. Verify `SUPABASE_KEY` matches your project's anon key
2. Check key in Supabase Dashboard > Settings > API
3. Ensure no extra spaces or quotes in `.env` file

#### Starknet RPC Connection Failed

**Error**: `Failed to connect to Starknet RPC`

**Solution**:
1. Verify `STARKNET_RPC` endpoint is accessible
2. Test endpoint with curl:
   ```bash
   curl -X POST https://starknet-mainnet.public.blastapi.io \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"starknet_blockNumber","params":[],"id":1}'
   ```
3. Try alternative RPC endpoint
4. Check network connectivity

### Environment Variable Issues

#### Variables Not Loading

**Symptoms**: Server starts but uses default values

**Solution**:
1. Ensure `.env` file is in project root (same level as `package.json`)
2. Check variable names match exactly (case-sensitive)
3. No spaces around `=` sign: `KEY=value` not `KEY = value`
4. Restart server after changes
5. Verify `dotenv` is installed: `npm list dotenv`

#### Type Errors with Environment Variables

**Error**: `PORT must be a number`

**Solution**:
- Ensure `PORT` is a valid integer: `PORT=3000` not `PORT="3000"` or `PORT=abc`

### Migration Issues

#### "Cannot find project ref"

**Solution**:
```bash
# Unlink and re-link
npx supabase unlink
npx supabase link --project-ref your-project-ref
```

#### "relation does not exist"

**Solution**:
1. Check migration file timestamps are in correct order
2. Verify all dependent tables are created in earlier migrations
3. Review migration SQL for syntax errors

#### "Authentication failed"

**Solution**:
1. Verify database password is correct
2. Reset password in Supabase Dashboard > Settings > Database
3. Update `SUPABASE_DB_PASSWORD` in `.env`

### CORS Issues

**Error**: `Access-Control-Allow-Origin` header missing

**Solution**:
1. **Development**: Leave `CORS_ORIGIN` empty to allow all origins
2. **Production**: Set `CORS_ORIGIN` to your frontend domain:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```
3. For multiple origins, use comma-separated list:
   ```env
   CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
   ```
4. Ensure `CORS_CREDENTIALS=true` if sending cookies/auth headers

See [Getting Started - CORS Issues](./getting-started.md#cors-issues) for detailed troubleshooting.

### Dojo/Starknet Issues

#### "Dojo client running in stub mode"

**Solution**:
- This is expected if `DOJO_ACCOUNT_ADDRESS` and `DOJO_PRIVATE_KEY` are not set
- Set both variables to enable real on-chain operations
- See [Dojo Stubs Documentation](./dojo-stubs.md) for details

#### Transaction Failures

**Error**: `OnChainError: Failed to execute transaction`

**Solution**:
1. Verify Dojo account has sufficient funds
2. Check account address and private key are correct
3. Verify RPC endpoint is accessible
4. Check chain ID matches network (mainnet vs testnet)
5. Review transaction in Starknet explorer

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=4000 npm run dev
```

### Build Errors

#### TypeScript Compilation Errors

**Solution**:
```bash
# Check for type errors
npm run type-check

# Verify all dependencies installed
npm install

# Clear build cache
rm -rf dist
npm run build
```

## Production Considerations

### Security

#### Secrets Management

**Never commit secrets to version control:**

1. **Use Environment Variables**: Store all secrets in environment variables
2. **Use Secrets Managers**: 
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Environment-specific `.env` files (not committed)

3. **Rotate Keys Regularly**:
   - Supabase keys
   - Dojo private keys
   - Database passwords

#### API Key Security

- Use Supabase **anon key** (not service role key) in API
- Service role key should only be used server-side for admin operations
- Implement rate limiting for public endpoints
- Use authentication middleware for protected endpoints

#### CORS Configuration

- **Never use wildcard** (`*`) in production
- Specify exact origins in `CORS_ORIGIN`
- Use HTTPS for all production origins
- Regularly review and update allowed origins

### Performance

#### Database Optimization

- Use connection pooling (Supabase handles this automatically)
- Index frequently queried columns
- Monitor query performance via Supabase Dashboard
- Use read replicas for high-read workloads

#### Caching Strategy

- Cache frequently accessed data (player data, fish metadata)
- Implement cache invalidation on updates
- Use Redis or similar for distributed caching

#### Server Optimization

- Use Node.js cluster mode for multi-core utilization
- Implement request rate limiting
- Monitor memory usage and implement garbage collection tuning
- Use compression middleware for responses

### Monitoring and Logging

#### Application Monitoring

Set up monitoring for:
- Server uptime and health
- Response times and latency
- Error rates and types
- Request volume and patterns

Recommended tools:
- **Sentry**: Error tracking
- **DataDog**: Application performance monitoring
- **New Relic**: Full-stack observability
- **Grafana + Prometheus**: Self-hosted monitoring

#### Logging

- Use structured logging (JSON format)
- Log levels: `error`, `warn`, `info`, `debug`
- Include request IDs for tracing
- Rotate logs to prevent disk space issues
- Send critical logs to centralized system

#### Health Checks

The API includes a health check endpoint:
```
GET /api/health
```

Configure your load balancer or monitoring system to check this endpoint regularly.

### Backup and Recovery

#### Database Backups

Supabase provides automatic backups:
- Daily backups retained for 7 days
- Point-in-time recovery available
- Manual backup via Supabase Dashboard

#### Application State

- Store critical state in database (not memory)
- Implement graceful shutdown to prevent data loss
- Use transaction logs for recovery
- Test recovery procedures regularly

#### Disaster Recovery Plan

1. **Document Recovery Procedures**: Step-by-step recovery guide
2. **Regular Backups**: Automated daily backups
3. **Test Restores**: Periodically test backup restoration
4. **Multi-Region**: Consider multi-region deployment for high availability
5. **Incident Response**: Define roles and procedures for incidents

### Scaling

#### Horizontal Scaling

- Run multiple server instances behind load balancer
- Use stateless application design (all state in database)
- Implement session stickiness if needed (via load balancer)

#### Vertical Scaling

- Increase server resources (CPU, memory)
- Optimize database queries
- Use database read replicas

#### Database Scaling

- Supabase handles automatic scaling
- Monitor connection pool usage
- Consider read replicas for high-read workloads
- Implement database query optimization

### SSL/TLS

- Always use HTTPS in production
- Configure SSL certificates (Let's Encrypt, Cloudflare, etc.)
- Use reverse proxy (Nginx, Caddy) for SSL termination
- Enable HSTS headers
- Regularly update SSL certificates

### Updates and Maintenance

#### Deployment Strategy

1. **Blue-Green Deployment**: Run two environments, switch traffic
2. **Rolling Updates**: Update instances gradually
3. **Canary Releases**: Deploy to subset of traffic first

#### Maintenance Windows

- Schedule maintenance during low-traffic periods
- Notify users in advance
- Have rollback plan ready
- Test updates in staging first

#### Version Management

- Use semantic versioning
- Tag releases in Git
- Document breaking changes
- Maintain changelog

## Additional Resources

- [Getting Started Guide](./getting-started.md) - Initial setup and development
- [Supabase Setup Guide](./supabase-setup.md) - Detailed Supabase configuration
- [Supabase Storage Setup](./supabase-storage-setup.md) - Storage bucket configuration
- [Dojo Stubs Documentation](./dojo-stubs.md) - Dojo client configuration
- [Architecture Documentation](./architecture.md) - System architecture overview
- [Error Handling Guide](./error-handling.md) - Error management system

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review other documentation in `/docs`
3. Check application logs for detailed error messages
4. Verify all environment variables are set correctly
5. Test with minimal configuration to isolate issues

