import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import qs from 'qs';
import type { ApiError, PaginationMeta, StrapiEntity } from '../types';

/**
 * Property-Based Tests for Content Service
 * Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 6.8
 */

// Mock the client module
vi.mock('../client', () => ({
  apiClient: vi.fn(),
}));

// Mock the token-store module
vi.mock('../token-store', () => ({
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

import { apiClient } from '../client';
import { createContentService } from '../content-service';

const mockedApiClient = vi.mocked(apiClient);

describe('Content Service Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Arbitraries ---

  /** Generates a valid Strapi entity with arbitrary fields */
  const entityFieldsArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  });

  /** Generates a valid StrapiEntity<T> with id and documentId */
  const strapiEntityArb = fc.record({
    id: fc.nat({ max: 100000 }),
    documentId: fc.stringMatching(/^[a-z0-9]{10,24}$/),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  });

  /** Generates valid pagination metadata */
  const paginationArb: fc.Arbitrary<PaginationMeta> = fc.record({
    page: fc.integer({ min: 1, max: 100 }),
    pageSize: fc.integer({ min: 1, max: 100 }),
    pageCount: fc.integer({ min: 0, max: 100 }),
    total: fc.integer({ min: 0, max: 10000 }),
  });

  /** Generates a plural content type name */
  const pluralNameArb = fc.stringMatching(/^[a-z][a-z-]{2,20}s$/);

  /** Generates a valid documentId */
  const documentIdArb = fc.stringMatching(/^[a-z0-9]{10,24}$/);

  /**
   * Property 6: Strapi Response Envelope Unwrapping
   *
   * For any valid Strapi response envelope (single or collection), the Content Service
   * SHALL extract and return the `data` payload preserving all entity fields and their values.
   * For collections, the pagination metadata SHALL also be preserved.
   *
   * **Validates: Requirements 6.2, 6.3**
   */
  describe('Property 6: Strapi Response Envelope Unwrapping', () => {
    it('getMany preserves data array and pagination from StrapiResponse envelope', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          fc.array(strapiEntityArb, { minLength: 0, maxLength: 10 }),
          paginationArb,
          async (pluralName, entities, pagination) => {
            vi.clearAllMocks();

            // Mock apiClient to return a Strapi collection response envelope
            mockedApiClient.mockResolvedValue({
              data: entities,
              meta: { pagination },
            });

            const service = createContentService(pluralName);
            const result = await service.getMany();

            // Data array must be preserved exactly
            expect(result.data).toEqual(entities);
            // Pagination metadata must be preserved exactly
            expect(result.meta.pagination).toEqual(pagination);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getOne preserves entity data from StrapiSingleResponse envelope', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          strapiEntityArb,
          documentIdArb,
          async (pluralName, entity, docId) => {
            vi.clearAllMocks();

            // Mock apiClient to return a Strapi single response envelope
            mockedApiClient.mockResolvedValue({
              data: entity,
              meta: {},
            });

            const service = createContentService(pluralName);
            const result = await service.getOne(docId);

            // Returned entity must exactly match the data from the envelope
            expect(result).toEqual(entity);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Query Parameter Serialization
   *
   * For any valid query options object (filters, sort, pagination, populate, publicationState),
   * the Content Service SHALL serialize it into a query string using `qs` with `encodeValuesOnly`,
   * producing output that Strapi 5 can parse back into the original structure.
   *
   * **Validates: Requirements 6.4**
   */
  describe('Property 7: Query Parameter Serialization', () => {
    /** Generates arbitrary ContentServiceOptions */
    const contentServiceOptionsArb = fc.record(
      {
        filters: fc.record({
          name: fc.record({
            $eq: fc.string({ minLength: 1, maxLength: 20 }),
          }),
        }),
        sort: fc.oneof(
          fc.stringMatching(/^[a-z]{1,10}:(asc|desc)$/),
          fc.array(fc.stringMatching(/^[a-z]{1,10}:(asc|desc)$/), { minLength: 1, maxLength: 3 })
        ),
        pagination: fc.record(
          {
            page: fc.integer({ min: 1, max: 50 }),
            pageSize: fc.integer({ min: 1, max: 100 }),
          },
          { requiredKeys: [] }
        ),
        populate: fc.oneof(
          fc.stringMatching(/^[a-z]{1,15}$/),
          fc.array(fc.stringMatching(/^[a-z]{1,15}$/), { minLength: 1, maxLength: 3 })
        ),
        publicationState: fc.constantFrom('live' as const, 'preview' as const),
      },
      { requiredKeys: [] }
    );

    it('getMany serializes options into query string that round-trips with qs.parse', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          contentServiceOptionsArb,
          async (pluralName, options) => {
            vi.clearAllMocks();

            // Mock apiClient to return a valid response
            mockedApiClient.mockResolvedValue({
              data: [],
              meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
            });

            const service = createContentService(pluralName);
            await service.getMany(options);

            // Capture the path passed to apiClient
            const callArgs = mockedApiClient.mock.calls[0][0];
            const path = callArgs.path as string;

            // Extract query string portion
            const queryIndex = path.indexOf('?');

            // Build expected params (only non-undefined keys)
            const expectedParams: Record<string, unknown> = {};
            if (options.filters) expectedParams.filters = options.filters;
            if (options.sort) expectedParams.sort = options.sort;
            if (options.pagination) expectedParams.pagination = options.pagination;
            if (options.populate) expectedParams.populate = options.populate;
            if (options.publicationState) expectedParams.publicationState = options.publicationState;

            const hasOptions = Object.keys(expectedParams).length > 0;

            if (hasOptions) {
              expect(queryIndex).toBeGreaterThan(-1);
              const queryString = path.slice(queryIndex + 1);

              // Parse the query string back and verify round-trip
              const parsed = qs.parse(queryString);

              // For each key in expectedParams, verify it exists in parsed result
              if (expectedParams.filters) {
                expect(parsed.filters).toEqual(expectedParams.filters);
              }
              if (expectedParams.publicationState) {
                expect(parsed.publicationState).toBe(expectedParams.publicationState);
              }
              if (expectedParams.sort) {
                expect(parsed.sort).toEqual(expectedParams.sort);
              }
              if (expectedParams.pagination) {
                // qs.parse returns strings for numbers, so we compare structurally
                const parsedPagination = parsed.pagination as Record<string, string>;
                const expectedPagination = expectedParams.pagination as Record<string, number>;
                for (const [key, value] of Object.entries(expectedPagination)) {
                  if (value !== undefined) {
                    expect(String(parsedPagination[key])).toBe(String(value));
                  }
                }
              }
              if (expectedParams.populate) {
                expect(parsed.populate).toEqual(expectedParams.populate);
              }
            } else {
              // No options → no query string
              expect(queryIndex).toBe(-1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Mutation Request Body Wrapping
   *
   * For any entity data passed to `create` or `update` operations, the Content Service
   * SHALL wrap it in a `{ data: <entityData> }` envelope before sending to the Strapi API,
   * preserving all fields and values of the original data.
   *
   * **Validates: Requirements 6.5, 6.6**
   */
  describe('Property 8: Mutation Request Body Wrapping', () => {
    /** Arbitrary entity data (any JSON-serializable object) */
    const entityDataArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 0, maxLength: 100 }),
      count: fc.integer({ min: 0, max: 1000 }),
      active: fc.boolean(),
    });

    it('create wraps entity data in { data: ... } envelope', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          entityDataArb,
          async (pluralName, entityData) => {
            vi.clearAllMocks();

            // Mock apiClient to return a valid single response
            mockedApiClient.mockResolvedValue({
              data: { id: 1, documentId: 'abc123def456', ...entityData },
              meta: {},
            });

            const service = createContentService(pluralName);
            await service.create(entityData);

            // Verify the body passed to apiClient is wrapped
            const callArgs = mockedApiClient.mock.calls[0][0];
            expect(callArgs.body).toEqual({ data: entityData });
            expect(callArgs.method).toBe('POST');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('update wraps entity data in { data: ... } envelope', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          documentIdArb,
          entityDataArb,
          async (pluralName, docId, entityData) => {
            vi.clearAllMocks();

            // Mock apiClient to return a valid single response
            mockedApiClient.mockResolvedValue({
              data: { id: 1, documentId: docId, ...entityData },
              meta: {},
            });

            const service = createContentService(pluralName);
            await service.update(docId, entityData);

            // Verify the body passed to apiClient is wrapped
            const callArgs = mockedApiClient.mock.calls[0][0];
            expect(callArgs.body).toEqual({ data: entityData });
            expect(callArgs.method).toBe('PUT');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Error Pass-Through
   *
   * For any ApiError returned by the API Client during a Content Service operation,
   * the Content Service SHALL propagate that exact error object to the caller without
   * modifying its status, name, message, or details.
   *
   * **Validates: Requirements 6.8**
   */
  describe('Property 9: Error Pass-Through', () => {
    /** Generates arbitrary ApiError objects */
    const apiErrorArb: fc.Arbitrary<ApiError> = fc.record({
      status: fc.integer({ min: 400, max: 599 }),
      name: fc.stringMatching(/^[A-Za-z]{3,25}$/),
      message: fc.string({ minLength: 1, maxLength: 100 }),
      details: fc.option(
        fc.array(
          fc.record({
            path: fc.array(fc.stringMatching(/^[a-z]{1,15}$/), { minLength: 1, maxLength: 3 }),
            message: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        { nil: undefined }
      ),
    });

    it('getMany propagates ApiError without modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          apiErrorArb,
          async (pluralName, error) => {
            vi.clearAllMocks();
            mockedApiClient.mockRejectedValue(error);

            const service = createContentService(pluralName);

            try {
              await service.getMany();
              expect.fail('Expected getMany to throw');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(error.status);
              expect(apiError.name).toBe(error.name);
              expect(apiError.message).toBe(error.message);
              expect(apiError.details).toEqual(error.details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getOne propagates ApiError without modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          documentIdArb,
          apiErrorArb,
          async (pluralName, docId, error) => {
            vi.clearAllMocks();
            mockedApiClient.mockRejectedValue(error);

            const service = createContentService(pluralName);

            try {
              await service.getOne(docId);
              expect.fail('Expected getOne to throw');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(error.status);
              expect(apiError.name).toBe(error.name);
              expect(apiError.message).toBe(error.message);
              expect(apiError.details).toEqual(error.details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('create propagates ApiError without modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          apiErrorArb,
          async (pluralName, error) => {
            vi.clearAllMocks();
            mockedApiClient.mockRejectedValue(error);

            const service = createContentService(pluralName);

            try {
              await service.create({ name: 'test' });
              expect.fail('Expected create to throw');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(error.status);
              expect(apiError.name).toBe(error.name);
              expect(apiError.message).toBe(error.message);
              expect(apiError.details).toEqual(error.details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('update propagates ApiError without modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          documentIdArb,
          apiErrorArb,
          async (pluralName, docId, error) => {
            vi.clearAllMocks();
            mockedApiClient.mockRejectedValue(error);

            const service = createContentService(pluralName);

            try {
              await service.update(docId, { name: 'test' });
              expect.fail('Expected update to throw');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(error.status);
              expect(apiError.name).toBe(error.name);
              expect(apiError.message).toBe(error.message);
              expect(apiError.details).toEqual(error.details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('delete propagates ApiError without modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          pluralNameArb,
          documentIdArb,
          apiErrorArb,
          async (pluralName, docId, error) => {
            vi.clearAllMocks();
            mockedApiClient.mockRejectedValue(error);

            const service = createContentService(pluralName);

            try {
              await service.delete(docId);
              expect.fail('Expected delete to throw');
            } catch (thrownError) {
              const apiError = thrownError as ApiError;
              expect(apiError.status).toBe(error.status);
              expect(apiError.name).toBe(error.name);
              expect(apiError.message).toBe(error.message);
              expect(apiError.details).toEqual(error.details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
