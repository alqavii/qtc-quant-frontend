# Health & Status Endpoints Implementation

**Date:** October 15, 2025  
**Status:** ✅ Complete and Documented

---

## 📋 Summary

Implemented two new critical endpoints for system and strategy health monitoring:

1. **System-Wide Health Check** - `/api/v1/status` (public)
2. **Team Execution Health** - `/api/v1/team/{team_id}/execution-health` (requires API key)

---

## 🌐 1. System Status Endpoint

### **GET** `/api/v1/status`

**Purpose:** Public system health monitoring

**Authentication:** None required (public)

**Rate Limit:** 120 requests/minute

### What It Provides:

✅ **Market Status**
- Is market currently open?
- Trading vs closed status

✅ **Orchestrator Status**
- Is trading engine running?
- Last heartbeat timestamp
- Execution frequency (60 seconds)
- Teams loaded vs teams active

✅ **Data Feed Status**
- Last data update time
- Seconds since last update
- Feed health (healthy/delayed/stale)
- Symbols being tracked

### Response:
```json
{
  "status": "operational",
  "timestamp": "2025-10-15T15:42:30+00:00",
  "market": {
    "is_open": true,
    "status": "trading"
  },
  "orchestrator": {
    "running": true,
    "last_heartbeat": "2025-10-15T15:42:00+00:00",
    "execution_frequency_seconds": 60,
    "teams_loaded": 9,
    "teams_active": 9
  },
  "data_feed": {
    "last_update": "2025-10-15T15:42:00+00:00",
    "seconds_since_update": 30,
    "status": "healthy",
    "symbols_tracked": 9
  }
}
```

### Use Cases:
- 🎯 Frontend status banner
- 📊 System health monitoring
- 🚨 Alerting and uptime tracking
- 🔍 Troubleshooting (market closed vs system down)

---

## 👤 2. Team Execution Health Endpoint

### **GET** `/api/v1/team/{team_id}/execution-health`

**Purpose:** Detailed strategy execution monitoring

**Authentication:** Requires team API key

**Rate Limit:** 60 requests/minute

### What It Provides:

✅ **Strategy Information**
- Entry point and repo path
- Current status (active/idle/error)
- Last uploaded timestamp
- run_24_7 configuration

✅ **Execution Statistics**
- Is actively executing now?
- Last execution timestamp
- Total executions today
- Success vs failed count
- Success rate percentage

✅ **Error Tracking**
- Total error count
- Timeout count (critical!)
- Last error details
- Consecutive failures

✅ **Performance Monitoring**
- Average execution time (ms)
- Approaching timeout warning
- Timeout risk level (low/medium/high)
- Timeout limit (5 seconds)

✅ **Trading Activity**
- Total trades today
- Signal generation rate

### Response:
```json
{
  "team_id": "admin",
  "timestamp": "2025-10-15T15:45:00+00:00",
  "strategy": {
    "entry_point": "strategy:Strategy",
    "repo_path": "/opt/qtc/external_strategies/admin",
    "status": "active",
    "last_uploaded": "2025-10-14T16:50:00+00:00",
    "run_24_7": false
  },
  "execution": {
    "is_active": true,
    "last_execution": "2025-10-15T15:44:00+00:00",
    "seconds_since_last": 35,
    "total_executions_today": 157,
    "successful_executions": 155,
    "failed_executions": 2,
    "success_rate_percentage": 98.73
  },
  "errors": {
    "error_count": 1,
    "timeout_count": 1,
    "last_error": {
      "timestamp": "2025-10-15T14:05:00+00:00",
      "error_type": "TimeoutError",
      "message": "Strategy execution exceeded 5 seconds"
    }
  },
  "performance": {
    "avg_execution_time_ms": 125,
    "approaching_timeout": false,
    "timeout_risk": "low",
    "timeout_limit_seconds": 5
  },
  "trading": {
    "total_trades_today": 52,
    "signal_rate_percentage": 33.12
  }
}
```

### Use Cases:
- 🎯 Strategy health dashboard
- ⚠️ Timeout warning system
- 📊 Success rate monitoring
- 🔍 Debug execution issues
- ⏱️ Performance optimization
- 📅 Track strategy version (last_uploaded)

---

## 🎨 Frontend Integration Examples

### System Status Banner

```jsx
function SystemStatusBanner() {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const fetchStatus = () => {
      fetch('https://api.qtcq.xyz/api/v1/status')
        .then(res => res.json())
        .then(setStatus);
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);
  
  if (!status) return null;
  
  return (
    <div className={`banner ${status.status}`}>
      <span className={status.market.is_open ? 'green' : 'red'}>
        {status.market.is_open ? '🟢 Market Open' : '🔴 Market Closed'}
      </span>
      <span className={status.orchestrator.running ? 'green' : 'red'}>
        {status.orchestrator.running ? '✅ Trading Active' : '⚠️ Trading Paused'}
      </span>
      <span>
        {status.orchestrator.teams_active}/{status.orchestrator.teams_loaded} teams active
      </span>
      <span className={status.data_feed.status === 'healthy' ? 'green' : 'yellow'}>
        Feed: {status.data_feed.seconds_since_update}s ago
      </span>
    </div>
  );
}
```

### Strategy Health Monitor

```jsx
function StrategyHealthMonitor({ teamId, apiKey }) {
  const [health, setHealth] = useState(null);
  
  useEffect(() => {
    const fetchHealth = () => {
      fetch(`https://api.qtcq.xyz/api/v1/team/${teamId}/execution-health?key=${apiKey}`)
        .then(res => res.json())
        .then(setHealth);
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Every minute
    return () => clearInterval(interval);
  }, [teamId, apiKey]);
  
  if (!health) return <div>Loading health data...</div>;
  
  const getStatusColor = (status) => {
    if (status === 'active') return 'green';
    if (status === 'idle') return 'yellow';
    return 'red';
  };
  
  const getRiskColor = (risk) => {
    if (risk === 'low') return 'green';
    if (risk === 'medium') return 'yellow';
    return 'red';
  };
  
  return (
    <div className="health-dashboard">
      <h3>Strategy Health</h3>
      
      <div className={`status-indicator ${getStatusColor(health.strategy.status)}`}>
        Status: {health.strategy.status.toUpperCase()}
      </div>
      
      <div className="metrics-grid">
        <div className="metric">
          <label>Success Rate</label>
          <value className={health.execution.success_rate_percentage > 95 ? 'green' : 'yellow'}>
            {health.execution.success_rate_percentage.toFixed(1)}%
          </value>
          <small>{health.execution.successful_executions}/{health.execution.total_executions_today} executions</small>
        </div>
        
        <div className="metric">
          <label>Execution Time</label>
          <value>{health.performance.avg_execution_time_ms}ms</value>
          <small>Limit: 5000ms</small>
        </div>
        
        <div className={`metric ${getRiskColor(health.performance.timeout_risk)}`}>
          <label>Timeout Risk</label>
          <value>{health.performance.timeout_risk.toUpperCase()}</value>
          <small>{health.errors.timeout_count} timeouts</small>
        </div>
        
        <div className="metric">
          <label>Signal Rate</label>
          <value>{health.trading.signal_rate_percentage.toFixed(1)}%</value>
          <small>{health.trading.total_trades_today} trades today</small>
        </div>
      </div>
      
      {health.errors.last_error && (
        <div className="alert error">
          <strong>Last Error:</strong> {health.errors.last_error.error_type}
          <br/>
          <small>{health.errors.last_error.message}</small>
          <br/>
          <small>{new Date(health.errors.last_error.timestamp).toLocaleString()}</small>
        </div>
      )}
      
      {health.performance.approaching_timeout && (
        <div className="alert warning">
          ⚠️ Your strategy is approaching the 5-second timeout limit!
          Consider optimizing your code.
        </div>
      )}
      
      <div className="metadata">
        <small>Last uploaded: {new Date(health.strategy.last_uploaded).toLocaleString()}</small>
        <br/>
        <small>Last execution: {health.execution.seconds_since_last}s ago</small>
      </div>
    </div>
  );
}
```

### Timeout Warning System

```jsx
function TimeoutWarning({ health }) {
  if (health.performance.timeout_risk === 'low') {
    return null; // No warning needed
  }
  
  return (
    <div className={`timeout-warning ${health.performance.timeout_risk}`}>
      {health.performance.timeout_risk === 'high' ? (
        <>
          <h4>🚨 Critical: Multiple Timeouts Detected</h4>
          <p>
            Your strategy has timed out {health.errors.timeout_count} times today.
            Each execution must complete within 5 seconds.
          </p>
          <strong>Recommendations:</strong>
          <ul>
            <li>Reduce data processing complexity</li>
            <li>Cache expensive calculations</li>
            <li>Limit API calls in strategy</li>
            <li>Profile your code to find bottlenecks</li>
          </ul>
        </>
      ) : (
        <>
          <h4>⚠️ Warning: Timeout Detected</h4>
          <p>
            Your strategy exceeded the 5-second limit {health.errors.timeout_count} time(s).
            Monitor execution time to avoid recurring issues.
          </p>
        </>
      )}
    </div>
  );
}
```

---

## 🧪 Testing

### Test System Status:
```bash
# Public endpoint - no key needed
curl https://api.qtcq.xyz/api/v1/status | jq

# Expected response includes market.is_open, orchestrator.running, data_feed.status
```

### Test Execution Health:
```bash
# Team-specific - requires API key
curl "https://api.qtcq.xyz/api/v1/team/admin/execution-health?key=va5tKBRA5Q7CFdFyeyenMO1oZmO-HN8UdhaYuvDPKBQ" | jq

# Check specific fields
curl "https://api.qtcq.xyz/api/v1/team/admin/execution-health?key=..." | jq '.performance.timeout_risk'
curl "https://api.qtcq.xyz/api/v1/team/admin/execution-health?key=..." | jq '.execution.success_rate_percentage'
```

---

## 📊 Monitoring Dashboard Example

```javascript
// Real-time monitoring dashboard
const MonitoringDashboard = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [teamHealth, setTeamHealth] = useState({});
  
  // Poll system status every 30s
  useEffect(() => {
    const poll = () => {
      fetch('https://api.qtcq.xyz/api/v1/status')
        .then(res => res.json())
        .then(setSystemStatus);
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Poll team health every 60s
  useEffect(() => {
    const poll = () => {
      TEAMS.forEach(team => {
        fetch(`https://api.qtcq.xyz/api/v1/team/${team.id}/execution-health?key=${team.key}`)
          .then(res => res.json())
          .then(data => setTeamHealth(prev => ({...prev, [team.id]: data})));
      });
    };
    poll();
    const interval = setInterval(poll, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="monitoring-dashboard">
      <SystemStatusCard status={systemStatus} />
      
      <div className="teams-grid">
        {Object.entries(teamHealth).map(([teamId, health]) => (
          <TeamHealthCard key={teamId} teamId={teamId} health={health} />
        ))}
      </div>
    </div>
  );
};
```

---

## 🔄 Restart Required

After adding these endpoints, restart the API server:

```bash
sudo systemctl restart qtc-api

# Or manually:
sudo kill -SIGTERM $(pgrep -f "uvicorn app.api.server")
sudo /opt/qtc/venv/bin/uvicorn app.api.server:app \
  --host 0.0.0.0 --port 8000 --workers 1 --proxy-headers
```

---

## ✅ Implementation Checklist

- [x] System status endpoint implemented
- [x] Team execution health endpoint implemented
- [x] Rate limits applied (120/min and 60/min)
- [x] API documentation updated
- [x] Rate limits table updated
- [x] Polling intervals documented
- [x] Endpoint reference updated
- [x] Testing examples added
- [x] Frontend integration examples provided

---

## 📚 Files Modified

1. `/opt/qtc/app/api/server.py` - Added 2 new endpoints
2. `/opt/qtc/API_DOCUMENTATION.md` - Comprehensive documentation
3. `/opt/qtc/HEALTH_ENDPOINTS_IMPLEMENTATION.md` - This file

---

## 🎯 Benefits

### For Users:
- ✅ Know if system is operational
- ✅ See if market is open/closed
- ✅ Monitor strategy health
- ✅ Track timeout risk
- ✅ View execution success rate
- ✅ Identify when strategy was last updated

### For Platform:
- ✅ Reduce support tickets ("Why isn't my strategy trading?")
- ✅ Enable monitoring and alerting
- ✅ Improve user experience
- ✅ Better debugging tools
- ✅ Transparency and trust

---

## 🚀 Next Steps

1. Restart API server to enable endpoints
2. Test both endpoints with curl
3. Update frontend to use system status
4. Add health monitoring dashboard
5. Set up alerts for system down/degraded states

---

**Status:** ✅ Ready for Production

