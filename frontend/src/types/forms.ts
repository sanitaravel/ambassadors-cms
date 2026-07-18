export interface ClubFormData {
  name: string;
  description: string; // Rich text stored as string for the editor
}

export interface BuildingFormData {
  name: string;
  code: string;
  address: string;
  campus: string; // documentId of selected campus, or empty
}

export interface EventFormData {
  title: string;
  description: string;
  starts_at: string; // ISO datetime string
  ends_at: string; // ISO datetime string
  event_status: string;
  location: string; // documentId of selected location, or empty
}

import type { StrapiBlock } from '../components/forms/strapi-blocks';

export interface NewsArticleFormData {
  title: string;
  summary: string;
  body: StrapiBlock[]; // Strapi v5 blocks format
}
