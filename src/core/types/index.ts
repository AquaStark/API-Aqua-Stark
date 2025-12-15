/**
 * @fileoverview Core Types - Central export for all shared types
 * 
 * This file re-exports all core types to provide a single import point.
 * All types follow strict conventions and should not be modified without
 * careful consideration of their impact on the entire system.
 */

export type {
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
} from './api-response';

export type { ControllerResponse } from './controller-response';

export type {
  DojoTransactionResult,
  FishFamilyMember,
  FishFamilyTree,
  PlayerOnChain,
  TankOnChain,
  FishOnChain,
  DecorationOnChain,
} from './dojo-types';

export { DecorationKind } from './dojo-types';
