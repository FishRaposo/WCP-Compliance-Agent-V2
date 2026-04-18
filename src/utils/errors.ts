/**
 * Error Handling Utility
 * 
 * Provides custom error classes and error handling utilities
 * for the WCP AI Agent project.
 * 
 * @file src/utils/errors.ts
 * @see AGENTS.md for coding patterns
 * @see CONTEXT.md for architecture decisions
 */

/**
 * Base error class for all WCP AI Agent errors
 */
export class WCPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'WCPError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WCPError);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

/**
 * Configuration error
 */
export class ConfigError extends WCPError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', 500, details);
    this.name = 'ConfigError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends WCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends WCPError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * External API error
 */
export class ExternalApiError extends WCPError {
  constructor(message: string, details?: any) {
    super(message, 'EXTERNAL_API_ERROR', 502, details);
    this.name = 'ExternalApiError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends WCPError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * Extract error details from unknown error
 */
export function extractErrorDetails(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
} {
  if (error instanceof WCPError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      // 🛡️ Sentinel: Removed stack trace from error details to prevent information leakage
      details: {},
    };
  }

  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

/**
 * Format error for API response
 */
export function formatApiError(error: unknown): {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
} {
  const details = extractErrorDetails(error);
  
  return {
    success: false,
    error: {
      message: details.message,
      code: details.code,
      statusCode: details.statusCode,
    },
  };
}

/**
 * Async wrapper for error handling
 */
export async function asyncHandler<T>(
  fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: WCPError }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof WCPError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new WCPError(
        'An unexpected error occurred',
        'INTERNAL_ERROR',
        500,
        error
      ),
    };
  }
}
