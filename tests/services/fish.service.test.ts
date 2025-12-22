/**
 * @fileoverview Tests for Fish Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('@/core/utils/supabase-client', () => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/core/utils/dojo-client', () => ({
  feedFishBatch: vi.fn(),
  getFishOnChain: vi.fn(),
  gainFishXp: vi.fn(),
  gainPlayerXp: vi.fn(),
}));

vi.mock('@/core/utils/xp-calculator', () => ({
  getActiveDecorationsMultiplier: vi.fn(),
  getFeedBaseXp: vi.fn(),
  calculateFishXp: vi.fn(),
}));

vi.mock('@/core/utils/logger', () => ({
  logError: vi.fn(),
}));

// Now import after mocks
import { FishService } from '@/services/fish.service';
import { ValidationError, OnChainError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { gainFishXp, gainPlayerXp } from '@/core/utils/dojo-client';
import { getActiveDecorationsMultiplier, getFeedBaseXp, calculateFishXp } from '@/core/utils/xp-calculator';

describe('FishService', () => {
  let service: FishService;
  let mockSupabase: any;

  beforeEach(() => {
    service = new FishService();
    vi.clearAllMocks();

    // Setup default Supabase mock
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })),
    };

    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  describe('feedFishBatch', () => {
    const owner = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const fishIds = [1, 2, 3];
    const tankId = 10;

    beforeEach(() => {
      // Default mocks
      vi.mocked(getFeedBaseXp).mockReturnValue(10);
      // calculateFishXp will be mocked per test as needed
      vi.mocked(gainFishXp).mockResolvedValue('0xfishTxHash');
      vi.mocked(gainPlayerXp).mockResolvedValue('0xplayerTxHash');
    });

    it('should successfully feed fish with decoration multiplier', async () => {
      // Arrange: Setup Supabase mocks
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      const tankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: tankId },
          error: null,
        }),
      };
      const playerQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { total_xp: 100 },
          error: null,
        }),
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const insertQuery = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fishQuery) // fish query
        .mockReturnValueOnce(tankQuery) // tank query
        .mockReturnValueOnce(playerQuery) // player query
        .mockReturnValueOnce(updateQuery) // player update
        .mockReturnValueOnce(insertQuery) // sync queue entries (fish)
        .mockReturnValueOnce(insertQuery) // sync queue entries (fish)
        .mockReturnValueOnce(insertQuery) // sync queue entries (fish)
        .mockReturnValueOnce(insertQuery); // sync queue entry (player)

      fishQuery.in.mockResolvedValue({
        data: fishIds.map((id) => ({ id, owner })),
        error: null,
      });

      // Mock decoration multiplier
      vi.mocked(getActiveDecorationsMultiplier).mockResolvedValue(0.15); // 15%
      vi.mocked(calculateFishXp).mockReturnValue(11.5); // 10 * 1.15

      // Act
      const result = await service.feedFishBatch(fishIds, owner);

      // Assert
      expect(result).toBe('0xplayerTxHash');
      expect(getFeedBaseXp).toHaveBeenCalled();
      expect(getActiveDecorationsMultiplier).toHaveBeenCalledWith(tankId);
      expect(calculateFishXp).toHaveBeenCalledWith(10, 15); // baseXp=10, multiplier=15%
      // Should call gainFishXp for each fish
      expect(gainFishXp).toHaveBeenCalledTimes(3);
      fishIds.forEach((fishId) => {
        expect(gainFishXp).toHaveBeenCalledWith(fishId, 11.5);
      });
      // Should call gainPlayerXp with total XP (11.5 * 3 = 34.5)
      expect(gainPlayerXp).toHaveBeenCalledWith(owner, 34.5);
    });

    it('should handle case when owner has no tank (multiplier = 0)', async () => {
      // Arrange
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      const tankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      };
      const playerQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { total_xp: 100 },
          error: null,
        }),
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const insertQuery = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery)
        .mockReturnValueOnce(playerQuery)
        .mockReturnValueOnce(updateQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery);

      fishQuery.in.mockResolvedValue({
        data: fishIds.map((id) => ({ id, owner })),
        error: null,
      });

      // Mock calculateFishXp to return baseXp when multiplier is 0
      vi.mocked(calculateFishXp).mockReturnValue(10); // 10 * 1.00 = 10

      // Act
      const result = await service.feedFishBatch(fishIds, owner);

      // Assert
      expect(result).toBe('0xplayerTxHash');
      expect(getActiveDecorationsMultiplier).not.toHaveBeenCalled();
      expect(calculateFishXp).toHaveBeenCalledWith(10, 0); // multiplier = 0
      expect(gainFishXp).toHaveBeenCalledTimes(3);
      fishIds.forEach((fishId) => {
        expect(gainFishXp).toHaveBeenCalledWith(fishId, 10);
      });
      expect(gainPlayerXp).toHaveBeenCalledWith(owner, 30); // 10 * 3
    });

    it('should handle case when no active decorations (multiplier = 0)', async () => {
      // Arrange
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      const tankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: tankId },
          error: null,
        }),
      };
      const playerQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { total_xp: 100 },
          error: null,
        }),
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const insertQuery = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery)
        .mockReturnValueOnce(playerQuery)
        .mockReturnValueOnce(updateQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery);

      fishQuery.in.mockResolvedValue({
        data: fishIds.map((id) => ({ id, owner })),
        error: null,
      });

      // Mock no active decorations
      vi.mocked(getActiveDecorationsMultiplier).mockResolvedValue(0);
      vi.mocked(calculateFishXp).mockReturnValue(10); // 10 * 1.00 = 10

      // Act
      const result = await service.feedFishBatch(fishIds, owner);

      // Assert
      expect(result).toBe('0xplayerTxHash');
      expect(getActiveDecorationsMultiplier).toHaveBeenCalledWith(tankId);
      expect(calculateFishXp).toHaveBeenCalledWith(10, 0);
      expect(gainFishXp).toHaveBeenCalledTimes(3);
      fishIds.forEach((fishId) => {
        expect(gainFishXp).toHaveBeenCalledWith(fishId, 10);
      });
      expect(gainPlayerXp).toHaveBeenCalledWith(owner, 30); // 10 * 3
    });

    it('should throw ValidationError for empty fishIds array', async () => {
      await expect(service.feedFishBatch([], owner)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid owner address', async () => {
      await expect(service.feedFishBatch(fishIds, 'invalid-address')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when fish do not exist', async () => {
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(fishQuery);

      await expect(service.feedFishBatch(fishIds, owner)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when fish belong to different owner', async () => {
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { id: 1, owner: '0xdifferentowner' },
            { id: 2, owner },
            { id: 3, owner }, // All 3 fish found, but one has different owner
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(fishQuery);

      await expect(service.feedFishBatch(fishIds, owner)).rejects.toThrow(ValidationError);
    });

    it('should handle multiplier calculation error gracefully', async () => {
      // Arrange
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      const tankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: tankId },
          error: null,
        }),
      };

      const playerQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { total_xp: 100 },
          error: null,
        }),
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const insertQuery = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery)
        .mockReturnValueOnce(playerQuery)
        .mockReturnValueOnce(updateQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery);

      fishQuery.in.mockResolvedValue({
        data: fishIds.map((id) => ({ id, owner })),
        error: null,
      });

      // Mock multiplier calculation error
      vi.mocked(getActiveDecorationsMultiplier).mockRejectedValue(new Error('DB error'));
      vi.mocked(calculateFishXp).mockReturnValue(10); // 10 * 1.00 = 10

      // Act
      const result = await service.feedFishBatch(fishIds, owner);

      // Assert: Should continue with multiplier = 0
      expect(result).toBe('0xplayerTxHash');
      expect(calculateFishXp).toHaveBeenCalledWith(10, 0);
      expect(gainFishXp).toHaveBeenCalledTimes(3);
      fishIds.forEach((fishId) => {
        expect(gainFishXp).toHaveBeenCalledWith(fishId, 10);
      });
      expect(gainPlayerXp).toHaveBeenCalledWith(owner, 30); // 10 * 3
    });

    it('should throw OnChainError when on-chain feed fails', async () => {
      // Arrange
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      const tankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: tankId },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery);

      fishQuery.in.mockResolvedValue({
        data: fishIds.map((id) => ({ id, owner })),
        error: null,
      });

      vi.mocked(getActiveDecorationsMultiplier).mockResolvedValue(0);
      vi.mocked(calculateFishXp).mockReturnValue(10);
      vi.mocked(gainFishXp).mockRejectedValue(new Error('On-chain error'));

      // Act & Assert
      await expect(service.feedFishBatch(fishIds, owner)).rejects.toThrow(OnChainError);
    });

    it('should apply same multiplier to all fish in batch', async () => {
      // Arrange
      const multipleFishIds = [1, 2, 3, 4, 5];
      const fishQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      const tankQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: tankId },
          error: null,
        }),
      };

      const playerQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { total_xp: 100 },
          error: null,
        }),
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const insertQuery = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery)
        .mockReturnValueOnce(playerQuery)
        .mockReturnValueOnce(updateQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(insertQuery);

      fishQuery.in.mockResolvedValue({
        data: multipleFishIds.map((id) => ({ id, owner })),
        error: null,
      });

      vi.mocked(getActiveDecorationsMultiplier).mockResolvedValue(0.20); // 20%
      vi.mocked(calculateFishXp).mockReturnValue(12); // 10 * 1.20 = 12

      // Act
      await service.feedFishBatch(multipleFishIds, owner);

      // Assert: All fish should get the same XP value
      expect(gainFishXp).toHaveBeenCalledTimes(5);
      multipleFishIds.forEach((fishId) => {
        expect(gainFishXp).toHaveBeenCalledWith(fishId, 12);
      });
      expect(gainPlayerXp).toHaveBeenCalledWith(owner, 60); // 12 * 5
    });
  });
});

