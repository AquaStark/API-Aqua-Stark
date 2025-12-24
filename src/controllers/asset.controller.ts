/**
 * @fileoverview Asset Controller
 * 
 * Request handlers for asset endpoints.
 * Handles file uploads and asset management.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ControllerResponse } from '@/core/types/controller-response';
import { createSuccessResponse, createErrorResponse } from '@/core/responses';
import { AssetService } from '@/services/asset.service';

const assetService = new AssetService();

/**
 * POST /asset/fish/:id/sprite
 * 
 * Uploads a sprite or 3D asset for a specific fish.
 * Supports multipart/form-data.
 * 
 * @param request - Fastify request with file and id parameter
 * @param reply - Fastify reply
 * @returns Uploaded asset URL or error response
 */
export async function uploadFishSprite(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<{ sprite_url: string }>> {
  try {
    const { id } = request.params;
    const fishId = parseInt(id, 10);
    
    if (isNaN(fishId)) {
      throw new Error('Invalid fish ID format');
    }

    // Check if request is multipart
    if (!request.isMultipart()) {
      throw new Error('Request must be multipart/form-data');
    }

    // Get the file from request
    // We expect a single file field named 'file'
    const data = await request.file();
    
    if (!data) {
      throw new Error('No file uploaded');
    }

    // Read the file buffer
    const buffer = await data.toBuffer();

    // Call service to process upload
    const spriteUrl = await assetService.uploadFishSprite({
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
      file: buffer
    }, fishId);

    return createSuccessResponse(
      { sprite_url: spriteUrl },
      'Fish asset uploaded successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /asset/tank/:id/sprite
 * 
 * Uploads a sprite for a specific tank.
 * Supports multipart/form-data.
 * 
 * @param request - Fastify request with file and id parameter
 * @param reply - Fastify reply
 * @returns Uploaded asset URL or error response
 */
export async function uploadTankSprite(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<{ sprite_url: string }>> {
  try {
    const { id } = request.params;
    const tankId = parseInt(id, 10);
    
    if (isNaN(tankId)) {
      throw new Error('Invalid tank ID format');
    }

    // Check if request is multipart
    if (!request.isMultipart()) {
      throw new Error('Request must be multipart/form-data');
    }

    // Get the file from request
    // We expect a single file field named 'file'
    const data = await request.file();
    
    if (!data) {
      throw new Error('No file uploaded');
    }

    // Read the file buffer
    const buffer = await data.toBuffer();

    // Call service to process upload
    const spriteUrl = await assetService.uploadTankSprite({
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
      file: buffer
    }, tankId);

    return createSuccessResponse(
      { sprite_url: spriteUrl },
      'Tank asset uploaded successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /asset/decoration/:id/sprite
 * 
 * Uploads a sprite for a specific decoration.
 * Supports multipart/form-data.
 * 
 * @param request - Fastify request with file and id parameter
 * @param reply - Fastify reply
 * @returns Uploaded asset URL or error response
 */
export async function uploadDecorationSprite(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<{ sprite_url: string }>> {
  try {
    const { id } = request.params;
    const decorationId = parseInt(id, 10);
    
    if (isNaN(decorationId)) {
      throw new Error('Invalid decoration ID format');
    }

    // Check if request is multipart
    if (!request.isMultipart()) {
      throw new Error('Request must be multipart/form-data');
    }

    // Get the file from request
    // We expect a single file field named 'file'
    const data = await request.file();
    
    if (!data) {
      throw new Error('No file uploaded');
    }

    // Read the file buffer
    const buffer = await data.toBuffer();

    // Call service to process upload
    const spriteUrl = await assetService.uploadDecorationSprite({
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
      file: buffer
    }, decorationId);

    return createSuccessResponse(
      { sprite_url: spriteUrl },
      'Decoration asset uploaded successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /asset/player/:address/avatar
 * 
 * Uploads an avatar for a specific player.
 * Supports multipart/form-data.
 * 
 * @param request - Fastify request with file and address parameter
 * @param reply - Fastify reply
 * @returns Uploaded avatar URL or error response
 */
export async function uploadPlayerAvatar(
  request: FastifyRequest<{ Params: { address: string } }>,
  _reply: FastifyReply
): Promise<ControllerResponse<{ avatar_url: string }>> {
  try {
    const { address } = request.params;
    
    if (!address || address.trim().length === 0) {
      throw new Error('Invalid player address format');
    }

    // Check if request is multipart
    if (!request.isMultipart()) {
      throw new Error('Request must be multipart/form-data');
    }

    // Get the file from request
    // We expect a single file field named 'file'
    const data = await request.file();
    
    if (!data) {
      throw new Error('No file uploaded');
    }

    // Read the file buffer
    const buffer = await data.toBuffer();

    // Call service to process upload
    const avatarUrl = await assetService.uploadAvatar({
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
      file: buffer
    }, address);

    return createSuccessResponse(
      { avatar_url: avatarUrl },
      'Player avatar uploaded successfully'
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

