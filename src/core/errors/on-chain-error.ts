/**
 * @fileoverview On-Chain Error
 * 
 * Error thrown when an on-chain operation fails.
 * Use this for failed Starknet transactions, Dojo operations, etc.
 */

import { BaseError } from './base-error';

export class OnChainError extends BaseError {
  constructor(message: string, public readonly txHash?: string) {
    super(message, 500, 'OnChainError');
  }
}

