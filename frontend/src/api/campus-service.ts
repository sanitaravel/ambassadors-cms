import { createContentService } from './content-service';
import type { Campus } from './content-types';

export const campusService = createContentService<Campus>('campuses');
