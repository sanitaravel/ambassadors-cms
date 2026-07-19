import { createContentService } from './content-service';
import type {
  Campus,
  Building,
  Location,
  Event,
  EventAttendee,
  ActivityClub,
  ClubMembership,
  AmbassadorProfile,
  StudentProfile,
  ProfessorProfile,
  NewsArticle,
  Issue,
} from './content-types';

// Pre-configured content service instances for all content types
export const campusService = createContentService<Campus>('campuses');
export const buildingService = createContentService<Building>('buildings');
export const locationService = createContentService<Location>('locations');
export const eventService = createContentService<Event>('events');
export const eventAttendeeService = createContentService<EventAttendee>('event-attendees');
export const activityClubService = createContentService<ActivityClub>('activity-clubs');
export const clubMembershipService = createContentService<ClubMembership>('club-memberships');
export const ambassadorProfileService = createContentService<AmbassadorProfile>('ambassador-profiles');
export const studentProfileService = createContentService<StudentProfile>('student-profiles');
export const professorProfileService = createContentService<ProfessorProfile>('professor-profiles');
export const newsArticleService = createContentService<NewsArticle>('news-articles');
export const issueService = createContentService<Issue>('issues');

// Re-export domain-specific services for club and event workflows
export { createClub, getPendingClubs, approveClub, denyClub, getUsers, getClubMembers, addClubMember, removeClubMember } from './club-service';
export { createEvent, getPendingEvents, approveEvent, denyEvent } from './event-service';
export type { CreateEventData } from './event-service';
