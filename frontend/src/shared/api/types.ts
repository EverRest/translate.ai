export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success?: false;
  message?: string;
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type PaginatedData<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number };
};
