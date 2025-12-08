/**
 * @fileoverview Response Helpers - BLOCKED STANDARD
 * 
 * ⚠️ WARNING: These are the ONLY functions that should be used to create API responses.
 * DO NOT create responses manually. Always use these functions.
 * 
 * This ensures all responses follow the standardized format and prevents
 * inconsistencies that could break clients or cause maintenance issues.
 */

import type { SuccessResponse, ErrorResponse, ApiResponse } from '../types/api-response';
import { BaseError } from '../errors';

/**
 * Creates a standardized success response.
 * 
 * ALL successful responses MUST use this function.
 * 
 * @template T - The type of data being returned
 * @param data - The data to return in the response
 * @param message - Optional success message (default: "Operation successful")
 * @returns A SuccessResponse<T> that conforms to the API standard
 * 
 * @example
 * ```ts
 * const player = await getPlayer(address);
 * return createSuccessResponse(player, 'Player retrieved successfully');
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = 'Operation successful'
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Creates a standardized error response.
 * 
 * ALL error responses MUST use this function.
 * Automatically handles custom error classes and generic errors.
 * 
 * @param error - An Error instance or any error value
 * @returns An ErrorResponse that conforms to the API standard
 * 
 * @example
 * ```ts
 * try {
 *   await performOperation();
 * } catch (error) {
 *   return createErrorResponse(error);
 * }
 * ```
 */
export function createErrorResponse(error: unknown): ErrorResponse {
  // Handle custom error classes
  if (error instanceof BaseError) {
    return {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        code: error.code,
      },
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        type: 'InternalError',
        message: error.message,
        code: 500,
      },
    };
  }

  // Handle unknown error types
  return {
    success: false,
    error: {
      type: 'UnknownError',
      message: 'An unexpected error occurred',
      code: 500,
    },
  };
}

/**
 * Type guard to check if a response is a success response.
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response.
 */
export function isErrorResponse(
  response: ApiResponse<unknown>
): response is ErrorResponse {
  return response.success === false;
}

