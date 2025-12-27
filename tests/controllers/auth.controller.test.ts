/**
 * @fileoverview Tests for Auth Controller
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Mock the service using the recommended Vitest pattern for class mocking
vi.mock('@/services/player.service', () => {
  // Create a mock constructor function
  const PlayerService = vi.fn(function () {
    // Constructor can be empty or initialize mock state if needed
  });
  
  // Mock methods on the prototype
  PlayerService.prototype.registerPlayer = vi.fn();
  
  return { PlayerService };
});

// Import after mocks
import { login } from '@/controllers/auth.controller';
import { ValidationError } from '@/core/errors';
import type { Player } from '@/models/player.model';
import { PlayerService } from '@/services/player.service';

describe('Auth Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {};
    mockReply = {};
  });

  describe('login', () => {
    it('should return success response with valid address', async () => {
      const mockPlayer: Player = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        total_xp: 0,
        fish_count: 0,
        tournaments_won: 0,
        reputation: 0,
        offspring_created: 0,
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(PlayerService.prototype.registerPlayer).mockResolvedValue(mockPlayer);
      mockRequest.body = { address: '0x1234567890abcdef1234567890abcdef12345678' };

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPlayer);
      expect(response.message).toBe('Player logged in successfully');
      expect(PlayerService.prototype.registerPlayer).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678'
      );
    });

    it('should return error response when address is missing', async () => {
      mockRequest.body = {};

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Address is required');
      expect(response.error?.type).toBe('ValidationError');
      expect(PlayerService.prototype.registerPlayer).not.toHaveBeenCalled();
    });

    it('should return error response when address is empty string', async () => {
      mockRequest.body = { address: '' };

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Address is required');
      expect(response.error?.type).toBe('ValidationError');
      expect(PlayerService.prototype.registerPlayer).not.toHaveBeenCalled();
    });

    it('should return error response when service throws ValidationError', async () => {
      const validationError = new ValidationError('Invalid address format');
      vi.mocked(PlayerService.prototype.registerPlayer).mockRejectedValue(validationError);
      mockRequest.body = { address: 'invalid-address' };

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('ValidationError');
      expect(response.error?.message).toBe('Invalid address format');
      expect(PlayerService.prototype.registerPlayer).toHaveBeenCalledWith('invalid-address');
    });

    it('should return error response when service throws generic error', async () => {
      const genericError = new Error('Service unavailable');
      vi.mocked(PlayerService.prototype.registerPlayer).mockRejectedValue(genericError);
      mockRequest.body = { address: '0x1234567890abcdef1234567890abcdef12345678' };

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('Service unavailable');
    });

    it('should use standardized response format for success', async () => {
      const mockPlayer: Player = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        total_xp: 0,
        fish_count: 0,
        tournaments_won: 0,
        reputation: 0,
        offspring_created: 0,
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(PlayerService.prototype.registerPlayer).mockResolvedValue(mockPlayer);
      mockRequest.body = { address: '0x1234567890abcdef1234567890abcdef12345678' };

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('message');
      expect(typeof response.success).toBe('boolean');
      expect(response.success).toBe(true);
    });

    it('should use standardized response format for errors', async () => {
      mockRequest.body = {};

      const response = await login(
        mockRequest as FastifyRequest<{ Body: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('error');
      expect(typeof response.success).toBe('boolean');
      expect(response.success).toBe(false);
      expect(response.error).toHaveProperty('type');
      expect(response.error).toHaveProperty('message');
    });
  });
});

