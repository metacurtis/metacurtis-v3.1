// modules/orchestration/core/EventDebugger.js
// SST v3.0 - Visual debugger for BeatBus event flow
// Shows real-time event flow, listeners, and performance

import BeatBus from './BeatBus';
import { Events, getEventCategory } from './EventCatalog';

class EventDebugger {
  constructor() {
    if (EventDebugger.instance) {
      return EventDebugger.instance;
    }

    this.beatBus = BeatBus;
    this.debugPanel = null;
    this.isVisible = false;
    this.isPaused = false;
    
    // Event tracking
    this.eventLog = [];
    this.maxLogSize = 100;
    this.filters = {
      categories: new Set(),
      searchTerm: ''
    };
    
    // Performance tracking
    this.eventRate = 0;
    this.lastRateCheck = Date.now();
    this.eventCount = 0;
    
    EventDebugger.instance = this;
  }

  /**
   * Initialize debugger
   */
  initialize(options = {}) {
    const {
      autoShow = false,
      position = 'bottom-right'
    } = options;

    // Set up middleware for event logging
    this._setupMiddleware();
    
    // Create UI
    if (typeof window !== 'undefined') {
      this.createDebugUI(position);
      if (autoShow) {
        this.show();
      }
    }

    if (import.meta.env.DEV) {
      console.log('🎵 EventDebugger: Initialized');
    }
  }

  /**
   * Set up event logging middleware
   */
  _setupMiddleware() {
    const loggingMiddleware = (next) => (eventName, data, metadata) => {
      // Log event if not paused
      if (!this.isPaused) {
        this._logEvent(eventName, data, metadata);
      }
      
      // Call next middleware
      return next(eventName, data, metadata);
    };
    
    // Add middleware to BeatBus
    this.beatBus.use(loggingMiddleware);
  }

  /**
   * Log an event
   */
  _logEvent(eventName, data, metadata) {
    const event = {
      name: eventName,
      data,
      metadata,
      timestamp: Date.now(),
      category: getEventCategory(eventName),
      listeners: this.beatBus.getListenerCount(eventName)
    };

    this.eventLog.unshift(event);
    
    // Limit log size
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.pop();
    }

    // Update event rate
    this.eventCount++;
    const now = Date.now();
    if (now - this.lastRateCheck > 1000) {
      this.eventRate = this.eventCount;
      this.eventCount = 0;
      this.lastRateCheck = now;
    }

    // Update UI if visible
    if (this.isVisible) {
      this._updateEventList();
    }
  }

  /**
   * Create debug UI
   */
  createDebugUI(position) {
    if (this.debugPanel) return;

    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'beatbus-debugger';
    this.debugPanel.innerHTML = `
      <style>
        #beatbus-debugger {
          position: fixed;
          ${position === 'bottom-right' ? 'bottom: 10px; right: 10px;' : 'bottom: 10px; left: 10px;'}
          width: 450px;
          height: 500px;
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #00ff00;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #00ff00;
          display: none;
          flex-direction: column;
          z-index: 999998;
        }
        
        #beatbus-debugger.visible {
          display: flex;
        }
        
        #beatbus-debugger .header {
          padding: 10px;
          border-bottom: 1px solid #00ff00;
          background: rgba(0, 255, 0, 0.1);
        }
        
        #beatbus-debugger h3 {
          margin: 0;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #beatbus-debugger .controls {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        
        #beatbus-debugger button {
          background: #00ff00;
          color: #000;
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
        }
        
        #beatbus-debugger button:hover {
          background: #00cc00;
        }
        
        #beatbus-debugger button.active {
          background: #ff0000;
          color: #fff;
        }
        
        #beatbus-debugger input {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 4px;
          font-family: inherit;
          font-size: 11px;
        }
        
        #beatbus-debugger .stats {
          padding: 10px;
          border-bottom: 1px solid #00ff00;
          display: flex;
          gap: 20px;
          font-size: 10px;
        }
        
        #beatbus-debugger .stat {
          display: flex;
          flex-direction: column;
        }
        
        #beatbus-debugger .stat-value {
          font-size: 16px;
          font-weight: bold;
        }
        
        #beatbus-debugger .event-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }
        
        #beatbus-debugger .event {
          margin-bottom: 8px;
          padding: 8px;
          background: rgba(0, 255, 0, 0.05);
          border-left: 3px solid #00ff00;
          cursor: pointer;
        }
        
        #beatbus-debugger .event:hover {
          background: rgba(0, 255, 0, 0.1);
        }
        
        #beatbus-debugger .event.expanded {
          background: rgba(0, 255, 0, 0.15);
        }
        
        #beatbus-debugger .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #beatbus-debugger .event-name {
          font-weight: bold;
          color: #00ff00;
        }
        
        #beatbus-debugger .event-meta {
          font-size: 10px;
          color: #00aa00;
        }
        
        #beatbus-debugger .event-data {
          margin-top: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.5);
          font-size: 10px;
          white-space: pre-wrap;
          display: none;
        }
        
        #beatbus-debugger .event.expanded .event-data {
          display: block;
        }
        
        #beatbus-debugger .category-filter {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        
        #beatbus-debugger .category-tag {
          padding: 2px 6px;
          background: rgba(0, 255, 0, 0.2);
          border: 1px solid #00ff00;
          cursor: pointer;
          font-size: 10px;
        }
        
        #beatbus-debugger .category-tag.active {
          background: #00ff00;
          color: #000;
        }
      </style>
      
      <div class="header">
        <h3>
          <span>🎵 BeatBus Event Debugger</span>
          <button onclick="window.eventDebugger.hide()">✕</button>
        </h3>
        
        <div class="controls">
          <button id="pause-btn" onclick="window.eventDebugger.togglePause()">
            ${this.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button onclick="window.eventDebugger.clear()">Clear</button>
          <button onclick="window.eventDebugger.exportLog()">Export</button>
          <input 
            type="text" 
            placeholder="Filter events..." 
            onkeyup="window.eventDebugger.setFilter(this.value)"
          />
        </div>
        
        <div class="category-filter" id="category-filter">
          <!-- Categories will be added dynamically -->
        </div>
      </div>
      
      <div class="stats">
        <div class="stat">
          <span class="stat-value" id="event-rate">0</span>
          <span>events/sec</span>
        </div>
        <div class="stat">
          <span class="stat-value" id="total-events">0</span>
          <span>total</span>
        </div>
        <div class="stat">
          <span class="stat-value" id="listener-count">0</span>
          <span>listeners</span>
        </div>
      </div>
      
      <div class="event-list" id="event-list">
        <!-- Events will be added here -->
      </div>
    `;

    document.body.appendChild(this.debugPanel);
    
    // Update categories
    this._updateCategoryFilter();
  }

  /**
   * Update category filter UI
   */
  _updateCategoryFilter() {
    const container = document.getElementById('category-filter');
    if (!container) return;

    const categories = new Set();
    this.eventLog.forEach(event => {
      if (event.category) categories.add(event.category);
    });

    container.innerHTML = Array.from(categories).map(cat => `
      <span 
        class="category-tag ${this.filters.categories.has(cat) ? 'active' : ''}"
        onclick="window.eventDebugger.toggleCategory('${cat}')"
      >
        ${cat}
      </span>
    `).join('');
  }

  /**
   * Update event list UI
   */
  _updateEventList() {
    const list = document.getElementById('event-list');
    if (!list) return;

    // Update stats
    document.getElementById('event-rate').textContent = this.eventRate;
    document.getElementById('total-events').textContent = this.beatBus.getMetrics().eventsEmitted;
    document.getElementById('listener-count').textContent = this.beatBus.getListenerCount();

    // Filter events
    const filteredEvents = this.eventLog.filter(event => {
      // Category filter
      if (this.filters.categories.size > 0 && !this.filters.categories.has(event.category)) {
        return false;
      }
      
      // Search filter
      if (this.filters.searchTerm) {
        const searchLower = this.filters.searchTerm.toLowerCase();
        return event.name.toLowerCase().includes(searchLower) ||
               JSON.stringify(event.data).toLowerCase().includes(searchLower);
      }
      
      return true;
    });

    // Render events
    list.innerHTML = filteredEvents.slice(0, 50).map((event, index) => `
      <div class="event" onclick="window.eventDebugger.toggleEvent(${index})">
        <div class="event-header">
          <span class="event-name">${event.name}</span>
          <span class="event-meta">
            ${new Date(event.timestamp).toLocaleTimeString()} | 
            ${event.listeners} listeners
          </span>
        </div>
        <div class="event-data">
${JSON.stringify(event.data, null, 2)}

Metadata:
${JSON.stringify(event.metadata, null, 2)}
        </div>
      </div>
    `).join('');
  }

  /**
   * Toggle event details
   */
  toggleEvent(index) {
    const events = document.querySelectorAll('.event');
    if (events[index]) {
      events[index].classList.toggle('expanded');
    }
  }

  /**
   * Toggle category filter
   */
  toggleCategory(category) {
    if (this.filters.categories.has(category)) {
      this.filters.categories.delete(category);
    } else {
      this.filters.categories.add(category);
    }
    this._updateCategoryFilter();
    this._updateEventList();
  }

  /**
   * Set search filter
   */
  setFilter(searchTerm) {
    this.filters.searchTerm = searchTerm;
    this._updateEventList();
  }

  /**
   * Toggle pause
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('pause-btn');
    if (btn) {
      btn.textContent = this.isPaused ? 'Resume' : 'Pause';
      btn.classList.toggle('active', this.isPaused);
    }
  }

  /**
   * Clear event log
   */
  clear() {
    this.eventLog = [];
    this._updateEventList();
    this._updateCategoryFilter();
  }

  /**
   * Export event log
   */
  exportLog() {
    const data = {
      timestamp: Date.now(),
      events: this.eventLog,
      metrics: this.beatBus.getMetrics()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beatbus-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Show debugger
   */
  show() {
    if (this.debugPanel) {
      this.debugPanel.classList.add('visible');
      this.isVisible = true;
      this._updateEventList();
      this._updateCategoryFilter();
    }
  }

  /**
   * Hide debugger
   */
  hide() {
    if (this.debugPanel) {
      this.debugPanel.classList.remove('visible');
      this.isVisible = false;
    }
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!EventDebugger.instance) {
      EventDebugger.instance = new EventDebugger();
    }
    return EventDebugger.instance;
  }
}

// Export singleton
export default EventDebugger.getInstance();

// Development helpers
if (import.meta.env.DEV) {
  window.EventDebugger = EventDebugger;
  window.eventDebugger = EventDebugger.getInstance();
  
  // DO NOT auto-initialize - let the main initialization handle it
  console.log('🎵 EventDebugger available at window.eventDebugger');
}