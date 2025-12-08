/**
 * @fileoverview Validation Error
 * 
 * Error thrown when input validation fails.
 * Use this for invalid request parameters, missing required fields, etc.
 */

import { BaseError } from './base-error';

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400, 'ValidationError');
  }
}

