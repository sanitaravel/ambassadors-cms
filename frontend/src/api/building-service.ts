import { createContentService } from './content-service';
import type { Building } from './content-types';

export const buildingService = createContentService<Building>('buildings');
