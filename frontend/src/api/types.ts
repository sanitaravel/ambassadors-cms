export interface ApiError {
  status: number;
  name: string;
  message: string;
  details?: ValidationError[];
}

export interface ValidationError {
  path: string[];
  message: string;
}

export type StrapiEntity<T> = {
  id: number;
  documentId: string;
} & T;

export interface StrapiResponse<T> {
  data: StrapiEntity<T>[];
  meta: {
    pagination: PaginationMeta;
  };
}

export interface StrapiSingleResponse<T> {
  data: StrapiEntity<T>;
  meta: Record<string, never>;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface CollectionResponse<T> {
  data: StrapiEntity<T>[];
  meta: { pagination: PaginationMeta };
}
