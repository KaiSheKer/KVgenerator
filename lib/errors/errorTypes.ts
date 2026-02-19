export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  API_ERROR = 'API_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public userMessage: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
