export type Result<T = unknown> = {
  message?: string;
  success: boolean;
  data?: T | null;
};

export interface ListResult<T> {
  rows: T[];
  count: number;
  summary?: unknown[];
}
