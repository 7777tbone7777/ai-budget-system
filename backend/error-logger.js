/**
 * Comprehensive Error Logging System
 * Provides structured logging for debugging and testing
 *
 * Features:
 * - Structured log format with timestamps and context
 * - Different log levels (error, warn, info, debug)
 * - Request/response logging
 * - Database query logging
 * - Performance tracking
 * - Error aggregation for testing
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment)
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// In-memory error store for testing
const errorStore = {
  errors: [],
  warnings: [],
  maxSize: 1000
};

// Log file path
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'errors.log');
const APP_LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create log directory:', e.message);
}

// Format timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Format log entry
function formatLogEntry(level, module, message, data = {}) {
  return {
    timestamp: getTimestamp(),
    level,
    module,
    message,
    ...data,
    pid: process.pid
  };
}

// Write to file
function writeToFile(filepath, entry) {
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(filepath, line);
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

// Store error for testing retrieval
function storeError(entry) {
  if (entry.level === 'ERROR') {
    errorStore.errors.push(entry);
    if (errorStore.errors.length > errorStore.maxSize) {
      errorStore.errors.shift();
    }
  } else if (entry.level === 'WARN') {
    errorStore.warnings.push(entry);
    if (errorStore.warnings.length > errorStore.maxSize) {
      errorStore.warnings.shift();
    }
  }
}

// Console output with colors
function consoleLog(entry) {
  const colors = {
    ERROR: '\x1b[31m',   // Red
    WARN: '\x1b[33m',    // Yellow
    INFO: '\x1b[36m',    // Cyan
    DEBUG: '\x1b[90m',   // Gray
    RESET: '\x1b[0m'
  };

  const color = colors[entry.level] || colors.RESET;
  const prefix = `${color}[${entry.timestamp}] [${entry.level}] [${entry.module}]${colors.RESET}`;

  if (entry.level === 'ERROR') {
    console.error(prefix, entry.message, entry.error || '', entry.stack || '');
  } else if (entry.level === 'WARN') {
    console.warn(prefix, entry.message);
  } else {
    console.log(prefix, entry.message);
  }
}

// Main logger class
class ErrorLogger {
  constructor(module) {
    this.module = module;
  }

  error(message, error = null, context = {}) {
    const entry = formatLogEntry('ERROR', this.module, message, {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      ...context
    });

    storeError(entry);
    writeToFile(ERROR_LOG_FILE, entry);
    consoleLog(entry);

    return entry;
  }

  warn(message, context = {}) {
    if (currentLevel < LOG_LEVELS.WARN) return;

    const entry = formatLogEntry('WARN', this.module, message, context);
    storeError(entry);
    writeToFile(APP_LOG_FILE, entry);
    consoleLog(entry);

    return entry;
  }

  info(message, context = {}) {
    if (currentLevel < LOG_LEVELS.INFO) return;

    const entry = formatLogEntry('INFO', this.module, message, context);
    writeToFile(APP_LOG_FILE, entry);
    consoleLog(entry);

    return entry;
  }

  debug(message, context = {}) {
    if (currentLevel < LOG_LEVELS.DEBUG) return;

    const entry = formatLogEntry('DEBUG', this.module, message, context);
    consoleLog(entry);

    return entry;
  }

  // Log API request
  request(req, context = {}) {
    this.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      ...context
    });
  }

  // Log API response
  response(req, res, data, duration) {
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(data).length
    });
  }

  // Log database query
  query(sql, params, duration, error = null) {
    if (error) {
      this.error('Database query failed', error, { sql, params, duration: `${duration}ms` });
    } else {
      this.debug('Database query', { sql: sql.substring(0, 200), duration: `${duration}ms` });
    }
  }

  // Performance timing
  startTimer(label) {
    return { label, start: Date.now() };
  }

  endTimer(timer, context = {}) {
    const duration = Date.now() - timer.start;
    this.debug(`Timer: ${timer.label}`, { duration: `${duration}ms`, ...context });
    return duration;
  }
}

// Express middleware for request/response logging
function requestLoggerMiddleware(moduleName = 'HTTP') {
  const logger = new ErrorLogger(moduleName);

  return (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.request(req);

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - start;
      logger.response(req, res, data, duration);
      return originalSend.call(this, data);
    };

    next();
  };
}

// Error handling middleware
function errorHandlerMiddleware(moduleName = 'ERROR') {
  const logger = new ErrorLogger(moduleName);

  return (err, req, res, next) => {
    logger.error(`Unhandled error: ${req.method} ${req.originalUrl}`, err, {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body
    });

    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
      errorId: Date.now().toString(36) // Unique ID for tracking
    });
  };
}

// Get stored errors (for testing endpoints)
function getStoredErrors(limit = 50) {
  return {
    errors: errorStore.errors.slice(-limit),
    warnings: errorStore.warnings.slice(-limit),
    totalErrors: errorStore.errors.length,
    totalWarnings: errorStore.warnings.length
  };
}

// Clear stored errors (for testing)
function clearStoredErrors() {
  errorStore.errors = [];
  errorStore.warnings = [];
}

// Create logger for a module
function createLogger(module) {
  return new ErrorLogger(module);
}

module.exports = {
  ErrorLogger,
  createLogger,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  getStoredErrors,
  clearStoredErrors,
  LOG_LEVELS
};
