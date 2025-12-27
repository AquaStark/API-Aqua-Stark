/**
 * @fileoverview Tests for Fish Controller
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Mock the service using the recommended Vitest pattern for class mocking
vi.mock('@/services/fish.service', () => {
  // Create a mock constructor function
  const FishService = vi.fn(function () {
    // Constructor can be empty or initialize mock state if needed
  });
  
  // Mock methods on the prototype
  FishService.prototype.getFishById = vi.fn();
  FishService.prototype.getFishFamily = vi.fn();
  FishService.prototype.getFishByOwner = vi.fn();
  FishService.prototype.feedFishBatch = vi.fn();
  FishService.prototype.breedFish = vi.fn();
  
  return { FishService };
});

// Import after mocks
import { getFishById, getFishFamily, getFishByOwner, feedFish, breedFish } from '@/controllers/fish.controller';
import { ValidationError, NotFoundError } from '@/core/errors';
import type { Fish } from '@/models/fish.model';
import type { FishFamilyTree } from '@/core/types/dojo-types';
import { FishService } from '@/services/fish.service';

describe('Fish Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {};
    mockReply = {};
  });

  describe('getFishById', () => {
    it('should return success response with valid ID', async () => {
      const mockFish: Fish = {
        id: 1,
        xp: 100,
        state: 'Adult',
        hunger: 50,
        isReadyToBreed: true,
        dna: '0x123',
        owner: '0xabc',
        species: 'Goldfish',
        imageUrl: 'https://example.com/fish.png',
        spriteUrl: null,
        createdAt: new Date(),
      };

      vi.mocked(FishService.prototype.getFishById).mockResolvedValue(mockFish);
      mockRequest.params = { id: '1' };

      const response = await getFishById(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockFish);
      expect(response.message).toBe('Fish retrieved successfully');
      expect(FishService.prototype.getFishById).toHaveBeenCalledWith(1);
    });

    it('should return error response with invalid ID format', async () => {
      mockRequest.params = { id: 'invalid' };

      const response = await getFishById(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Invalid fish ID format');
      expect(FishService.prototype.getFishById).not.toHaveBeenCalled();
    });

    it('should return error response when fish not found', async () => {
      vi.mocked(FishService.prototype.getFishById).mockRejectedValue(
        new NotFoundError('Fish with ID 999 not found')
      );
      mockRequest.params = { id: '999' };

      const response = await getFishById(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
      expect(response.error?.message).toContain('not found');
    });

    it('should use standardized response format', async () => {
      const mockFish: Fish = {
        id: 1,
        xp: 100,
        state: 'Adult',
        hunger: 50,
        isReadyToBreed: true,
        dna: '0x123',
        owner: '0xabc',
        species: 'Goldfish',
        imageUrl: 'https://example.com/fish.png',
        spriteUrl: null,
        createdAt: new Date(),
      };

      vi.mocked(FishService.prototype.getFishById).mockResolvedValue(mockFish);
      mockRequest.params = { id: '1' };

      const response = await getFishById(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('message');
    });
  });

  describe('getFishFamily', () => {
    it('should return success response with valid ID', async () => {
      const mockFamilyTree: FishFamilyTree = {
        fish: {
          id: 1,
          xp: 100,
          state: 'Adult',
          hunger: 50,
          isReadyToBreed: true,
          dna: '0x123',
        },
        ancestors: [],
        descendants: [],
      };

      vi.mocked(FishService.prototype.getFishFamily).mockResolvedValue(mockFamilyTree);
      mockRequest.params = { id: '1' };

      const response = await getFishFamily(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockFamilyTree);
      expect(response.message).toBe('Fish family tree retrieved successfully');
      expect(FishService.prototype.getFishFamily).toHaveBeenCalledWith(1);
    });

    it('should return error response with invalid ID format', async () => {
      mockRequest.params = { id: 'invalid' };

      const response = await getFishFamily(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('ValidationError');
      expect(FishService.prototype.getFishFamily).not.toHaveBeenCalled();
    });

    it('should return error response when fish not found', async () => {
      vi.mocked(FishService.prototype.getFishFamily).mockRejectedValue(
        new NotFoundError('Fish with ID 999 not found')
      );
      mockRequest.params = { id: '999' };

      const response = await getFishFamily(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
    });
  });

  describe('getFishByOwner', () => {
    it('should return success response with valid address', async () => {
      const mockFishList: Fish[] = [
        {
          id: 1,
          xp: 100,
          state: 'Adult',
          hunger: 50,
          isReadyToBreed: true,
          dna: '0x123',
          owner: '0xabc',
          species: 'Goldfish',
          imageUrl: 'https://example.com/fish.png',
          spriteUrl: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(FishService.prototype.getFishByOwner).mockResolvedValue(mockFishList);
      mockRequest.params = { address: '0xabc' };

      const response = await getFishByOwner(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockFishList);
      expect(response.message).toBe('Fish retrieved successfully');
      expect(FishService.prototype.getFishByOwner).toHaveBeenCalledWith('0xabc');
    });

    it('should return success response with empty array when owner has no fish', async () => {
      vi.mocked(FishService.prototype.getFishByOwner).mockResolvedValue([]);
      mockRequest.params = { address: '0xabc' };

      const response = await getFishByOwner(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return error response when owner not found', async () => {
      vi.mocked(FishService.prototype.getFishByOwner).mockRejectedValue(
        new NotFoundError('Player with address 0xabc not found')
      );
      mockRequest.params = { address: '0xabc' };

      const response = await getFishByOwner(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
    });
  });

  describe('feedFish', () => {
    it('should return success response with valid parameters', async () => {
      const mockTxHash = '0xtx123';
      vi.mocked(FishService.prototype.feedFishBatch).mockResolvedValue(mockTxHash);
      mockRequest.body = {
        fish_ids: [1, 2, 3],
        owner: '0xabc',
      };

      const response = await feedFish(
        mockRequest as FastifyRequest<{ Body: { fish_ids: number[]; owner: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ tx_hash: mockTxHash });
      expect(response.message).toBe('Fish fed successfully');
      expect(FishService.prototype.feedFishBatch).toHaveBeenCalledWith([1, 2, 3], '0xabc');
    });

    it('should return error response when fish_ids is missing', async () => {
      mockRequest.body = {
        owner: '0xabc',
      };

      const response = await feedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('fish_ids must be an array');
      expect(FishService.prototype.feedFishBatch).not.toHaveBeenCalled();
    });

    it('should return error response when fish_ids is not an array', async () => {
      mockRequest.body = {
        fish_ids: 'not-an-array',
        owner: '0xabc',
      };

      const response = await feedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('fish_ids must be an array');
    });

    it('should return error response when owner is missing', async () => {
      mockRequest.body = {
        fish_ids: [1, 2, 3],
      };

      const response = await feedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('owner is required');
    });

    it('should return error response when service throws error', async () => {
      vi.mocked(FishService.prototype.feedFishBatch).mockRejectedValue(
        new ValidationError('Invalid fish IDs')
      );
      mockRequest.body = {
        fish_ids: [1, 2, 3],
        owner: '0xabc',
      };

      const response = await feedFish(
        mockRequest as FastifyRequest<{ Body: { fish_ids: number[]; owner: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('ValidationError');
    });
  });

  describe('breedFish', () => {
    it('should return success response with valid parameters', async () => {
      const mockNewFish: Fish = {
        id: 3,
        xp: 0,
        state: 'Baby',
        hunger: 100,
        isReadyToBreed: false,
        dna: '0x456',
        owner: '0xabc',
        species: 'Goldfish',
        imageUrl: 'https://example.com/fish.png',
        spriteUrl: null,
        createdAt: new Date(),
      };

      vi.mocked(FishService.prototype.breedFish).mockResolvedValue(mockNewFish);
      mockRequest.body = {
        fish1_id: 1,
        fish2_id: 2,
        owner: '0xabc',
      };

      const response = await breedFish(
        mockRequest as FastifyRequest<{ Body: { fish1_id: number; fish2_id: number; owner: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockNewFish);
      expect(response.message).toBe('Fish bred successfully');
      expect(FishService.prototype.breedFish).toHaveBeenCalledWith(1, 2, '0xabc');
    });

    it('should return error response when fish1_id is missing', async () => {
      mockRequest.body = {
        fish2_id: 2,
        owner: '0xabc',
      };

      const response = await breedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('fish1_id must be a number');
      expect(FishService.prototype.breedFish).not.toHaveBeenCalled();
    });

    it('should return error response when fish1_id is not a number', async () => {
      mockRequest.body = {
        fish1_id: 'not-a-number',
        fish2_id: 2,
        owner: '0xabc',
      };

      const response = await breedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('fish1_id must be a number');
    });

    it('should return error response when fish2_id is missing', async () => {
      mockRequest.body = {
        fish1_id: 1,
        owner: '0xabc',
      };

      const response = await breedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('fish2_id must be a number');
    });

    it('should return error response when owner is missing', async () => {
      mockRequest.body = {
        fish1_id: 1,
        fish2_id: 2,
      };

      const response = await breedFish(
        mockRequest as FastifyRequest<{ Body: any }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('owner is required');
    });

    it('should return error response when service throws error', async () => {
      vi.mocked(FishService.prototype.breedFish).mockRejectedValue(
        new ValidationError('Cannot breed a fish with itself')
      );
      mockRequest.body = {
        fish1_id: 1,
        fish2_id: 1,
        owner: '0xabc',
      };

      const response = await breedFish(
        mockRequest as FastifyRequest<{ Body: { fish1_id: number; fish2_id: number; owner: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('ValidationError');
    });
  });
});
