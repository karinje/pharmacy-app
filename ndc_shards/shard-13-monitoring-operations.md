# SHARD 13: Monitoring & Operations

## Objective
Implement comprehensive monitoring, logging, error tracking, and operational dashboards.

## Dependencies
- Shard 12 (Deployment)

## Files to Create

```
src/
├── lib/
│   ├── services/
│   │   ├── analytics.service.ts         # NEW: Analytics tracking
│   │   └── error-tracking.service.ts    # NEW: Error reporting
│   └── utils/
│       └── logger.ts                    # NEW: Logging utility
└── monitoring/
    ├── sentry.config.ts                 # NEW: Sentry configuration
    └── performance.ts                   # NEW: Performance monitoring
```

## Implementation Details

### 1. Install Monitoring Tools
```bash
npm install @sentry/sveltekit firebase-admin
```

### 2. Sentry Configuration (`src/monitoring/sentry.config.ts`)
```typescript
import * as Sentry from '@sentry/sveltekit';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ]
  });
}
```

### 3. Analytics Service (`src/lib/services/analytics.service.ts`)
```typescript
import { getAnalytics, logEvent, type Analytics } from 'firebase/analytics';
import { app } from '$lib/config/firebase';
import { browser } from '$app/environment';

class AnalyticsService {
  private analytics: Analytics | null = null;

  constructor() {
    if (browser) {
      this.analytics = getAnalytics(app);
    }
  }

  /**
   * Track calculation completed
   */
  trackCalculation(data: {
    drugName: string;
    daysSupply: number;
    totalQuantity: number;
    duration: number;
  }) {
    if (!this.analytics) return;

    logEvent(this.analytics, 'calculation_completed', {
      drug_name: data.drugName,
      days_supply: data.daysSupply,
      total_quantity: data.totalQuantity,
      calculation_duration_ms: data.duration
    });
  }

  /**
   * Track user signup
   */
  trackSignup(method: string) {
    if (!this.analytics) return;
    logEvent(this.analytics, 'sign_up', { method });
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string) {
    if (!this.analytics) return;
    logEvent(this.analytics, 'page_view', { page_name: pageName });
  }

  /**
   * Track search
   */
  trackSearch(query: string) {
    if (!this.analytics) return;
    logEvent(this.analytics, 'search', { search_term: query });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>) {
    if (!this.analytics) return;
    logEvent(this.analytics, 'error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }
}

export const analyticsService = new AnalyticsService();
```

### 4. Logger Utility (`src/lib/utils/logger.ts`)
```typescript
import * as Sentry from '@sentry/sveltekit';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message, context));
    
    Sentry.addBreadcrumb({
      level: 'info',
      message,
      data: context
    });
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
    
    Sentry.addBreadcrumb({
      level: 'warning',
      message,
      data: context
    });
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(this.formatMessage('error', message, context), error);
    
    Sentry.captureException(error || new Error(message), {
      level: 'error',
      tags: {
        component: context?.component,
        action: context?.action
      },
      extra: context
    });
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string) {
    Sentry.setUser({
      id: userId,
      email
    });
  }

  /**
   * Clear user context
   */
  clearUserContext() {
    Sentry.setUser(null);
  }
}

export const logger = new Logger();
```

### 5. Performance Monitoring (`src/monitoring/performance.ts`)
```typescript
import { browser } from '$app/environment';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  /**
   * Measure function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric(name, duration);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, duration: number) {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    });

    // Log slow operations (>2 seconds)
    if (duration > 2000) {
      console.warn(`Slow operation detected: ${name} took ${duration}ms`);
    }

    // Send to analytics if available
    if (browser && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'Performance'
      });
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Monitor page load time
   */
  monitorPageLoad() {
    if (!browser) return;

    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        this.recordMetric('page_load', perfData.loadEventEnd - perfData.fetchStart);
        this.recordMetric('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart);
      }
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### 6. Cloud Function Monitoring (`functions/src/monitoring/logger.ts`)
```typescript
import * as functions from 'firebase-functions';

interface LogEntry {
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

export class FunctionLogger {
  private functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  private createLogEntry(severity: LogEntry['severity'], message: string, context?: Record<string, any>): LogEntry {
    return {
      severity,
      message,
      context: {
        function: this.functionName,
        ...context
      },
      timestamp: new Date().toISOString()
    };
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('INFO', message, context);
    functions.logger.info(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('WARNING', message, context);
    functions.logger.warn(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('ERROR', message, {
      ...context,
      error: {
        message: error?.message,
        stack: error?.stack
      }
    });
    functions.logger.error(entry);
  }
}
```

### 7. Operational Dashboard Configuration

Create a Firebase dashboard for monitoring:

1. **Performance Monitoring**
   - API response times
   - Page load times
   - Function execution times

2. **Usage Analytics**
   - Daily active users
   - Calculations per day
   - Most searched drugs
   - Error rates

3. **Cost Monitoring**
   - OpenAI API usage
   - Firebase function invocations
   - Firestore reads/writes

### 8. Alert Configuration (`monitoring/alerts.yaml`)
```yaml
# Firebase Performance Monitoring Alerts
alerts:
  - name: high_error_rate
    condition: error_rate > 5%
    duration: 5m
    notification:
      - email
      - slack

  - name: slow_api_response
    condition: p95_latency > 3s
    duration: 5m
    notification:
      - email

  - name: high_openai_cost
    condition: openai_daily_cost > $100
    duration: 1h
    notification:
      - email
      - slack

  - name: firestore_quota_exceeded
    condition: firestore_reads > 50000/day
    duration: 1h
    notification:
      - email
```

### 9. Update Root Layout for Monitoring (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { initSentry } from '$monitoring/sentry.config';
  import { performanceMonitor } from '$monitoring/performance';
  import { logger } from '$lib/utils/logger';
  import { user } from '$lib/stores/auth';
  import '../app.css';

  // Initialize monitoring
  if (browser) {
    initSentry();
    performanceMonitor.monitorPageLoad();
  }

  // Update user context when auth state changes
  $: if ($user) {
    logger.setUserContext($user.uid, $user.email || undefined);
  } else {
    logger.clearUserContext();
  }

  onMount(() => {
    logger.info('Application mounted', {
      component: 'RootLayout'
    });
  });
</script>

<slot />
```

### 10. README Monitoring Section
```markdown
## Monitoring & Operations

### Dashboards

- **Firebase Console**: https://console.firebase.google.com/project/[PROJECT_ID]
- **Sentry**: https://sentry.io/organizations/[ORG]/projects/[PROJECT]
- **Performance**: Firebase Console > Performance

### Key Metrics

- **Calculation Success Rate**: Target >95%
- **API Response Time P95**: Target <2s
- **Error Rate**: Target <3%
- **Daily Active Users**: Track growth
- **OpenAI API Cost**: Monitor daily spend

### Alerts

Configured alerts for:
- High error rates (>5%)
- Slow API responses (>3s)
- High costs (OpenAI >$100/day)
- Quota exceeded

### Logging

Logs are available in:
- Firebase Console > Functions > Logs
- Sentry for errors and exceptions
- Browser console in development

### Performance Optimization

Monitor these metrics:
- RxNorm API latency
- FDA API latency
- OpenAI API latency
- Firestore query performance
- Page load times
```

## Validation Checklist

- [ ] Sentry configured and receiving errors
- [ ] Firebase Analytics tracking events
- [ ] Performance metrics collected
- [ ] Logs structured and searchable
- [ ] Alerts configured and tested
- [ ] Dashboard accessible
- [ ] User context tracked properly
- [ ] Cost monitoring in place

## Success Criteria

✅ Complete monitoring system operational  
✅ Error tracking with Sentry working  
✅ Analytics capturing key events  
✅ Performance metrics monitored  
✅ Alerts configured  
✅ Operational dashboard accessible

---

# FINAL NOTES

## Implementation Order

Execute shards sequentially:
1. Foundation (Shard 1-2)
2. UI Layer (Shard 3-4)
3. API Integration (Shard 5-7)
4. Core Features (Shard 8-10)
5. Quality & Operations (Shard 11-13)

## Post-Implementation Tasks

After completing all shards:

1. **Security Review**
   - Audit Firestore security rules
   - Review authentication flows
   - Check API key exposure
   - Validate input sanitization

2. **Performance Optimization**
   - Analyze bundle size
   - Optimize images
   - Review caching strategies
   - Test under load

3. **Documentation**
   - Update API documentation
   - Create user guide
   - Document deployment process
   - Write troubleshooting guide

4. **Training**
   - Create demo videos
   - Prepare training materials
   - Schedule user training sessions

## Support & Maintenance

Ongoing tasks:
- Monitor error rates daily
- Review performance metrics weekly
- Update dependencies monthly
- Security patches as needed
- Feature enhancements quarterly

---

**END OF IMPLEMENTATION SHARDS**
