/**
 * Conditional Automation Service
 * Handles workflow triggers based on calendar, location, weather conditions
 */

interface AutomationCondition {
  type: 'calendar' | 'location' | 'weather' | 'time' | 'combined';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  field?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  conditions: AutomationCondition[];
  logicOperator: 'AND' | 'OR';
  workflowId: string;
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
}

interface ContextData {
  calendar?: {
    upcomingEvents: any[];
    currentEvent?: any;
    nextEvent?: any;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  time?: {
    hour: number;
    minute: number;
    dayOfWeek: number;
    dayOfMonth: number;
    month: number;
  };
}

class ConditionalAutomationService {
  private rules: AutomationRule[] = [];

  constructor() {
    this.loadAutomationRules();
  }

  /**
   * Load automation rules from storage
   */
  private loadAutomationRules() {
    // TODO: Load from database or localStorage
    this.rules = [
      {
        id: 'morning-weather-alert',
        name: 'Morning Weather Alert',
        description: 'Send weather update if temperature is below 15°C at 7 AM',
        conditions: [
          {
            type: 'time',
            operator: 'equals',
            value: { hour: 7, minute: 0 }
          },
          {
            type: 'weather',
            operator: 'less_than',
            value: 15,
            field: 'temperature'
          }
        ],
        logicOperator: 'AND',
        workflowId: 'weather-alert-workflow',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'meeting-prep-auto',
        name: 'Meeting Preparation',
        description: 'Prepare meeting materials 30 minutes before important meetings',
        conditions: [
          {
            type: 'calendar',
            operator: 'contains',
            value: ['important', 'board', 'client', 'interview'],
            field: 'title'
          }
        ],
        logicOperator: 'AND',
        workflowId: 'meeting-prep-workflow',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'location-expense-tracker',
        name: 'Location-based Expense Tracking',
        description: 'Enable expense tracking when at shopping locations',
        conditions: [
          {
            type: 'location',
            operator: 'contains',
            value: ['mall', 'store', 'market', 'shop'],
            field: 'address'
          }
        ],
        logicOperator: 'AND',
        workflowId: 'location-expense-workflow',
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  /**
   * Check all automation rules against current context
   */
  async checkAutomationRules(context: ContextData): Promise<string[]> {
    const triggeredWorkflows: string[] = [];

    for (const rule of this.rules) {
      if (!rule.isActive) continue;

      if (await this.evaluateRule(rule, context)) {
        triggeredWorkflows.push(rule.workflowId);
        
        // Update last triggered time
        rule.lastTriggered = new Date();
        
        console.log(`🔥 Automation rule triggered: ${rule.name}`);
      }
    }

    return triggeredWorkflows;
  }

  /**
   * Evaluate a single automation rule
   */
  private async evaluateRule(rule: AutomationRule, context: ContextData): Promise<boolean> {
    const conditionResults: boolean[] = [];

    for (const condition of rule.conditions) {
      const result = await this.evaluateCondition(condition, context);
      conditionResults.push(result);
    }

    // Apply logic operator
    if (rule.logicOperator === 'AND') {
      return conditionResults.every(result => result);
    } else {
      return conditionResults.some(result => result);
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(condition: AutomationCondition, context: ContextData): Promise<boolean> {
    let contextValue: any;

    // Get the relevant context value
    switch (condition.type) {
      case 'calendar':
        contextValue = this.getCalendarValue(condition, context.calendar);
        break;
      case 'location':
        contextValue = this.getLocationValue(condition, context.location);
        break;
      case 'weather':
        contextValue = this.getWeatherValue(condition, context.weather);
        break;
      case 'time':
        contextValue = this.getTimeValue(condition, context.time);
        break;
      default:
        return false;
    }

    // Apply operator
    return this.applyOperator(contextValue, condition.operator, condition.value);
  }

  /**
   * Get calendar-related value
   */
  private getCalendarValue(condition: AutomationCondition, calendar?: ContextData['calendar']): any {
    if (!calendar || !condition.field) return null;

    switch (condition.field) {
      case 'title':
        return calendar.upcomingEvents?.map(event => event.title || event.summary) || [];
      case 'upcoming_count':
        return calendar.upcomingEvents?.length || 0;
      case 'has_current_event':
        return !!calendar.currentEvent;
      case 'next_event_in_minutes':
        if (calendar.nextEvent?.start) {
          const eventTime = new Date(calendar.nextEvent.start.dateTime || calendar.nextEvent.start.date);
          const now = new Date();
          return Math.floor((eventTime.getTime() - now.getTime()) / (1000 * 60));
        }
        return null;
      default:
        return null;
    }
  }

  /**
   * Get location-related value
   */
  private getLocationValue(condition: AutomationCondition, location?: ContextData['location']): any {
    if (!location || !condition.field) return null;

    switch (condition.field) {
      case 'address':
        return location.address?.toLowerCase() || '';
      case 'city':
        return location.city?.toLowerCase() || '';
      case 'country':
        return location.country?.toLowerCase() || '';
      case 'coordinates':
        return [location.latitude, location.longitude];
      default:
        return null;
    }
  }

  /**
   * Get weather-related value
   */
  private getWeatherValue(condition: AutomationCondition, weather?: ContextData['weather']): any {
    if (!weather || !condition.field) return null;

    switch (condition.field) {
      case 'temperature':
        return weather.temperature;
      case 'condition':
        return weather.condition?.toLowerCase() || '';
      case 'humidity':
        return weather.humidity;
      case 'wind_speed':
        return weather.windSpeed;
      default:
        return null;
    }
  }

  /**
   * Get time-related value
   */
  private getTimeValue(condition: AutomationCondition, time?: ContextData['time']): any {
    if (!time) {
      const now = new Date();
      time = {
        hour: now.getHours(),
        minute: now.getMinutes(),
        dayOfWeek: now.getDay(),
        dayOfMonth: now.getDate(),
        month: now.getMonth() + 1
      };
    }

    if (condition.value?.hour !== undefined && condition.value?.minute !== undefined) {
      return { hour: time.hour, minute: time.minute };
    }

    return time;
  }

  /**
   * Apply comparison operator
   */
  private applyOperator(contextValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        if (typeof contextValue === 'object' && typeof expectedValue === 'object') {
          return JSON.stringify(contextValue) === JSON.stringify(expectedValue);
        }
        return contextValue === expectedValue;

      case 'not_equals':
        return contextValue !== expectedValue;

      case 'greater_than':
        return typeof contextValue === 'number' && contextValue > expectedValue;

      case 'less_than':
        return typeof contextValue === 'number' && contextValue < expectedValue;

      case 'contains':
        if (Array.isArray(contextValue) && Array.isArray(expectedValue)) {
          return expectedValue.some(expected => 
            contextValue.some(actual => 
              typeof actual === 'string' && actual.toLowerCase().includes(expected.toLowerCase())
            )
          );
        } else if (typeof contextValue === 'string' && Array.isArray(expectedValue)) {
          return expectedValue.some(expected => 
            contextValue.toLowerCase().includes(expected.toLowerCase())
          );
        } else if (typeof contextValue === 'string' && typeof expectedValue === 'string') {
          return contextValue.toLowerCase().includes(expectedValue.toLowerCase());
        }
        return false;

      case 'in_range':
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          return contextValue >= expectedValue[0] && contextValue <= expectedValue[1];
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Add new automation rule
   */
  addAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date()
    };

    this.rules.push(newRule);
    this.saveAutomationRules();
    
    return newRule;
  }

  /**
   * Update automation rule
   */
  updateAutomationRule(id: string, updates: Partial<AutomationRule>): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === id);
    
    if (ruleIndex === -1) return false;
    
    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    this.saveAutomationRules();
    
    return true;
  }

  /**
   * Delete automation rule
   */
  deleteAutomationRule(id: string): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === id);
    
    if (ruleIndex === -1) return false;
    
    this.rules.splice(ruleIndex, 1);
    this.saveAutomationRules();
    
    return true;
  }

  /**
   * Get all automation rules
   */
  getAutomationRules(): AutomationRule[] {
    return [...this.rules];
  }

  /**
   * Get context data from various sources
   */
  async gatherContextData(): Promise<ContextData> {
    const context: ContextData = {};

    try {
      // Get calendar data
      const calendarResponse = await fetch('/api/calendar/events');
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        if (calendarData.success) {
          context.calendar = {
            upcomingEvents: calendarData.data || [],
            currentEvent: this.getCurrentEvent(calendarData.data),
            nextEvent: this.getNextEvent(calendarData.data)
          };
        }
      }

      // Get weather data
      const weatherResponse = await fetch('/api/weather?q=muscat');
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        if (weatherData.success) {
          context.weather = {
            temperature: weatherData.data.current.temperature_c,
            condition: weatherData.data.current.condition,
            humidity: weatherData.data.current.humidity,
            windSpeed: weatherData.data.current.wind_kph
          };
        }
      }

      // Get location data (would need geolocation API)
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }).catch(() => null);

        if (position) {
          context.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      }

      // Add current time
      const now = new Date();
      context.time = {
        hour: now.getHours(),
        minute: now.getMinutes(),
        dayOfWeek: now.getDay(),
        dayOfMonth: now.getDate(),
        month: now.getMonth() + 1
      };

    } catch (error) {
      console.error('Error gathering context data:', error);
    }

    return context;
  }

  /**
   * Save automation rules (would save to database)
   */
  private saveAutomationRules() {
    // TODO: Save to database
    console.log('💾 Automation rules saved');
  }

  /**
   * Get current event from calendar data
   */
  private getCurrentEvent(events: any[]): any | null {
    const now = new Date();
    
    return events.find(event => {
      if (!event.start?.dateTime || !event.end?.dateTime) return false;
      
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      
      return now >= start && now <= end;
    }) || null;
  }

  /**
   * Get next upcoming event
   */
  private getNextEvent(events: any[]): any | null {
    const now = new Date();
    
    const upcomingEvents = events
      .filter(event => {
        if (!event.start?.dateTime) return false;
        const start = new Date(event.start.dateTime);
        return start > now;
      })
      .sort((a, b) => {
        const startA = new Date(a.start.dateTime);
        const startB = new Date(b.start.dateTime);
        return startA.getTime() - startB.getTime();
      });
    
    return upcomingEvents[0] || null;
  }
}

export const conditionalAutomation = new ConditionalAutomationService();
export type { AutomationRule, AutomationCondition, ContextData };