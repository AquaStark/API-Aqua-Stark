/**
 * @fileoverview Tests for XP calculation utilities and fish evolution logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateFishXp,
  calculatePlayerXp,
  determineFishState,
  getActiveDecorationsMultiplier,
  BABY_MAX_XP,
  JUVENILE_MAX_XP,
  YOUNG_ADULT_MAX_XP,
  DECORATION_XP_MULTIPLIERS,
} from './xp-calculator';
import { FishState } from '@/models/fish.model';
import { DecorationKind } from '@/models/decoration.model';
import { ValidationError, NotFoundError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';

// Mock Supabase client
vi.mock('@/core/utils/supabase-client', () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock logger
vi.mock('@/core/utils/logger', () => ({
  logError: vi.fn(),
}));

describe('XP Calculator Utilities', () => {
  describe('calculateFishXp', () => {
    it('should calculate XP with positive multiplier', () => {
      const baseXp = 100;
      const multiplier = 10; // +10%
      const result = calculateFishXp(baseXp, multiplier);
      expect(result).toBeCloseTo(110, 5); // 100 * 1.10
    });

    it('should calculate XP with zero multiplier', () => {
      const baseXp = 100;
      const multiplier = 0;
      const result = calculateFishXp(baseXp, multiplier);
      expect(result).toBe(100); // 100 * 1.00
    });

    it('should calculate XP with negative multiplier', () => {
      const baseXp = 100;
      const multiplier = -5; // -5%
      const result = calculateFishXp(baseXp, multiplier);
      expect(result).toBe(95); // 100 * 0.95
    });

    it('should handle decimal base XP', () => {
      const baseXp = 50.5;
      const multiplier = 20; // +20%
      const result = calculateFishXp(baseXp, multiplier);
      expect(result).toBeCloseTo(60.6, 5); // 50.5 * 1.20
    });

    it('should handle large multipliers', () => {
      const baseXp = 100;
      const multiplier = 100; // +100%
      const result = calculateFishXp(baseXp, multiplier);
      expect(result).toBe(200); // 100 * 2.00
    });

    it('should handle zero base XP', () => {
      const baseXp = 0;
      const multiplier = 50;
      const result = calculateFishXp(baseXp, multiplier);
      expect(result).toBe(0);
    });
  });

  describe('calculatePlayerXp', () => {
    it('should sum XP from multiple fish', () => {
      const fishXpArray = [100, 50, 75, 25];
      const result = calculatePlayerXp(fishXpArray);
      expect(result).toBe(250);
    });

    it('should return zero for empty array', () => {
      const fishXpArray: number[] = [];
      const result = calculatePlayerXp(fishXpArray);
      expect(result).toBe(0);
    });

    it('should handle single fish', () => {
      const fishXpArray = [100];
      const result = calculatePlayerXp(fishXpArray);
      expect(result).toBe(100);
    });

    it('should handle decimal XP values', () => {
      const fishXpArray = [10.5, 20.3, 5.2];
      const result = calculatePlayerXp(fishXpArray);
      expect(result).toBeCloseTo(36.0, 1);
    });

    it('should handle large arrays', () => {
      const fishXpArray = Array(100).fill(10);
      const result = calculatePlayerXp(fishXpArray);
      expect(result).toBe(1000);
    });
  });

  describe('determineFishState', () => {
    it('should return Baby for XP below threshold', () => {
      expect(determineFishState(0)).toBe(FishState.Baby);
      expect(determineFishState(25)).toBe(FishState.Baby);
      expect(determineFishState(BABY_MAX_XP - 1)).toBe(FishState.Baby);
    });

    it('should return Juvenile for XP at lower bound', () => {
      expect(determineFishState(BABY_MAX_XP)).toBe(FishState.Juvenile);
      expect(determineFishState(75)).toBe(FishState.Juvenile);
      expect(determineFishState(JUVENILE_MAX_XP - 1)).toBe(FishState.Juvenile);
    });

    it('should return YoungAdult for XP at lower bound', () => {
      expect(determineFishState(JUVENILE_MAX_XP)).toBe(FishState.YoungAdult);
      expect(determineFishState(200)).toBe(FishState.YoungAdult);
      expect(determineFishState(YOUNG_ADULT_MAX_XP - 1)).toBe(
        FishState.YoungAdult,
      );
    });

    it('should return Adult for XP at threshold and above', () => {
      expect(determineFishState(YOUNG_ADULT_MAX_XP)).toBe(FishState.Adult);
      expect(determineFishState(500)).toBe(FishState.Adult);
      expect(determineFishState(1000)).toBe(FishState.Adult);
    });

    it('should handle negative XP by normalizing to zero', () => {
      expect(determineFishState(-10)).toBe(FishState.Baby);
      expect(determineFishState(-100)).toBe(FishState.Baby);
    });

    it('should handle exact threshold boundaries correctly', () => {
      expect(determineFishState(BABY_MAX_XP - 0.1)).toBe(FishState.Baby);
      expect(determineFishState(BABY_MAX_XP)).toBe(FishState.Juvenile);
      expect(determineFishState(JUVENILE_MAX_XP - 0.1)).toBe(
        FishState.Juvenile,
      );
      expect(determineFishState(JUVENILE_MAX_XP)).toBe(FishState.YoungAdult);
      expect(determineFishState(YOUNG_ADULT_MAX_XP - 0.1)).toBe(
        FishState.YoungAdult,
      );
      expect(determineFishState(YOUNG_ADULT_MAX_XP)).toBe(FishState.Adult);
    });
  });

  describe('getActiveDecorationsMultiplier', () => {
    let mockSupabase: any;
    let mockTankQuery: any;
    let mockDecorationsSelect: any;
    let mockDecorationsQuery: any;

    beforeEach(() => {
      // Mock decorations query chain - needs to support chained .eq().eq()
      mockDecorationsQuery = {
        eq: vi.fn().mockImplementation(() => mockDecorationsQuery),
      };

      mockDecorationsSelect = {
        eq: vi.fn().mockReturnValue(mockDecorationsQuery),
      };

      // Mock tank query chain
      mockTankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      // Mock main Supabase client
      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'tanks') {
            return mockTankQuery;
          }
          if (table === 'decorations') {
            return {
              select: vi.fn().mockReturnValue(mockDecorationsSelect),
            };
          }
          return mockTankQuery;
        }),
      };

      vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    });

    it('should throw ValidationError for invalid tank ID (zero)', async () => {
      await expect(getActiveDecorationsMultiplier(0)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for invalid tank ID (negative)', async () => {
      await expect(getActiveDecorationsMultiplier(-1)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for invalid tank ID (non-integer)', async () => {
      await expect(getActiveDecorationsMultiplier(1.5)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw NotFoundError when tank does not exist', async () => {
      mockTankQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(getActiveDecorationsMultiplier(1)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should return 0 when no active decorations exist', async () => {
      const owner = '0x1234567890abcdef';
      mockTankQuery.single.mockResolvedValue({
        data: { owner },
        error: null,
      });

      // Mock chained .eq().eq() calls
      mockDecorationsSelect.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const result = await getActiveDecorationsMultiplier(1);
      expect(result).toBe(0);
    });

    it('should calculate multiplier from single active decoration', async () => {
      const owner = '0x1234567890abcdef';
      mockTankQuery.single.mockResolvedValue({
        data: { owner },
        error: null,
      });

      mockDecorationsSelect.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              kind: DecorationKind.Plant,
              is_active: true,
              owner,
            },
          ],
          error: null,
        }),
      });

      const result = await getActiveDecorationsMultiplier(1);
      const expectedMultiplier =
        DECORATION_XP_MULTIPLIERS[DecorationKind.Plant] / 100;
      expect(result).toBe(expectedMultiplier); // 5 / 100 = 0.05
    });

    it('should sum multipliers from multiple active decorations', async () => {
      const owner = '0x1234567890abcdef';
      mockTankQuery.single.mockResolvedValue({
        data: { owner },
        error: null,
      });

      mockDecorationsSelect.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              kind: DecorationKind.Plant,
              is_active: true,
              owner,
            },
            {
              kind: DecorationKind.Statue,
              is_active: true,
              owner,
            },
            {
              kind: DecorationKind.Ornament,
              is_active: true,
              owner,
            },
          ],
          error: null,
        }),
      });

      const result = await getActiveDecorationsMultiplier(1);
      const expectedTotal =
        DECORATION_XP_MULTIPLIERS[DecorationKind.Plant] +
        DECORATION_XP_MULTIPLIERS[DecorationKind.Statue] +
        DECORATION_XP_MULTIPLIERS[DecorationKind.Ornament];
      expect(result).toBe(expectedTotal / 100); // (5 + 10 + 3) / 100 = 0.18
    });

    it('should ignore inactive decorations', async () => {
      const owner = '0x1234567890abcdef';
      mockTankQuery.single.mockResolvedValue({
        data: { owner },
        error: null,
      });

      mockDecorationsSelect.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              kind: DecorationKind.Plant,
              is_active: true,
              owner,
            },
            {
              kind: DecorationKind.Statue,
              is_active: false, // Inactive
              owner,
            },
          ],
          error: null,
        }),
      });

      const result = await getActiveDecorationsMultiplier(1);
      // Only Plant should count (5%), Statue is inactive
      expect(result).toBe(DECORATION_XP_MULTIPLIERS[DecorationKind.Plant] / 100);
    });

    it('should handle unknown decoration kinds gracefully', async () => {
      const owner = '0x1234567890abcdef';
      mockTankQuery.single.mockResolvedValue({
        data: { owner },
        error: null,
      });

      mockDecorationsSelect.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              kind: 'UnknownKind' as DecorationKind,
              is_active: true,
              owner,
            },
            {
              kind: DecorationKind.Plant,
              is_active: true,
              owner,
            },
          ],
          error: null,
        }),
      });

      const result = await getActiveDecorationsMultiplier(1);
      // UnknownKind should default to 0, only Plant counts
      expect(result).toBe(DECORATION_XP_MULTIPLIERS[DecorationKind.Plant] / 100);
    });

    it('should handle database errors when reading tank', async () => {
      mockTankQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database connection failed' },
      });

      await expect(getActiveDecorationsMultiplier(1)).rejects.toThrow(
        'Database error when reading tank',
      );
    });

    it('should handle database errors when reading decorations', async () => {
      const owner = '0x1234567890abcdef';
      mockTankQuery.single.mockResolvedValue({
        data: { owner },
        error: null,
      });

      mockDecorationsSelect.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' },
        }),
      });

      await expect(getActiveDecorationsMultiplier(1)).rejects.toThrow(
        'Database error when reading decorations',
      );
    });
  });
});

