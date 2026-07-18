import type { UserRole } from '../context/auth-context';

export type ContentType = 'activity-clubs' | 'buildings' | 'events' | 'news-articles';

const ALL_CONTENT_TYPES: ContentType[] = [
  'activity-clubs',
  'buildings',
  'events',
  'news-articles',
];

const LIMITED_CONTENT_TYPES: ContentType[] = ['buildings', 'news-articles'];

/**
 * Returns the content types a given role is permitted to manage.
 * Students and ambassadors can manage all 4 types; professors and
 * unauthenticated users (null) can only manage buildings and news articles.
 */
export function getPermittedContentTypes(role: UserRole): ContentType[] {
  if (role === 'student' || role === 'ambassador') {
    return ALL_CONTENT_TYPES;
  }
  return LIMITED_CONTENT_TYPES;
}
