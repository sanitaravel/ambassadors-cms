import qs from 'qs';
import type { StrapiEntity, StrapiResponse, StrapiSingleResponse, CollectionResponse } from './types';
import { apiClient } from './client';

export interface ContentServiceOptions {
  filters?: Record<string, unknown>;
  sort?: string | string[];
  pagination?: { page?: number; pageSize?: number };
  populate?: string | string[] | Record<string, unknown>;
  publicationState?: 'live' | 'preview';
}

/**
 * Serializes ContentServiceOptions into a query string using qs with encodeValuesOnly.
 * Returns the query string (with leading '?') or an empty string if no options are provided.
 */
function buildQueryString(options?: ContentServiceOptions): string {
  if (!options) return '';

  const params: Record<string, unknown> = {};

  if (options.filters) {
    params.filters = options.filters;
  }

  if (options.sort) {
    params.sort = options.sort;
  }

  if (options.pagination) {
    params.pagination = options.pagination;
  }

  if (options.populate) {
    params.populate = options.populate;
  }

  if (options.publicationState) {
    params.publicationState = options.publicationState;
  }

  const queryString = qs.stringify(params, { encodeValuesOnly: true });
  return queryString ? `?${queryString}` : '';
}

/**
 * Creates a typed content service for a given Strapi content-type plural name.
 * Provides getMany, getOne, create, update, and delete operations.
 *
 * ApiErrors from the API client propagate to the caller without modification.
 */
export function createContentService<T>(pluralName: string) {
  const basePath = `/${pluralName}`;

  return {
    /**
     * Fetches a collection of entities with optional filtering, sorting, pagination, and population.
     */
    async getMany(options?: ContentServiceOptions): Promise<CollectionResponse<T>> {
      const queryString = buildQueryString(options);
      const response = await apiClient<StrapiResponse<T>>({
        method: 'GET',
        path: `${basePath}${queryString}`,
      });

      return {
        data: response.data,
        meta: { pagination: response.meta.pagination },
      };
    },

    /**
     * Fetches a single entity by its documentId with optional population.
     */
    async getOne(documentId: string, options?: Pick<ContentServiceOptions, 'populate'>): Promise<StrapiEntity<T>> {
      const queryString = buildQueryString(options);
      const response = await apiClient<StrapiSingleResponse<T>>({
        method: 'GET',
        path: `${basePath}/${documentId}${queryString}`,
      });

      return response.data;
    },

    /**
     * Creates a new entity with the provided data wrapped in a { data } envelope.
     */
    async create(data: Partial<T>): Promise<StrapiEntity<T>> {
      const response = await apiClient<StrapiSingleResponse<T>>({
        method: 'POST',
        path: basePath,
        body: { data },
      });

      return response.data;
    },

    /**
     * Updates an entity by documentId with partial data wrapped in a { data } envelope.
     */
    async update(documentId: string, data: Partial<T>): Promise<StrapiEntity<T>> {
      const response = await apiClient<StrapiSingleResponse<T>>({
        method: 'PUT',
        path: `${basePath}/${documentId}`,
        body: { data },
      });

      return response.data;
    },

    /**
     * Deletes an entity by documentId.
     */
    async delete(documentId: string): Promise<void> {
      await apiClient<void>({
        method: 'DELETE',
        path: `${basePath}/${documentId}`,
      });
    },
  };
}
