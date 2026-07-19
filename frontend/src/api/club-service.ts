import type { StrapiEntity, CollectionResponse, StrapiSingleResponse } from './types';
import type { ActivityClub, ClubMembership, BlockContent, StrapiUser } from './content-types';
import { apiClient } from './client';
import { createContentService } from './content-service';

const clubService = createContentService<ActivityClub>('activity-clubs');
const clubMembershipService = createContentService<ClubMembership>('club-memberships');

/**
 * Creates a new activity club in draft (unpublished) state.
 * The owner (users_permissions_user) is automatically assigned server-side
 * via a lifecycle hook based on the authenticated user.
 *
 * @param data - Club name (required, max 255 chars) and optional description
 * @param _userId - ID of the user creating the club (handled server-side)
 * @returns The created club entity
 */
export async function createClub(
  data: { name: string; description?: BlockContent },
  _userId: number
): Promise<StrapiEntity<ActivityClub>> {
  return clubService.create({
    name: data.name,
    description: data.description,
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

/**
 * Fetches all registered users (for member selection).
 * Uses Strapi's users-permissions /users endpoint.
 */
export async function getUsers(): Promise<StrapiUser[]> {
  return apiClient<StrapiUser[]>({
    method: 'GET',
    path: '/users',
  });
}

/**
 * Fetches memberships for a specific club with user info populated.
 */
export async function getClubMembers(clubDocumentId: string): Promise<CollectionResponse<ClubMembership>> {
  return clubMembershipService.getMany({
    filters: { activity_club: { documentId: { $eq: clubDocumentId } } },
    populate: {
      users_permissions_user: { fields: ['id', 'username', 'email'] },
    },
    pagination: { pageSize: 100 },
  });
}

/**
 * Adds a user to a club as a member by creating a club-membership entry.
 *
 * @param clubDocumentId - The documentId of the club
 * @param userDocumentId - The documentId of the user to add
 * @param role - The role to assign (defaults to 'member')
 */
export async function addClubMember(
  clubDocumentId: string,
  userDocumentId: string,
  role: 'owner' | 'admin' | 'member' | 'guest' = 'member'
): Promise<StrapiEntity<ClubMembership>> {
  return clubMembershipService.create({
    activity_club: clubDocumentId,
    users_permissions_user: userDocumentId,
    member_role: role,
  } as unknown as Partial<ClubMembership>);
}

/**
 * Removes a member from a club by deleting the club-membership entry.
 *
 * @param membershipDocumentId - The documentId of the membership to remove
 */
export async function removeClubMember(membershipDocumentId: string): Promise<void> {
  return clubMembershipService.delete(membershipDocumentId);
}
