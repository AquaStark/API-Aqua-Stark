/**
 * @fileoverview Error Handler Middleware
 * 
 * Global error handler for Fastify that captures all errors and transforms
 * them to the standardized error response format.
 * 
 * This middleware ensures that NO error escapes without being properly formatted.
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { createErrorResponse } from '../responses';
import { BaseError } from '../errors';

/**
 * Global error handler middleware.
 * 
 * This function is registered with Fastify to catch all errors
 * and transform them to the standard error response format.
 * 
 * @param error - The error that was thrown
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Handle custom error classes
  if (error instanceof BaseError) {
    const errorResponse = createErrorResponse(error);
    await reply.status(error.code).send(errorResponse);
    return;
  }

  // Handle Fastify validation errors
  if ('validation' in error && error.validation) {
    const validationError = createErrorResponse(
      new Error(`Validation failed: ${error.message}`)
    );
    validationError.error.type = 'ValidationError';
    validationError.error.code = 400;
    await reply.status(400).send(validationError);
    return;
  }

  // Handle HTTP status errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const errorResponse = createErrorResponse(error);
    errorResponse.error.code = error.statusCode;
    await reply.status(error.statusCode).send(errorResponse);
    return;
  }

  // Handle generic errors
  const errorResponse = createErrorResponse(error);
  await reply.status(500).send(errorResponse);
}

