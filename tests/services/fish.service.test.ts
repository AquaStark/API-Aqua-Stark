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
import { ValidationError, NotFoundError, OnChainError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { feedFishBatch as dojoFeedFishBatch } from '@/core/utils/dojo-client';
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
      vi.mocked(dojoFeedFishBatch).mockResolvedValue('0xtxhash123');
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

      mockSupabase.from
        .mockReturnValueOnce(fishQuery) // fish query
        .mockReturnValueOnce(tankQuery); // tank query

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
      expect(result).toBe('0xtxhash123');
      expect(getFeedBaseXp).toHaveBeenCalled();
      expect(getActiveDecorationsMultiplier).toHaveBeenCalledWith(tankId);
      expect(calculateFishXp).toHaveBeenCalledWith(10, 15); // baseXp=10, multiplier=15%
      expect(dojoFeedFishBatch).toHaveBeenCalledWith(
        fishIds,
        [11.5, 11.5, 11.5] // All fish get same XP value
      );
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

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery);

      fishQuery.in.mockResolvedValue({
        data: fishIds.map((id) => ({ id, owner })),
        error: null,
      });

      // Mock calculateFishXp to return baseXp when multiplier is 0
      vi.mocked(calculateFishXp).mockReturnValue(10); // 10 * 1.00 = 10

      // Act
      const result = await service.feedFishBatch(fishIds, owner);

      // Assert
      expect(result).toBe('0xtxhash123');
      expect(getActiveDecorationsMultiplier).not.toHaveBeenCalled();
      expect(calculateFishXp).toHaveBeenCalledWith(10, 0); // multiplier = 0
      expect(dojoFeedFishBatch).toHaveBeenCalledWith(
        fishIds,
        [10, 10, 10] // baseXp without multiplier
      );
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

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery);

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
      expect(result).toBe('0xtxhash123');
      expect(getActiveDecorationsMultiplier).toHaveBeenCalledWith(tankId);
      expect(calculateFishXp).toHaveBeenCalledWith(10, 0);
      expect(dojoFeedFishBatch).toHaveBeenCalledWith(
        fishIds,
        [10, 10, 10]
      );
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

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery);

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
      expect(result).toBe('0xtxhash123');
      expect(calculateFishXp).toHaveBeenCalledWith(10, 0);
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
      vi.mocked(dojoFeedFishBatch).mockRejectedValue(new Error('On-chain error'));

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

      mockSupabase.from
        .mockReturnValueOnce(fishQuery)
        .mockReturnValueOnce(tankQuery);

      fishQuery.in.mockResolvedValue({
        data: multipleFishIds.map((id) => ({ id, owner })),
        error: null,
      });

      vi.mocked(getActiveDecorationsMultiplier).mockResolvedValue(0.20); // 20%
      vi.mocked(calculateFishXp).mockReturnValue(12); // 10 * 1.20 = 12

      // Act
      await service.feedFishBatch(multipleFishIds, owner);

      // Assert: All fish should get the same XP value
      expect(dojoFeedFishBatch).toHaveBeenCalledWith(
        multipleFishIds,
        [12, 12, 12, 12, 12] // All 5 fish get same XP
      );
    });
  });
});

