/**
 * @fileoverview Supabase Client
 * 
 * Centralized Supabase client initialization.
 * All database operations should use this client instance.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';

/**
 * Supabase client instance for database operations.
 * 
 * @example
 * ```ts
 * import { supabase } from '../core/utils/supabase';
 * 
 * const { data, error } = await supabase
 *   .from('players')
 *   .select('*')
 *   .eq('address', address)
 *   .single();
 * ```
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

