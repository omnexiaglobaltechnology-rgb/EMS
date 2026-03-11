# Time & Activity Tracking API Documentation

## Overview
Complete time and activity tracking system for monitoring user productivity, page visits, idle time, and focus.

## Features Implemented ✅

### 1. Login/Logout Time Tracking
- Automatic login time recording on user authentication
- Manual logout endpoint to record session end
- Session duration calculation
- IP address and user agent tracking

### 2. Page Activity Logging
- Page visit tracking with duration
- Activity type classification
- Bulk activity logging support
- Historical activity queries

### 3. Idle Detection
- Idle start/end logging
- Idle duration tracking
- Automatic idle time aggregation

### 4. Focus Loss Detection
- Focus loss/gain event tracking
- Window/tab switch detection support
- Focus consistency metrics

### 5. Productivity Score Logic
- Multi-factor productivity calculation
  - Active time ratio (40% weight)
  - Focus time ratio (30% weight)
  - Idle time penalty (20% weight)
  - Focus loss penalty (10% weight)
  - Task completion bonus
  - Submission bonus
- Daily productivity score (0-100)
- Real-time productivity monitoring

## API Endpoints

### Time Tracking

#### Get Time Logs
```
GET /api/tracking/time
Query Parameters:
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)
  - limit: number (optional, default: 100)

Response:
{
  "logs": [...],
  "totalDuration": 3600000,
  "totalDurationHours": "1.00",
  "totalSessions": 5
}
```

#### Get Active Session
```
GET /api/tracking/time/active

Response:
{
  "activeSession": {
    "loginTime": "2026-03-07T10:00:00.000Z",
    "currentDuration": 3600000,
    "currentDurationHours": "1.00"
  },
  "isActive": true
}
```

#### Record Logout
```
POST /api/tracking/time/logout

Response:
{
  "message": "Logout recorded successfully",
  "session": {
    "loginTime": "2026-03-07T10:00:00.000Z",
    "logoutTime": "2026-03-07T11:00:00.000Z",
    "duration": 3600000,
    "durationHours": "1.00"
  }
}
```

### Page Activity

#### Log Page Visit
```
POST /api/tracking/page-activity
Body:
{
  "pagePath": "/dashboard",
  "pageTitle": "Dashboard",
  "duration": 60000  // in milliseconds
}

Response:
{
  "message": "Page visit logged",
  "activity": {...}
}
```

#### Get Page Activity
```
GET /api/tracking/page-activity
Query Parameters:
  - activityType: string (optional: page_visit, idle_start, idle_end, focus_loss, focus_gain)
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)
  - limit: number (optional, default: 100)

Response:
{
  "activities": [...],
  "count": 10
}
```

#### Bulk Log Activities
```
POST /api/tracking/page-activity/bulk
Body:
{
  "activities": [
    {
      "activityType": "page_visit",
      "pagePath": "/tasks",
      "pageTitle": "Tasks",
      "duration": 30000
    },
    ...
  ]
}

Response:
{
  "message": "5 activities logged",
  "activities": [...]
}
```

### Idle & Focus Detection

#### Log Idle Detection
```
POST /api/tracking/idle
Body:
{
  "status": "start"  // or "end"
  "duration": 300000  // required for "end", in milliseconds
}

Response:
{
  "message": "Idle start logged",
  "activity": {...}
}
```

#### Log Focus Loss/Gain
```
POST /api/tracking/focus
Body:
{
  "status": "loss",  // or "gain"
  "pagePath": "/dashboard"
}

Response:
{
  "message": "Focus loss logged",
  "activity": {...}
}
```

### Productivity Analytics

#### Get Productivity Analytics
```
GET /api/tracking/productivity
Query Parameters:
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)
  - limit: number (optional, default: 30 days)

Response:
{
  "scores": [
    {
      "date": "2026-03-07T00:00:00.000Z",
      "totalActiveTime": 28800000,
      "totalIdleTime": 3600000,
      "totalFocusTime": 21600000,
      "pageVisits": 45,
      "focusLossCount": 12,
      "productivityScore": 78,
      "tasksCompleted": 5,
      "submissionsCount": 2
    },
    ...
  ],
  "analytics": {
    "averageProductivityScore": 75,
    "averageActiveTime": 25200000,
    "totalDays": 30
  }
}
```

#### Get Real-Time Productivity
```
GET /api/tracking/productivity/realtime

Response:
{
  "todayScore": {
    "date": "2026-03-07T00:00:00.000Z",
    "productivityScore": 78,
    ...
  },
  "activeSession": {...},
  "recentActivities": [...],
  "isActive": true
}
```

#### Calculate Productivity Score
```
POST /api/tracking/productivity/calculate
Query Parameters:
  - date: ISO date string (optional, defaults to today)

Response:
{
  "message": "Productivity score calculated",
  "score": {...}
}
```

## Models

### TimeLog
- userId (ref: User)
- loginTime
- logoutTime
- duration (calculated)
- isActive (boolean)
- ipAddress
- userAgent

### ActivityLog
- userId (ref: User)
- sessionId (ref: TimeLog)
- activityType (enum)
- pagePath
- pageTitle
- duration
- metadata
- timestamp

### ProductivityScore
- userId (ref: User)
- date
- totalActiveTime
- totalIdleTime
- totalFocusTime
- pageVisits
- focusLossCount
- productivityScore (0-100, auto-calculated)
- tasksCompleted
- submissionsCount

## Frontend Integration Guide

### 1. Track Login (Automatic)
Login tracking is automatic on successful authentication.

### 2. Track Page Visits
```javascript
// Track when user navigates to a new page
const trackPageVisit = async (pagePath, pageTitle) => {
  const startTime = Date.now();
  
  // When leaving the page
  const duration = Date.now() - startTime;
  
  await fetch('/api/tracking/page-activity', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pagePath, pageTitle, duration })
  });
};
```

### 3. Implement Idle Detection
```javascript
let idleTimeout;
let idleStartTime;
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

const resetIdleTimer = () => {
  clearTimeout(idleTimeout);
  
  if (idleStartTime) {
    // User became active - log idle end
    const idleDuration = Date.now() - idleStartTime;
    fetch('/api/tracking/idle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'end', duration: idleDuration })
    });
    idleStartTime = null;
  }
  
  idleTimeout = setTimeout(() => {
    // User became idle
    idleStartTime = Date.now();
    fetch('/api/tracking/idle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'start' })
    });
  }, IDLE_THRESHOLD);
};

// Attach to user activity events
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keypress', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);
document.addEventListener('scroll', resetIdleTimer);
```

### 4. Implement Focus Loss Detection
```javascript
window.addEventListener('blur', () => {
  fetch('/api/tracking/focus', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      status: 'loss',
      pagePath: window.location.pathname 
    })
  });
});

window.addEventListener('focus', () => {
  fetch('/api/tracking/focus', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      status: 'gain',
      pagePath: window.location.pathname 
    })
  });
});
```

### 5. Track Logout
```javascript
const handleLogout = async () => {
  await fetch('/api/tracking/time/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Then proceed with regular logout
  // Clear tokens, redirect, etc.
};
```

## Productivity Score Calculation

The productivity score (0-100) is calculated using:

1. **Active Time Ratio (40%)**: Percentage of time user was active vs idle
2. **Focus Time Ratio (30%)**: Time spent focused on tasks/pages
3. **Idle Penalty (20%)**: Reduction based on idle time
4. **Focus Loss Penalty (10%)**: Penalty for frequent context switching (max 30%)
5. **Task Completion Bonus**: +2 points per task (max +10)
6. **Submission Bonus**: +3 points per submission (max +10)

Maximum score: 100

## Authentication

All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Notes

- All timestamps are in ISO 8601 format
- Durations are in milliseconds
- Productivity scores are calculated daily and cached
- Time logs automatically calculate duration on logout
- Sessions are linked to activity logs via sessionId
