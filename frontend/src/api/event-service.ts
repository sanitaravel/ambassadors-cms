import type { StrapiEntity, CollectionResponse, ApiError } from './types';
import type { Event, BlockContent } from './content-types';
import { createContentService } from './content-service';

const eventService = createContentService<Event>('events');

export interface CreateEventData {
  title: string;
  starts_at: string;
  ends_at: string;
  description?: BlockContent;
  location?: string;
  activity_clubs?: string[];
  creator: number;
}

/**
 * Creates a new event with "Pending Approval" status.
 * Validates that ends_at > starts_at before sending the request.
 *
 * @param data - Event creation payload
 * @returns The created event entity
 * @throws ApiError if ends_at is not after starts_at
 */
export async function createEvent(data: CreateEventData): Promise<StrapiEntity<Event>> {
  const startsAt = new Date(data.starts_at).getTime();
  const endsAt = new Date(data.ends_at).getTime();

  if (endsAt <= startsAt) {
    const error: ApiError = {
      status: 400,
      name: 'ValidationError',
      message: 'End time must be after start time',
      details: [
        {
          path: ['ends_at'],
          message: 'End time must be after start time',
        },
      ],
    };
    throw error;
  }

  return eventService.create({
    title: data.title,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    description: data.description,
    event_status: 'Pending Approval',
    location: data.location,
    activity_clubs: data.activity_clubs,
    creator: data.creator,
  } as unknown as Partial<Event>);
}

/**
 * Fetches all events with "Pending Approval" status,
 * populating creator, location, and activity_clubs relations.
 *
 * @returns Collection of pending events with populated relations
 */
export async function getPendingEvents(): Promise<CollectionResponse<Event>> {
  return eventService.getMany({
    filters: { event_status: { $eq: 'Pending Approval' } },
    populate: ['creator', 'location', 'activity_clubs'],
  });
}

/**
 * Approves a pending event by updating its status to "Scheduled".
 *
 * @param documentId - The documentId of the event to approve
 * @returns The updated event entity
 */
export async function approveEvent(documentId: string): Promise<StrapiEntity<Event>> {
  return eventService.update(documentId, {
    event_status: 'Scheduled',
  } as Partial<Event>);
}

/**
 * Denies a pending event by updating its status to "Denied".
 *
 * @param documentId - The documentId of the event to deny
 * @returns The updated event entity
 */
export async function denyEvent(documentId: string): Promise<StrapiEntity<Event>> {
  return eventService.update(documentId, {
    event_status: 'Denied',
  } as Partial<Event>);
}
