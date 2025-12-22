/**
 * @fileoverview Fish Genealogy Utility
 * 
 * Provides functions to build complete family trees for fish,
 * including both ancestors (lineage) and descendants (offspring).
 */

import { getSupabaseClient } from './supabase-client';
import { NotFoundError, ValidationError } from '../errors';
import { FishFamilyMember, FishFamilyTree } from '../types';

// Maximum depth to prevent infinite recursion and performance issues
const MAX_GENERATION_DEPTH = 50;

/**
 * Builds the complete family tree for a given fish ID.
 * Includes both ancestors (upwards) and descendants (downwards).
 * 
 * @param fishId - ID of the fish to build the tree for
 * @returns Complete FishFamilyTree
 * @throws {NotFoundError} If the fish doesn't exist
 * @throws {ValidationError} If generation depth limit is exceeded
 */
export async function buildFishFamilyTree(fishId: number): Promise<FishFamilyTree> {
  // Validate input
  if (!fishId || fishId <= 0 || !Number.isInteger(fishId)) {
    throw new ValidationError('Invalid fish ID');
  }

  const supabase = getSupabaseClient();

  // 1. Verify the root fish exists and get its parents
  const { data: rootFish, error } = await supabase
    .from('fish')
    .select('id, parent1_id, parent2_id')
    .eq('id', fishId)
    .single();

  if (error || !rootFish) {
    throw new NotFoundError(`Fish with ID ${fishId} not found`);
  }

  // Initialize collections
  const ancestors: FishFamilyMember[] = [];
  const descendants: FishFamilyMember[] = [];
  const visitedIds = new Set<number>();
  
  // Add root fish to visited to prevent cycles
  visitedIds.add(fishId);

  // Add root fish to ancestors list as generation 0
  ancestors.push({
    id: rootFish.id,
    parent1_id: rootFish.parent1_id,
    parent2_id: rootFish.parent2_id,
    generation: 0
  });

  // 2. Build ancestors tree (Upwards)
  let maxAncestorGeneration = 0;
  
  // Recursive function to fetch ancestors
  async function fetchAncestors(
    p1Id: number | null, 
    p2Id: number | null, 
    generation: number
  ): Promise<void> {
    if (generation > MAX_GENERATION_DEPTH) {
      throw new ValidationError(`Max ancestor depth exceeded at generation ${generation}`);
    }

    // Process parent 1
    if (p1Id !== null && !visitedIds.has(p1Id)) {
      visitedIds.add(p1Id);
      
      const { data: p1, error: p1Error } = await supabase
        .from('fish')
        .select('id, parent1_id, parent2_id')
        .eq('id', p1Id)
        .single();
        
      if (!p1Error && p1) {
        if (generation > maxAncestorGeneration) {
          maxAncestorGeneration = generation;
        }

        ancestors.push({
          id: p1.id,
          parent1_id: p1.parent1_id,
          parent2_id: p1.parent2_id,
          generation: generation
        });
        
        await fetchAncestors(p1.parent1_id, p1.parent2_id, generation + 1);
      }
    }

    // Process parent 2
    if (p2Id !== null && !visitedIds.has(p2Id)) {
      visitedIds.add(p2Id);
      
      const { data: p2, error: p2Error } = await supabase
        .from('fish')
        .select('id, parent1_id, parent2_id')
        .eq('id', p2Id)
        .single();
        
      if (!p2Error && p2) {
        if (generation > maxAncestorGeneration) {
          maxAncestorGeneration = generation;
        }

        ancestors.push({
          id: p2.id,
          parent1_id: p2.parent1_id,
          parent2_id: p2.parent2_id,
          generation: generation
        });
        
        await fetchAncestors(p2.parent1_id, p2.parent2_id, generation + 1);
      }
    }
  }

  // Start ancestor recursion from generation 1 (parents)
  await fetchAncestors(rootFish.parent1_id, rootFish.parent2_id, 1);

  // 3. Build descendants tree (Downwards)
  // Clear visited set for descendants traversal (except root) to act independently
  // or keep it to show full connectivity? Usually family trees treat ancestors and descendants separately.
  // We'll reset visited for descendants but keep root marked.
  visitedIds.clear();
  visitedIds.add(fishId);

  let maxDescendantGeneration = 0;

  // Recursive function to fetch descendants
  async function fetchDescendants(parentId: number, generation: number): Promise<void> {
    if (generation > MAX_GENERATION_DEPTH) {
      throw new ValidationError(`Max descendant depth exceeded at generation ${generation}`);
    }

    // Find all fish where parentId is either parent1_id or parent2_id
    const { data: children, error: childrenError } = await supabase
      .from('fish')
      .select('id, parent1_id, parent2_id')
      .or(`parent1_id.eq.${parentId},parent2_id.eq.${parentId}`);

    if (childrenError || !children || children.length === 0) {
      return;
    }

    for (const child of children) {
      if (!visitedIds.has(child.id)) {
        visitedIds.add(child.id);
        
        if (generation > maxDescendantGeneration) {
          maxDescendantGeneration = generation;
        }

        descendants.push({
          id: child.id,
          parent1_id: child.parent1_id,
          parent2_id: child.parent2_id,
          generation: generation
        });
        
        // Recurse for grandchildren
        await fetchDescendants(child.id, generation + 1);
      }
    }
  }

  // Start descendant recursion from generation 1 (children)
  await fetchDescendants(fishId, 1);

  // Sort lists by generation for cleaner output
  ancestors.sort((a, b) => a.generation - b.generation);
  descendants.sort((a, b) => a.generation - b.generation);

  return {
    fish_id: fishId,
    ancestors,
    descendants,
    generation_count: maxAncestorGeneration,
    descendant_generation_count: maxDescendantGeneration
  };
}
