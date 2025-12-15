/**
 * @fileoverview Supabase Client Utility
 * 
 * Provides a singleton instance of the Supabase client.
 * Handles initialization, connection validation, and error management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';

// Singleton instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Gets the singleton Supabase client instance.
 * Initializes the client if it doesn't exist.
 * 
 * @returns {SupabaseClient} The configured Supabase client instance
 * @throws {Error} If initialization fails due to missing configuration
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false, // Server-side environment
          autoRefreshToken: false,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }
  return supabaseClient;
}

/**
 * Validates the connection to Supabase.
 * Performs a lightweight health check query.
 * 
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export async function validateSupabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // We try to query a 'health_check' table. 
    // Even if the table doesn't exist (PGRST204), getting that error means we successfully connected to Supabase.
    // Network errors will cause the promise to fail or return a specific connection error.
    const { error } = await client.from('health_check').select('*').limit(1);
    
    // If error is network related, return false.
    // If error is "relation does not exist", we are connected!
    // If no error, we are connected.
    
    if (error) {
      // PGRST204 is "relation does not exist" - means we connected to DB but table missing
      // This counts as "Connected" to the service
      if (error.code === 'PGRST204') {
        return true;
      }
      
      // Connection refused or timeout
      if (error.message.includes('fetch failed') || error.message.includes('connection refused')) {
        console.error('Supabase connection failed:', error.message);
        return false;
      }
      
      // Other errors imply we reached the server
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase validation error:', error);
    return false;
  }
}
