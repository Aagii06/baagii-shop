import { tr } from "@/lib/i18n/translations";

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

/**
 * Thrown by API functions whose eshop-service endpoint doesn't exist yet
 * (writes, orders, sales). The UI shows the message as an error toast.
 */
export class EndpointMissingError extends Error {
  constructor(action: string) {
    super(tr("err.endpointMissing", { action }));
    this.name = "EndpointMissingError";
  }
}

export function endpointMissing(action: string): Promise<never> {
  return Promise.reject(new EndpointMissingError(action));
}
