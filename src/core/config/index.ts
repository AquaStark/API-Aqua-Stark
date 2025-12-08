/**
 * @fileoverview Configuration - Environment variables and constants
 * 
 * Centralized configuration management with validation.
 * All environment variables should be accessed through this module.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validates that a required environment variable exists.
 * Throws an error if the variable is missing.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value.
 */
function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

// Supabase Configuration
export const SUPABASE_URL = requireEnv('SUPABASE_URL');
export const SUPABASE_KEY = requireEnv('SUPABASE_KEY');

// Starknet Configuration
export const STARKNET_RPC = requireEnv('STARKNET_RPC');
export const STARKNET_CHAIN_ID = getEnv('STARKNET_CHAIN_ID', 'SN_MAIN');

// Cartridge Authentication
export const CARTRIDGE_AUTH_URL = requireEnv('CARTRIDGE_AUTH_URL');

// Server Configuration
export const PORT = parseInt(getEnv('PORT', '3000'), 10);
export const NODE_ENV = getEnv('NODE_ENV', 'development');

// Dojo Configuration (optional)
export const DOJO_ACCOUNT_ADDRESS = process.env.DOJO_ACCOUNT_ADDRESS;
export const DOJO_PRIVATE_KEY = process.env.DOJO_PRIVATE_KEY;

// Game Constants
export const MAX_TANK_CAPACITY = 50;
export const XP_MULTIPLIER = 1.0;

