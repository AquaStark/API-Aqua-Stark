/**
 * @fileoverview Tests for Asset Controller
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Mock the service using the recommended Vitest pattern for class mocking
vi.mock('@/services/asset.service', () => {
  // Create a mock constructor function
  const AssetService = vi.fn(function () {
    // Constructor can be empty or initialize mock state if needed
  });
  
  // Mock methods on the prototype
  AssetService.prototype.uploadFishSprite = vi.fn();
  AssetService.prototype.uploadTankSprite = vi.fn();
  AssetService.prototype.uploadDecorationSprite = vi.fn();
  AssetService.prototype.uploadAvatar = vi.fn();
  
  return { AssetService };
});

// Import after mocks
import { uploadFishSprite, uploadTankSprite, uploadDecorationSprite, uploadPlayerAvatar } from '@/controllers/asset.controller';
import { ValidationError, NotFoundError } from '@/core/errors';
import { AssetService } from '@/services/asset.service';

describe('Asset Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockFile: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFile = {
      filename: 'test.png',
      mimetype: 'image/png',
      encoding: '7bit',
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('test file content')),
    };

    mockRequest = {
      isMultipart: vi.fn().mockReturnValue(true),
      file: vi.fn().mockResolvedValue(mockFile),
    } as any;

    mockReply = {};
  });

  describe('uploadFishSprite', () => {
    it('should return success response with valid file upload', async () => {
      const mockSpriteUrl = 'https://example.com/fish-1-sprite.png';
      vi.mocked(AssetService.prototype.uploadFishSprite).mockResolvedValue(mockSpriteUrl);
      mockRequest.params = { id: '1' };

      const response = await uploadFishSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ sprite_url: mockSpriteUrl });
      expect(response.message).toBe('Fish asset uploaded successfully');
      expect(AssetService.prototype.uploadFishSprite).toHaveBeenCalled();
      expect((mockRequest as any).file).toHaveBeenCalled();
    });

    it('should return error response with invalid ID format', async () => {
      mockRequest.params = { id: 'invalid' };

      const response = await uploadFishSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Invalid fish ID format');
      expect(AssetService.prototype.uploadFishSprite).not.toHaveBeenCalled();
    });

    it('should return error response when request is not multipart', async () => {
      (mockRequest as any).isMultipart.mockReturnValue(false);
      mockRequest.params = { id: '1' };

      const response = await uploadFishSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('multipart/form-data');
      expect(AssetService.prototype.uploadFishSprite).not.toHaveBeenCalled();
    });

    it('should return error response when no file uploaded', async () => {
      (mockRequest as any).file.mockResolvedValue(null);
      mockRequest.params = { id: '1' };

      const response = await uploadFishSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No file uploaded');
      expect(AssetService.prototype.uploadFishSprite).not.toHaveBeenCalled();
    });

    it('should return error response when service throws error', async () => {
      vi.mocked(AssetService.prototype.uploadFishSprite).mockRejectedValue(
        new NotFoundError('Fish with ID 999 not found')
      );
      mockRequest.params = { id: '999' };

      const response = await uploadFishSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
    });
  });

  describe('uploadTankSprite', () => {
    it('should return success response with valid file upload', async () => {
      const mockSpriteUrl = 'https://example.com/tank-1-sprite.png';
      vi.mocked(AssetService.prototype.uploadTankSprite).mockResolvedValue(mockSpriteUrl);
      mockRequest.params = { id: '1' };

      const response = await uploadTankSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ sprite_url: mockSpriteUrl });
      expect(response.message).toBe('Tank asset uploaded successfully');
      expect(AssetService.prototype.uploadTankSprite).toHaveBeenCalled();
    });

    it('should return error response with invalid ID format', async () => {
      mockRequest.params = { id: 'invalid' };

      const response = await uploadTankSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Invalid tank ID format');
      expect(AssetService.prototype.uploadTankSprite).not.toHaveBeenCalled();
    });

    it('should return error response when request is not multipart', async () => {
      (mockRequest as any).isMultipart.mockReturnValue(false);
      mockRequest.params = { id: '1' };

      const response = await uploadTankSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('multipart/form-data');
    });

    it('should return error response when no file uploaded', async () => {
      (mockRequest as any).file.mockResolvedValue(null);
      mockRequest.params = { id: '1' };

      const response = await uploadTankSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No file uploaded');
    });

    it('should return error response when service throws error', async () => {
      vi.mocked(AssetService.prototype.uploadTankSprite).mockRejectedValue(
        new NotFoundError('Tank with ID 999 not found')
      );
      mockRequest.params = { id: '999' };

      const response = await uploadTankSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
    });
  });

  describe('uploadDecorationSprite', () => {
    it('should return success response with valid file upload', async () => {
      const mockSpriteUrl = 'https://example.com/decoration-1-sprite.png';
      vi.mocked(AssetService.prototype.uploadDecorationSprite).mockResolvedValue(mockSpriteUrl);
      mockRequest.params = { id: '1' };

      const response = await uploadDecorationSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ sprite_url: mockSpriteUrl });
      expect(response.message).toBe('Decoration asset uploaded successfully');
      expect(AssetService.prototype.uploadDecorationSprite).toHaveBeenCalled();
    });

    it('should return error response with invalid ID format', async () => {
      mockRequest.params = { id: 'invalid' };

      const response = await uploadDecorationSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Invalid decoration ID format');
      expect(AssetService.prototype.uploadDecorationSprite).not.toHaveBeenCalled();
    });

    it('should return error response when request is not multipart', async () => {
      (mockRequest as any).isMultipart.mockReturnValue(false);
      mockRequest.params = { id: '1' };

      const response = await uploadDecorationSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('multipart/form-data');
    });

    it('should return error response when no file uploaded', async () => {
      (mockRequest as any).file.mockResolvedValue(null);
      mockRequest.params = { id: '1' };

      const response = await uploadDecorationSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No file uploaded');
    });

    it('should return error response when service throws error', async () => {
      vi.mocked(AssetService.prototype.uploadDecorationSprite).mockRejectedValue(
        new NotFoundError('Decoration with ID 999 not found')
      );
      mockRequest.params = { id: '999' };

      const response = await uploadDecorationSprite(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
    });
  });

  describe('uploadPlayerAvatar', () => {
    it('should return success response with valid file upload', async () => {
      const mockAvatarUrl = 'https://example.com/avatar-0xabc.png';
      vi.mocked(AssetService.prototype.uploadAvatar).mockResolvedValue(mockAvatarUrl);
      mockRequest.params = { address: '0xabc' };

      const response = await uploadPlayerAvatar(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ avatar_url: mockAvatarUrl });
      expect(response.message).toBe('Player avatar uploaded successfully');
      expect(AssetService.prototype.uploadAvatar).toHaveBeenCalled();
    });

    it('should return error response with invalid address format', async () => {
      mockRequest.params = { address: '' };

      const response = await uploadPlayerAvatar(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Invalid player address format');
      expect(AssetService.prototype.uploadAvatar).not.toHaveBeenCalled();
    });

    it('should return error response when request is not multipart', async () => {
      (mockRequest as any).isMultipart.mockReturnValue(false);
      mockRequest.params = { address: '0xabc' };

      const response = await uploadPlayerAvatar(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('multipart/form-data');
    });

    it('should return error response when no file uploaded', async () => {
      (mockRequest as any).file.mockResolvedValue(null);
      mockRequest.params = { address: '0xabc' };

      const response = await uploadPlayerAvatar(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No file uploaded');
    });

    it('should return error response when service throws error', async () => {
      vi.mocked(AssetService.prototype.uploadAvatar).mockRejectedValue(
        new NotFoundError('Player with address 0xabc not found')
      );
      mockRequest.params = { address: '0xabc' };

      const response = await uploadPlayerAvatar(
        mockRequest as FastifyRequest<{ Params: { address: string } }>,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFoundError');
    });
  });
});
