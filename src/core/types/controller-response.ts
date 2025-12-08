/**
 * @fileoverview Controller Response Types - BLOCKED STANDARD
 * 
 * ⚠️ WARNING: All controllers MUST return ControllerResponse<T> or Promise<ControllerResponse<T>>.
 * This enforces the use of standardized response functions and prevents custom response formats.
 * 
 * TypeScript will enforce this at compile time, making it impossible to return
 * responses that don't follow the standard format.
 */

import type { ApiResponse } from './api-response';

/**
 * Type that ALL controllers MUST use as their return type.
 * This ensures that only standardized responses can be returned.
 * 
 * Controllers should use createSuccessResponse() or createErrorResponse()
 * from '../responses' to create responses of this type.
 * 
 * @template T - The type of data in success responses
 * 
 * @example
 * ```ts
 * async function getPlayer(address: string): Promise<ControllerResponse<Player>> {
 *   try {
 *     const player = await playerService.getByAddress(address);
 *     return createSuccessResponse(player, 'Player retrieved successfully');
 *   } catch (error) {
 *     return createErrorResponse(error);
 *   }
 * }
 * ```
 */
export type ControllerResponse<T> = ApiResponse<T>;

