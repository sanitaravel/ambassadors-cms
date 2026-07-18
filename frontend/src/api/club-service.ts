import type { StrapiEntity, CollectionResponse, StrapiSingleResponse } from './types';
import type { ActivityClub, BlockContent } from './content-types';
import { apiClient } from './client';
import { createContentService } from './content-service';

const clubService = createContentService<ActivityClub>('activity-clubs');

/**
 * Creates a new activity club in draft (unpublished) state.
 * The club is associated with the given user as the owner.
 *
 * @param data - Club name (required, max 255 chars) and optional description
 * @param userId - ID of the user creating the club (owner relation)
 * @returns The created club entity
 */
export async function createClub(
  data: { name: string; description?: BlockContent },
  userId: number
): Promise<StrapiEntity<ActivityClub>> {
  return clubService.create({
    name: data.name,
    description: data.description,
    users_permissions_user: userId as unknown,
  } as Partial<ActivityClub>);
}

/**
 * Fetches all clubs in draft/pending state (publicationState=preview),
 * populating the creator's user relation so their username is available.
 *
 * @returns Collection of pending clubs with creator info
 */
export async function getPendingClubs(): Promise<CollectionResponse<ActivityClub>> {
  return clubService.getMany({
    publicationState: 'preview',
    populate: ['users_permissions_user'],
  });
}

/**
 * Approves a pending club by publishing it via the Strapi 5 publish action.
 * Transitions the club from draft to published state.
 *
 * @param documentId - The documentId of the club to approve
 * @returns The published club entity
 */
export async function approveClub(documentId: string): Promise<StrapiEntity<ActivityClub>> {
  const response = await apiClient<StrapiSingleResponse<ActivityClub>>({
    method: 'POST',
    path: `/activity-clubs/${documentId}/actions/publish`,
  });

  return response.data;
}

/**
 * Denies a pending club by deleting its draft entry.
 *
 * @param documentId - The documentId of the club to deny/delete
 */
export async function denyClub(documentId: string): Promise<void> {
  return clubService.delete(documentId);
}
