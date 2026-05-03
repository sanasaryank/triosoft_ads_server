// Multilingual name/string object
export interface Translation {
  ARM: string;
  ENG: string;
  RUS: string;
}

// Language codes
export type LangCode = 'ARM' | 'ENG' | 'RUS';

// Pagination state
export interface PaginationState {
  page: number;
  pageSize: number;
}

// Normalized app error
export interface AppError {
  status?: number;
  title: string;
  message: string;
  details?: unknown;
}
