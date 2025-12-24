/**
 * @fileoverview Tests for Health Controller - Status Endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getStatus } from '@/controllers/health.controller';
import { validateSupabaseConnection } from '@/core/utils/supabase-client';
import { validateDojoConnection, initializeDojoClient } from '@/core/utils/dojo-client';
import pkg from '../../package.json';

// Mock dependencies
vi.mock('@/core/utils/supabase-client', () => ({
  validateSupabaseConnection: vi.fn(),
}));

vi.mock('@/core/utils/dojo-client', () => ({
  validateDojoConnection: vi.fn(),
  initializeDojoClient: vi.fn(),
}));

vi.mock('../../package.json', () => ({
  default: {
    version: '1.0.0',
  },
}));

describe('Health Controller - getStatus', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  const mockStartTime = Date.now() - 5000; // 5 seconds ago

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      server: {
        startTime: mockStartTime,
      } as any,
    };

    mockReply = {};
  });

  describe('successful status check', () => {
    it('should return success response with all services healthy', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('ok');
      expect(response.data.version).toBe(pkg.version);
      expect(response.data.timestamp).toBeDefined();
      expect(response.data.uptime).toBeGreaterThanOrEqual(4);
      expect(response.data.services).toHaveLength(2);
      expect(response.data.services[0]).toEqual({
        name: 'Supabase',
        status: 'healthy'
      });
      expect(response.data.services[1]).toEqual({
        name: 'Dojo/Starknet',
        status: 'healthy'
      });
    });

    it('should initialize Dojo client before checking', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(initializeDojoClient).toHaveBeenCalled();
    });
  });

  describe('service health checks', () => {
    it('should return unhealthy status when Supabase is down', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(false);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response.data.services[0]).toEqual({
        name: 'Supabase',
        status: 'unhealthy',
        message: 'Connection failed or timeout'
      });
      expect(response.data.services[1]).toEqual({
        name: 'Dojo/Starknet',
        status: 'healthy'
      });
    });

    it('should return unhealthy status when Dojo/Starknet is down', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(false);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response.data.services[0]).toEqual({
        name: 'Supabase',
        status: 'healthy'
      });
      expect(response.data.services[1]).toEqual({
        name: 'Dojo/Starknet',
        status: 'unhealthy',
        message: 'Connection failed or timeout'
      });
    });

    it('should return unhealthy status when both services are down', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(false);
      vi.mocked(validateDojoConnection).mockResolvedValue(false);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response.data.services[0].status).toBe('unhealthy');
      expect(response.data.services[1].status).toBe('unhealthy');
    });
  });

  describe('response structure', () => {
    it('should include all required fields', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('services');
      expect(Array.isArray(response.data.services)).toBe(true);
    });

    it('should return timestamp in ISO format', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      const timestamp = response.data.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(timestamp)).not.toThrow();
    });

    it('should use standardized response format', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('message');
      expect(response.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle missing startTime gracefully', async () => {
      mockRequest.server = {} as any;
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      const response = await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(response.data.uptime).toBeGreaterThanOrEqual(0);
      expect(response.data.uptime).toBeLessThanOrEqual(1);
    });

    it('should call validateDojoConnection with timeout', async () => {
      vi.mocked(validateSupabaseConnection).mockResolvedValue(true);
      vi.mocked(validateDojoConnection).mockResolvedValue(true);

      await getStatus(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(validateDojoConnection).toHaveBeenCalledWith(5000);
    });
  });
});

