// modules/orchestration/core/EventValidator.js
// SST v3.0 - Runtime validation for events
// Ensures events conform to expected schemas

import { Events, EventSchemas, isValidEvent } from './EventCatalog';
import BeatBus from './BeatBus';

class EventValidator {
  constructor() {
    if (EventValidator.instance) {
      return EventValidator.instance;
    }

    this.validationEnabled = import.meta.env.DEV;
    this.strictMode = false; // Throw errors vs warnings
    this.validationStats = {
      totalValidated: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      unknownEvents: new Set()
    };

    EventValidator.instance = this;
  }

  /**
   * Initialize validator and wire to BeatBus
   */
  initialize(options = {}) {
    const {
      enabled = import.meta.env.DEV,
      strict = false,
      validateUnknown = true
    } = options;

    this.validationEnabled = enabled;
    this.strictMode = strict;
    this.validateUnknownEvents = validateUnknown;

    if (this.validationEnabled) {
      this._setupMiddleware();
      console.log('🔍 EventValidator: Initialized');
    }
  }

  /**
   * Set up validation middleware
   */
  _setupMiddleware() {
    const validationMiddleware = (next) => (eventName, data, metadata) => {
      // Validate before emission
      const validation = this.validateEvent(eventName, data);
      
      if (!validation.valid && this.strictMode) {
        throw new Error(`Invalid event: ${eventName} - ${validation.errors.join(', ')}`);
      }
      
      // Call next middleware
      return next(eventName, data, metadata);
    };
    
    // Add middleware to BeatBus
    BeatBus.use(validationMiddleware);
  }

  /**
   * Validate an event
   */
  validateEvent(eventName, data) {
    this.validationStats.totalValidated++;
    
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check if event is registered
    if (!isValidEvent(eventName)) {
      if (this.validateUnknownEvents) {
        result.valid = false;
        result.errors.push(`Unknown event: ${eventName}`);
        this.validationStats.unknownEvents.add(eventName);
      } else {
        result.warnings.push(`Unknown event: ${eventName}`);
      }
    }

    // Check schema if available
    const schema = EventSchemas[eventName];
    if (schema) {
      const schemaValidation = this._validateAgainstSchema(data, schema, eventName);
      if (!schemaValidation.valid) {
        result.valid = false;
        result.errors.push(...schemaValidation.errors);
      }
      result.warnings.push(...schemaValidation.warnings);
    }

    // Update stats
    if (result.valid) {
      this.validationStats.passed++;
    } else {
      this.validationStats.failed++;
      if (this.validationEnabled) {
        console.warn(`EventValidator: Invalid event ${eventName}`, result.errors);
      }
    }
    
    this.validationStats.warnings += result.warnings.length;

    return result;
  }

  /**
   * Validate data against schema
   */
  _validateAgainstSchema(data, schema, eventName) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    Object.entries(schema).forEach(([field, type]) => {
      if (!(field in data)) {
        result.warnings.push(`Missing field '${field}' in ${eventName}`);
      } else {
        // Type check
        const actualType = typeof data[field];
        const expectedType = type.toLowerCase();
        
        if (expectedType !== 'any' && actualType !== expectedType) {
          result.valid = false;
          result.errors.push(
            `Type mismatch in ${eventName}.${field}: expected ${expectedType}, got ${actualType}`
          );
        }
      }
    });

    // Check for extra fields
    Object.keys(data).forEach(field => {
      if (!(field in schema)) {
        result.warnings.push(`Unexpected field '${field}' in ${eventName}`);
      }
    });

    return result;
  }

  /**
   * Enable/disable validation
   */
  setEnabled(enabled) {
    this.validationEnabled = enabled;
  }

  /**
   * Set strict mode
   */
  setStrictMode(strict) {
    this.strictMode = strict;
  }

  /**
   * Get validation statistics
   */
  getStats() {
    const failureRate = this.validationStats.totalValidated > 0
      ? (this.validationStats.failed / this.validationStats.totalValidated) * 100
      : 0;

    return {
      ...this.validationStats,
      failureRate: failureRate.toFixed(2) + '%',
      unknownEvents: Array.from(this.validationStats.unknownEvents)
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.validationStats = {
      totalValidated: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      unknownEvents: new Set()
    };
  }

  /**
   * Validate all registered events (for testing)
   */
  validateCatalog() {
    const report = {
      valid: true,
      issues: []
    };

    // Check for duplicate event names
    const eventValues = Object.values(Events);
    const uniqueValues = new Set(eventValues);
    
    if (eventValues.length !== uniqueValues.size) {
      report.valid = false;
      report.issues.push('Duplicate event values detected');
    }

    // Check event naming convention
    Object.entries(Events).forEach(([key, value]) => {
      // Key should be UPPER_SNAKE_CASE
      if (!/^[A-Z_]+$/.test(key)) {
        report.valid = false;
        report.issues.push(`Invalid event key format: ${key}`);
      }

      // Value should follow pattern category:action:detail
      if (!/^[a-z_]+:[a-z_]+(?::[a-z_]+)?$/.test(value)) {
        report.valid = false;
        report.issues.push(`Invalid event value format: ${value}`);
      }
    });

    // Check schemas reference valid events
    Object.keys(EventSchemas).forEach(eventKey => {
      if (!Events[eventKey]) {
        report.valid = false;
        report.issues.push(`Schema defined for non-existent event: ${eventKey}`);
      }
    });

    return report;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!EventValidator.instance) {
      EventValidator.instance = new EventValidator();
    }
    return EventValidator.instance;
  }
}

// Export singleton instance
export default EventValidator.getInstance();

// Development helpers
if (import.meta.env.DEV) {
  window.EventValidator = EventValidator.getInstance();
  
  window.validateEvent = (eventName, data) => {
    return window.EventValidator.validateEvent(eventName, data);
  };
  
  window.eventStats = () => window.EventValidator.getStats();
  
  console.log('✅ EventValidator available at window.EventValidator');
  console.log('✅ Validate: window.validateEvent("state:stage:changed", {stage: "neural"})');
}