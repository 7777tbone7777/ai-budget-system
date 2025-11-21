/**
 * Centralized Logging System
 * Provides structured logging with context, levels, and timestamps
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m'
};

class Logger {
  constructor(context = 'APP') {
    this.context = context;
    this.enableColors = process.env.NODE_ENV !== 'production';
  }

  /**
   * Format log message with timestamp, level, context, and metadata
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = this.enableColors ? COLORS[level] : '';
    const reset = this.enableColors ? COLORS.RESET : '';

    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta
    };

    // Console output (colorized)
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    console.log(`${color}[${timestamp}] [${level}] [${this.context}]${reset} ${message}${metaStr}`);

    // Return structured log for potential external logging
    return logEntry;
  }

  /**
   * Log error with stack trace
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code,
        ...error
      } : null
    };

    return this.formatMessage(LOG_LEVELS.ERROR, message, errorMeta);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    return this.formatMessage(LOG_LEVELS.WARN, message, meta);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    return this.formatMessage(LOG_LEVELS.INFO, message, meta);
  }

  /**
   * Log debug (only in development)
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      return this.formatMessage(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  /**
   * Log database query
   */
  query(query, params = [], executionTime = null) {
    const meta = {
      query: query.substring(0, 500), // Truncate long queries
      params: params,
      executionTime: executionTime ? `${executionTime}ms` : null
    };

    return this.debug('Database query', meta);
  }

  /**
   * Log API request
   */
  request(req, meta = {}) {
    const requestMeta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      ...meta
    };

    return this.info(`${req.method} ${req.originalUrl || req.url}`, requestMeta);
  }

  /**
   * Log API response
   */
  response(req, res, duration, meta = {}) {
    const responseMeta = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...meta
    };

    const level = res.statusCode >= 500 ? LOG_LEVELS.ERROR :
                  res.statusCode >= 400 ? LOG_LEVELS.WARN :
                  LOG_LEVELS.INFO;

    return this.formatMessage(level, `Response ${req.method} ${req.originalUrl || req.url}`, responseMeta);
  }
}

/**
 * Request logging middleware
 */
function requestLogger(logger) {
  return (req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    logger.request(req);

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;

      // Log response
      logger.response(req, res, duration, {
        bodySize: data ? data.length : 0
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Error logging middleware
 */
function errorLogger(logger) {
  return (err, req, res, next) => {
    logger.error('Unhandled error', err, {
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.body,
      params: req.params,
      query: req.query
    });

    next(err);
  };
}

/**
 * Create context-specific logger
 */
function createLogger(context) {
  return new Logger(context);
}

// Create default loggers for common contexts
const appLogger = new Logger('APP');
const dbLogger = new Logger('DATABASE');
const apiLogger = new Logger('API');

module.exports = {
  Logger,
  createLogger,
  requestLogger,
  errorLogger,
  appLogger,
  dbLogger,
  apiLogger,
  LOG_LEVELS
};
