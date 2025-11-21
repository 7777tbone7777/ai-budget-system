# Comprehensive Logging Guidelines

## Overview

All code should include extensive logging to help with debugging, monitoring, and understanding system behavior in production.

## Log Levels

- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Recoverable issues, deprecations, unusual conditions
- **INFO**: Important business events, API requests/responses
- **DEBUG**: Detailed information for debugging (dev only)

## Usage Examples

### 1. API Endpoints

```javascript
const { createLogger } = require('./logger');
const logger = createLogger('TEMPLATES_API');

app.get('/api/templates', async (req, res) => {
  const { location, production_type } = req.query;

  logger.info('Fetching templates', {
    location,
    production_type,
    user_id: req.user?.id
  });

  try {
    const result = await pool.query(query, params);

    logger.info('Templates fetched successfully', {
      count: result.rows.length,
      location,
      execution_time_ms: Date.now() - startTime
    });

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    logger.error('Failed to fetch templates', error, {
      location,
      production_type,
      query: query.substring(0, 200)
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 2. Database Operations

```javascript
const { dbLogger } = require('./logger');

async function createBudgetGroup(productionId, groupData) {
  const startTime = Date.now();

  dbLogger.debug('Creating budget group', {
    production_id: productionId,
    group_name: groupData.name
  });

  try {
    const result = await pool.query(`
      INSERT INTO budget_groups (production_id, name, account_number)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [productionId, groupData.name, groupData.account_number]);

    const executionTime = Date.now() - startTime;

    dbLogger.info('Budget group created', {
      production_id: productionId,
      group_id: result.rows[0].id,
      execution_time_ms: executionTime
    });

    return result.rows[0];
  } catch (error) {
    dbLogger.error('Failed to create budget group', error, {
      production_id: productionId,
      group_data: groupData,
      error_code: error.code
    });

    throw error;
  }
}
```

### 3. Template Application

```javascript
app.post('/api/productions/:production_id/apply-template', async (req, res) => {
  const { production_id } = req.params;
  const { template_id, scale_to_budget } = req.body;

  logger.info('Applying template to production', {
    production_id,
    template_id,
    scale_to_budget,
    user_id: req.user?.id
  });

  const startTime = Date.now();
  let groupsCreated = 0;
  let itemsCreated = 0;

  try {
    // Validate input
    if (!template_id) {
      logger.warn('Template application attempted without template_id', {
        production_id
      });

      return res.status(400).json({
        success: false,
        error: 'template_id is required'
      });
    }

    // Get template
    logger.debug('Fetching template', { template_id });

    const templateResult = await pool.query(`
      SELECT template_data FROM budget_templates WHERE id = $1
    `, [template_id]);

    if (templateResult.rows.length === 0) {
      logger.warn('Template not found', {
        template_id,
        production_id
      });

      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const template = templateResult.rows[0].template_data;
    logger.info('Template fetched', {
      template_id,
      department_count: template.departments?.length || 0
    });

    // Apply template (with detailed logging)
    for (const [index, dept] of template.departments.entries()) {
      logger.debug('Creating department', {
        production_id,
        department_name: dept.name,
        index: index + 1,
        total: template.departments.length
      });

      try {
        const groupResult = await pool.query(`
          INSERT INTO budget_groups (production_id, name, account_number)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [production_id, dept.name, dept.account]);

        const groupId = groupResult.rows[0].id;
        groupsCreated++;

        // Create line items
        for (const item of dept.line_items || []) {
          try {
            await pool.query(`
              INSERT INTO budget_line_items (
                production_id, group_id, description, quantity, rate
              ) VALUES ($1, $2, $3, $4, $5)
            `, [production_id, groupId, item.description, item.quantity, item.rate]);

            itemsCreated++;
          } catch (itemError) {
            logger.error('Failed to create line item', itemError, {
              production_id,
              group_id: groupId,
              item_description: item.description,
              department: dept.name
            });
            // Continue with other items
          }
        }

        logger.debug('Department created', {
          production_id,
          department_name: dept.name,
          group_id: groupId,
          items_created: dept.line_items?.length || 0
        });
      } catch (deptError) {
        logger.error('Failed to create department', deptError, {
          production_id,
          department_name: dept.name,
          index: index + 1
        });
        // Continue with other departments
      }
    }

    const executionTime = Date.now() - startTime;

    logger.info('Template applied successfully', {
      production_id,
      template_id,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      execution_time_ms: executionTime,
      scale_factor: scale_to_budget ? 'applied' : 'none'
    });

    res.json({
      success: true,
      groups_created: groupsCreated,
      items_created: itemsCreated
    });
  } catch (error) {
    logger.error('Template application failed', error, {
      production_id,
      template_id,
      groups_created: groupsCreated,
      items_created: itemsCreated,
      execution_time_ms: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 4. Validation Errors

```javascript
// Log validation failures
if (!req.body.name || req.body.name.trim() === '') {
  logger.warn('Invalid input: missing name', {
    endpoint: req.path,
    body: req.body,
    user_id: req.user?.id
  });

  return res.status(400).json({
    success: false,
    error: 'Name is required'
  });
}
```

### 5. External API Calls

```javascript
logger.info('Calling external API', {
  service: 'guild_rates',
  endpoint: '/api/rates',
  params: { location, position }
});

try {
  const response = await axios.get(externalUrl, { params });

  logger.info('External API call successful', {
    service: 'guild_rates',
    status: response.status,
    response_time_ms: responseTime
  });
} catch (error) {
  logger.error('External API call failed', error, {
    service: 'guild_rates',
    endpoint: externalUrl,
    status: error.response?.status,
    error_data: error.response?.data
  });

  throw error;
}
```

### 6. Performance Monitoring

```javascript
const startTime = Date.now();

// ... operation ...

const executionTime = Date.now() - startTime;

if (executionTime > 1000) {
  logger.warn('Slow operation detected', {
    operation: 'fetch_templates',
    execution_time_ms: executionTime,
    threshold_ms: 1000
  });
}
```

## Best Practices

### DO:
- ✅ Log all errors with full context
- ✅ Log start and completion of important operations
- ✅ Include relevant IDs (production_id, user_id, etc.)
- ✅ Log execution times for performance monitoring
- ✅ Use structured logging (pass objects, not strings)
- ✅ Include user actions for audit trail
- ✅ Log validation failures
- ✅ Truncate sensitive data before logging

### DON'T:
- ❌ Log sensitive data (passwords, tokens, credit cards)
- ❌ Log entire request/response bodies (too verbose)
- ❌ Use console.log directly (use logger instead)
- ❌ Log in tight loops without throttling
- ❌ Ignore errors silently
- ❌ Log without context

## Integration with server.js

Add at the top of server.js:

```javascript
const { requestLogger, errorLogger, createLogger } = require('./logger');

// Create context-specific loggers
const appLogger = createLogger('APP');
const templateLogger = createLogger('TEMPLATES');
const budgetLogger = createLogger('BUDGETS');

// Add request/response logging middleware
app.use(requestLogger(appLogger));

// ... your routes ...

// Add error logging middleware (before global error handler)
app.use(errorLogger(appLogger));
```

## Log Output Examples

### Development (colored):
```
[2025-11-21T08:30:15.234Z] [INFO] [TEMPLATES_API] Fetching templates
{
  "location": "Atlanta",
  "production_type": "one_hour_pilot",
  "user_id": 123
}

[2025-11-21T08:30:15.456Z] [INFO] [TEMPLATES_API] Templates fetched successfully
{
  "count": 6,
  "location": "Atlanta",
  "execution_time_ms": 222
}
```

### Production (JSON for log aggregation):
```json
{
  "timestamp": "2025-11-21T08:30:15.234Z",
  "level": "INFO",
  "context": "TEMPLATES_API",
  "message": "Fetching templates",
  "location": "Atlanta",
  "production_type": "one_hour_pilot",
  "user_id": 123
}
```

## Future Enhancements

1. **External Log Aggregation**: Send logs to services like Datadog, Loggly, or CloudWatch
2. **Request ID Tracking**: Add unique IDs to trace requests across services
3. **Performance Metrics**: Track response times, database query times
4. **Error Alerts**: Automatically notify team of critical errors
5. **Log Rotation**: Prevent log files from growing too large

## Testing Logs

Add this endpoint for testing logging levels:

```javascript
app.get('/api/test-logging', (req, res) => {
  logger.debug('This is a debug message');
  logger.info('This is an info message');
  logger.warn('This is a warning message');
  logger.error('This is an error message', new Error('Test error'));

  res.json({ success: true, message: 'Check console for log output' });
});
```
