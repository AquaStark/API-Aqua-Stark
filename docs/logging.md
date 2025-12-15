# Logging Standards

This document describes the logging standards and utility wrapper for the Aqua Stark API.

## Overview

The project uses a centralized logging utility located at `src/core/utils/logger.ts`. This utility wraps the Fastify logger when available and falls back to console logging when it's not (e.g., during initialization or in scripts).

The goal is to provide a consistent logging interface across the entire application, with structured output and appropriate log levels.

## Usage

### Importing the Logger

```typescript
import { logInfo, logError, logWarn, logDebug } from '../core/utils/logger';
```

### Logging Levels

The logger supports four levels:

1. **INFO (`logInfo`)**
   - Use for general application flow events.
   - Example: Server startup, connection success, job completion.
   ```typescript
   logInfo('Server started on port 3000');
   logInfo('User created', { userId: '123' });
   ```

2. **ERROR (`logError`)**
   - Use for errors that affect the operation.
   - Example: Database connection failure, unhandled exceptions.
   ```typescript
   logError('Failed to connect to database', error);
   ```

3. **WARN (`logWarn`)**
   - Use for potentially harmful situations or deprecated usage.
   - Example: Retrying a connection, using fallback values.
   ```typescript
   logWarn('Cache miss, fetching from database');
   ```

4. **DEBUG (`logDebug`)**
   - Use for detailed information for debugging purposes.
   - **Note:** Debug logs are suppressed in production (`NODE_ENV=production`).
   - Example: Payload details, detailed step-by-step logic.
   ```typescript
   logDebug('Processing payload', payload);
   ```

## Initialization

The logger is initialized in `src/app.ts` immediately after the Fastify app is created. This ensures that it uses the Fastify logger instance (Pino) for optimal performance and JSON formatting.

```typescript
// src/app.ts
import { initializeLogger } from './core/utils/logger';

const app = Fastify({ ... });
initializeLogger(app);
```

## Behavior

- **With Fastify:** Uses `app.log.info`, `app.log.error`, etc. Logs are structured JSON.
- **Without Fastify (Fallback):** Uses `console.log` and `console.error` with a timestamped format: `[ISO_TIMESTAMP] [LEVEL] Message`.

## Best Practices

- **Avoid `console.log`:** Always use the logger utility instead of direct console calls.
- **Structured Data:** Pass objects as the second argument to provide structured context.
- **Sensitive Data:** Do NOT log passwords, keys, or sensitive user information.
- **Error Objects:** Pass the full error object to `logError` to preserve stack traces.
