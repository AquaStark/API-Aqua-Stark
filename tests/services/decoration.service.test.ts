/**
 * @fileoverview Tests for Decoration Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('@/core/utils/supabase-client', () => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/core/utils/dojo-client', () => ({
  getDecorationOnChain: vi.fn(),
  activateDecoration: vi.fn(),
}));

vi.mock('@/core/utils/logger', () => ({
  logError: vi.fn(),
}));

// Now import after mocks
import { DecorationService } from '@/services/decoration.service';
import { ValidationError, NotFoundError, ConflictError, OnChainError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { getDecorationOnChain, activateDecoration as activateDecorationOnChain } from '@/core/utils/dojo-client';
import { DecorationKind } from '@/models/decoration.model';

describe('DecorationService', () => {
  let service: DecorationService;
  let mockSupabase: any;

  const owner = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const decorationId = 1;

  beforeEach(() => {
    service = new DecorationService();
    vi.clearAllMocks();

    // Setup default Supabase mock
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })),
    };

    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  describe('activateDecoration', () => {
    const mockDecorationOffChain = {
      id: decorationId,
      owner: owner,
      kind: DecorationKind.Plant,
      is_active: false,
      image_url: 'https://example.com/image.png',
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockDecorationOnChain = {
      id: decorationId,
      owner: owner,
      kind: DecorationKind.Plant,
      xp_multiplier: 1.25,
    };

    const mockDecorationActive = {
      ...mockDecorationOffChain,
      is_active: true,
    };

    beforeEach(() => {
      // Default mocks
      vi.mocked(activateDecorationOnChain).mockResolvedValue('0xtxhash123');
    });

    it('should successfully activate a decoration', async () => {
      // Arrange: Setup Supabase mocks for getDecorationById (called twice)
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: mockDecorationOffChain,
            error: null,
          })
          .mockResolvedValueOnce({
            data: mockDecorationActive, // After update
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

      mockSupabase.from
        .mockReturnValueOnce(selectQuery) // First getDecorationById call
        .mockReturnValueOnce(updateQuery)  // Update call
        .mockReturnValueOnce(selectQuery); // Second getDecorationById call

      vi.mocked(getDecorationOnChain)
        .mockResolvedValueOnce(mockDecorationOnChain) // First call
        .mockResolvedValueOnce(mockDecorationOnChain); // Second call

      // Act
      const result = await service.activateDecoration(decorationId, owner);

      // Assert
      expect(result.id).toBe(decorationId);
      expect(result.owner).toBe(owner);
      expect(result.is_active).toBe(true);
      expect(activateDecorationOnChain).toHaveBeenCalledWith(decorationId);
      expect(mockSupabase.from).toHaveBeenCalledWith('decorations');
      expect(updateQuery.update).toHaveBeenCalledWith({ is_active: true });
      expect(updateQuery.eq).toHaveBeenCalledWith('id', decorationId);
    });

    it('should throw ValidationError for invalid decoration ID', async () => {
      // Act & Assert
      await expect(service.activateDecoration(0, owner)).rejects.toThrow(ValidationError);
      await expect(service.activateDecoration(-1, owner)).rejects.toThrow(ValidationError);
      await expect(service.activateDecoration(1.5, owner)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty owner address', async () => {
      // Act & Assert
      await expect(service.activateDecoration(decorationId, '')).rejects.toThrow(ValidationError);
      await expect(service.activateDecoration(decorationId, '   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid owner address format', async () => {
      // Act & Assert
      await expect(service.activateDecoration(decorationId, 'invalid-address')).rejects.toThrow(ValidationError);
      await expect(service.activateDecoration(decorationId, '0x123')).rejects.toThrow(ValidationError);
      await expect(service.activateDecoration(decorationId, 'not-hex')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when decoration does not belong to owner', async () => {
      // Arrange
      const differentOwner = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef';
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDecorationOffChain,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(selectQuery);
      vi.mocked(getDecorationOnChain).mockResolvedValue({
        ...mockDecorationOnChain,
        owner: differentOwner, // Different owner
      });

      // Act & Assert
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow(ValidationError);
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow(
        `Decoration with ID ${decorationId} does not belong to owner ${owner.trim()}`
      );
    });

    it('should throw ConflictError when decoration is already active', async () => {
      // Arrange
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDecorationActive, // Already active
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(selectQuery);
      vi.mocked(getDecorationOnChain).mockResolvedValue(mockDecorationOnChain);

      // Act & Assert
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow(ConflictError);
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow(
        `Decoration with ID ${decorationId} is already active`
      );
      expect(activateDecorationOnChain).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when decoration does not exist', async () => {
      // Arrange
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      };

      mockSupabase.from.mockReturnValueOnce(selectQuery);

      // Act & Assert
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow(NotFoundError);
      expect(activateDecorationOnChain).not.toHaveBeenCalled();
    });

    it('should throw OnChainError when on-chain activation fails', async () => {
      // Arrange
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDecorationOffChain,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(selectQuery);
      vi.mocked(getDecorationOnChain).mockResolvedValue(mockDecorationOnChain);
      vi.mocked(activateDecorationOnChain).mockRejectedValue(new Error('On-chain error'));

      // Act & Assert
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow(OnChainError);
      expect(activateDecorationOnChain).toHaveBeenCalledWith(decorationId);
    });

    it('should throw Error when Supabase update fails', async () => {
      // Arrange
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDecorationOffChain,
          error: null,
        }),
      };

      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database update failed' },
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(selectQuery)
        .mockReturnValueOnce(updateQuery);

      vi.mocked(getDecorationOnChain).mockResolvedValue(mockDecorationOnChain);

      // Act & Assert
      await expect(service.activateDecoration(decorationId, owner)).rejects.toThrow('Database error: Database update failed');
      expect(activateDecorationOnChain).toHaveBeenCalledWith(decorationId);
    });

    it('should trim owner address before validation', async () => {
      // Arrange
      const ownerWithSpaces = `  ${owner}  `;
      const selectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: mockDecorationOffChain,
            error: null,
          })
          .mockResolvedValueOnce({
            data: mockDecorationActive,
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

      mockSupabase.from
        .mockReturnValueOnce(selectQuery)
        .mockReturnValueOnce(updateQuery)
        .mockReturnValueOnce(selectQuery);

      vi.mocked(getDecorationOnChain)
        .mockResolvedValueOnce(mockDecorationOnChain)
        .mockResolvedValueOnce(mockDecorationOnChain);

      // Act
      const result = await service.activateDecoration(decorationId, ownerWithSpaces);

      // Assert
      expect(result.owner).toBe(owner);
      expect(activateDecorationOnChain).toHaveBeenCalledWith(decorationId);
    });
  });
});

