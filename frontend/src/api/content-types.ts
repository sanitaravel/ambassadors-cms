import type { StrapiEntity } from "./types";
import type {
  EventStatus,
  LocationType,
  Priority,
  FocusArea,
  MemberRole,
  Department,
  ProfessorTitle,
} from "./enums";

export type BlockContent = unknown;

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
}

export interface Campus {
  name: string;
  city: string;
  country: string;
  timezone: string;
  // Relations
  buildings?: StrapiEntity<Building>[];
}

export interface Building {
  name: string;
  code: string;
  address: string;
  // Relations
  campus?: StrapiEntity<Campus> | null;
  locations?: StrapiEntity<Location>[];
}

export interface Location {
  name: string;
  capacity: number;
  location_type?: LocationType;
  // Relations
  building?: StrapiEntity<Building> | null;
  locations?: StrapiEntity<Location>[];
  events?: StrapiEntity<Event>[];
  issues?: StrapiEntity<Issue>[];
}

export interface Event {
  title: string;
  description?: BlockContent;
  starts_at: string;
  ends_at: string;
  event_status: EventStatus;
  // Relations
  location?: StrapiEntity<Location> | null;
  creator?: StrapiEntity<StrapiUser> | null;
  event_attendees?: StrapiEntity<EventAttendee>[];
  activity_clubs?: StrapiEntity<ActivityClub>[];
  issues?: StrapiEntity<Issue>[];
}

export interface EventAttendee {
  // Relations only
  event?: StrapiEntity<Event> | null;
  users_permissions_user?: StrapiEntity<StrapiUser> | null;
}

export interface ActivityClub {
  name: string;
  description?: BlockContent;
  // Relations
  users_permissions_user?: StrapiEntity<StrapiUser> | null;
  events?: StrapiEntity<Event>[];
  club_memberships?: StrapiEntity<ClubMembership>[];
  issues?: StrapiEntity<Issue>[];
}

export interface ClubMembership {
  member_role: MemberRole;
  // Relations
  activity_club?: StrapiEntity<ActivityClub> | null;
  users_permissions_user?: StrapiEntity<StrapiUser> | null;
}

export interface AmbassadorProfile {
  focus_area?: FocusArea;
}

export interface StudentProfile {
  student_number: number;
  program: string;
  year_of_study: number;
  month_of_study: number;
}

export interface ProfessorProfile {
  department: Department;
  title: ProfessorTitle;
}

export interface NewsArticle {
  title: string;
  summary?: string;
  body: BlockContent;
  // Relations
  users_permissions_users?: StrapiEntity<StrapiUser>[];
}

export interface Issue {
  title: string;
  description: BlockContent;
  priority: Priority;
  // Relations
  reporter?: StrapiEntity<StrapiUser> | null;
  assignee?: StrapiEntity<StrapiUser> | null;
  related_event?: StrapiEntity<Event> | null;
  related_activity_club?: StrapiEntity<ActivityClub> | null;
  related_location?: StrapiEntity<Location> | null;
}
