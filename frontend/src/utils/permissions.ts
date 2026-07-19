import type { UserRole } from '../context/auth-context';

export type ContentType = 'activity-clubs' | 'events' | 'news-articles';

const ALL_CONTENT_TYPES: ContentType[] = [
  'activity-clubs',
  'events',
  'news-articles',
];

const LIMITED_CONTENT_TYPES: ContentType[] = ['news-articles'];

/**
 * Returns the content types a given role is permitted to manage.
 * Students and ambassadors can manage all 3 types; professors and
 * unauthenticated users (null) can only manage news articles.
 */
export function getPermittedContentTypes(role: UserRole): ContentType[] {
  if (role === 'student' || role === 'ambassador') {
    return ALL_CONTENT_TYPES;
  }
  return LIMITED_CONTENT_TYPES;
}
