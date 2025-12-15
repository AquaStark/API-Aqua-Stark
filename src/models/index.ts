/**
 * @fileoverview Models - Central export for all domain models
 */

export type {
  Player,
  CreatePlayerDto,
  UpdatePlayerDto,
} from './player.model';

export type {
  Fish,
  CreateFishDto,
  UpdateFishDto,
} from './fish.model';

export type {
  Tank,
  CreateTankDto,
  UpdateTankDto,
} from './tank.model';

export type {
  Decoration,
  CreateDecorationDto,
  UpdateDecorationDto,
  ToggleDecorationDto,
} from './decoration.model';
export { DecorationKind } from './decoration.model';
