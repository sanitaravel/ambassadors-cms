export type EventStatus =
  | "Pending Approval"
  | "Scheduled"
  | "Denied"
  | "Canceled"
  | "In Progress"
  | "Finished"
  | "Archived";

export type LocationType =
  | "room"
  | "hall"
  | "lab"
  | "office"
  | "meeting_room"
  | "study_space"
  | "event_space"
  | "outdoor_space"
  | "sports_facility"
  | "residence"
  | "other";

export type Priority = "Low" | "Medium" | "High";

export type FocusArea =
  | "admissions"
  | "international_students"
  | "student_life"
  | "academic_support"
  | "campus_tours"
  | "events"
  | "housing"
  | "career_services"
  | "research"
  | "community_outreach"
  | "social_media"
  | "other";

export type MemberRole = "owner" | "admin" | "member" | "guest";

export type Department = "natural_science" | "law" | "finance";

export type ProfessorTitle = "Prof." | "Prof. Dr.";
