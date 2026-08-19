export class ApiError extends Error {
  status: number;
  errorType?: string;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown, errorType?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorType = errorType;
    this.body = body;
  }
}
