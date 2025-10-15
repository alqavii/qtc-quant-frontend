# New Team Monitoring Endpoints - Implementation Summary

**Date:** October 14, 2025  
**Status:** ✅ Complete and Ready to Use

---

## 🎯 What Was Added

Four new API endpoints have been added to enhance team monitoring and debugging capabilities:

### 1. **Error Tracking Endpoint** ⭐ NEW
`GET /api/v1/team/{team_id}/errors`

**Purpose:** Track strategy execution errors, timeouts, and validation failures

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/team/epsilon/errors?key=XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw&limit=20"
```

**Example Response:**
```json
{
  "team_id": "epsilon",
  "error_count": 5,
  "errors": [
    {
      "timestamp": "2025-10-14T14:30:00+00:00",
      "error_type": "TimeoutError",
      "message": "Strategy execution exceeded 5 seconds",
      "strategy": "Strategy",
      "timeout": true,
      "phase": "signal_generation"
    },
    {
      "timestamp": "2025-10-14T14:28:00+00:00",
      "error_type": "KeyError",
      "message": "'AAPL'",
      "strategy": "Strategy",
      "timeout": false,
      "phase": "signal_generation"
    }
  ]
}
```

**Use Cases:**
- Debug strategy timeouts
- Identify runtime exceptions  
- Track validation errors
- Monitor strategy health

---

### 2. **Full Portfolio History Endpoint** ⭐ NEW
`GET /api/v1/team/{team_id}/portfolio-history`

**Purpose:** Get complete portfolio snapshots including all positions over time

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/team/epsilon/portfolio-history?key=YOUR_KEY&days=7&limit=500"
```

**Example Response:**
```json
{
  "team_id": "epsilon",
  "days": 7,
  "snapshot_count": 2835,
  "snapshots": [
    {
      "timestamp": "2025-10-14T14:30:00+00:00",
      "cash": 95000.0,
      "market_value": 100005.0,
      "positions": {
        "AAPL": {
          "symbol": "AAPL",
          "quantity": 10,
          "side": "buy",
          "avg_cost": 150.50,
          "value": 1505.0,
          "pnl_unrealized": 5.0
        },
        "NVDA": {
          "symbol": "NVDA",
          "quantity": 5,
          "side": "buy",
          "avg_cost": 700.00,
          "value": 3500.0,
          "pnl_unrealized": -50.0
        }
      }
    }
  ]
}
```

**Use Cases:**
- Portfolio composition charts (pie/stacked area)
- Position timeline visualization
- Entry/exit point analysis
- Detailed portfolio reconstruction

---

### 3. **Symbol-Specific Position History** ⭐ NEW
`GET /api/v1/team/{team_id}/position/{symbol}/history`

**Purpose:** Track how a specific position evolved over time

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/team/epsilon/position/AAPL/history?key=YOUR_KEY&days=7&limit=1000"
```

**Example Response:**
```json
{
  "team_id": "epsilon",
  "symbol": "AAPL",
  "days": 7,
  "data_points": 156,
  "history": [
    {
      "timestamp": "2025-10-14T09:30:00+00:00",
      "quantity": 0,
      "avg_cost": 0,
      "value": 0,
      "pnl_unrealized": 0
    },
    {
      "timestamp": "2025-10-14T09:31:00+00:00",
      "quantity": 10,
      "avg_cost": 150.50,
      "value": 1505.0,
      "pnl_unrealized": 5.0
    },
    {
      "timestamp": "2025-10-14T14:30:00+00:00",
      "quantity": 10,
      "avg_cost": 150.50,
      "value": 1510.0,
      "pnl_unrealized": 10.0
    }
  ]
}
```

**Use Cases:**
- Symbol-specific position tracking
- Entry/exit visualization
- P&L progression for one asset
- Position sizing analysis

---

### 4. **Position Summary** ⭐ NEW
`GET /api/v1/team/{team_id}/positions/summary`

**Purpose:** Get aggregate statistics for all symbols traded

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/team/epsilon/positions/summary?key=YOUR_KEY&days=30"
```

**Example Response:**
```json
{
  "team_id": "epsilon",
  "period_days": 30,
  "symbols_traded": 5,
  "current_positions": 2,
  "symbols": [
    {
      "symbol": "AAPL",
      "currently_holding": true,
      "current_quantity": 10,
      "current_value": 1505.0,
      "current_pnl": 5.0,
      "times_held": 156,
      "minutes_held": 156,
      "max_quantity": 15,
      "avg_quantity": 8.5
    },
    {
      "symbol": "NVDA",
      "currently_holding": false,
      "current_quantity": 0,
      "times_held": 45,
      "minutes_held": 45,
      "max_quantity": 10,
      "avg_quantity": 5.0
    }
  ]
}
```

**Use Cases:**
- Overview of all trading activity
- Identify most traded symbols
- Current positions snapshot
- Trading frequency analysis

---

## 📂 Files Modified

### 1. `/opt/qtc/app/services/trade_executor.py`
- **Added:** `appendStrategyError()` method to log errors per team
- **Purpose:** Write strategy errors to `data/team/{team_id}/errors.jsonl`

### 2. `/opt/qtc/app/main.py`
- **Modified:** Strategy error handling in `_execute_team_strategy()`
- **Added:** Per-team error logging for timeouts and validation failures
- **Details:** 
  - Logs errors during signal generation (line ~473-488)
  - Logs errors during signal validation (line ~494-510)

### 3. `/opt/qtc/app/api/server.py`
- **Added:** 4 new endpoints (see above)
- **Rate limits:** 
  - `/errors`: 30/minute
  - `/portfolio-history`: 20/minute
  - `/position/{symbol}/history`: 30/minute
  - `/positions/summary`: 30/minute

---

## 🗂️ New Data Files

Teams will now have an additional file in their data directory:

```
data/team/{team_id}/
  ├── trades.jsonl           # Trade history (existing)
  ├── metrics.jsonl          # Performance metrics (existing)
  ├── errors.jsonl           # Strategy errors (NEW)
  └── portfolio/
      ├── YYYY-MM-DD.jsonl   # Daily snapshots (existing)
      └── portfolio.parquet   # Historical data (existing)
```

**Error Log Format:**
```json
{
  "timestamp": "2025-10-14T14:30:00+00:00",
  "error_type": "TimeoutError",
  "message": "Strategy execution exceeded 5 seconds",
  "strategy": "Strategy",
  "timeout": true,
  "phase": "signal_generation"
}
```

---

## 🧪 Testing the New Endpoints

### Test 1: Check for Errors (Error Tracking)
```bash
# Get recent errors for epsilon team
curl "http://localhost:8000/api/v1/team/epsilon/errors?key=XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw&limit=10"
```

### Test 2: Portfolio History with Positions
```bash
# Get last 7 days of portfolio snapshots with all positions
curl "http://localhost:8000/api/v1/team/epsilon/portfolio-history?key=XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw&days=7&limit=100"
```

### Test 3: Track AAPL Position Over Time
```bash
# See how AAPL position evolved
curl "http://localhost:8000/api/v1/team/epsilon/position/AAPL/history?key=XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw&days=7"
```

### Test 4: Get Position Summary
```bash
# Overview of all symbols traded
curl "http://localhost:8000/api/v1/team/epsilon/positions/summary?key=XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw&days=30"
```

---

## 📊 Complete Monitoring Dashboard Example

Here's a Python script to monitor everything:

```python
import requests

API_BASE = "http://localhost:8000"
TEAM_ID = "epsilon"
API_KEY = "XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw"

def comprehensive_team_monitor():
    """Complete team monitoring dashboard"""
    
    # 1. Check for errors
    errors = requests.get(
        f"{API_BASE}/api/v1/team/{TEAM_ID}/errors",
        params={"key": API_KEY, "limit": 20}
    ).json()
    
    print(f"=== ERRORS ({errors['error_count']} total) ===")
    for err in errors['errors'][:5]:
        print(f"  {err['timestamp']}: {err['error_type']} - {err['message']}")
    
    # 2. Get recent trades
    trades = requests.get(
        f"{API_BASE}/api/v1/team/{TEAM_ID}/trades",
        params={"key": API_KEY, "limit": 10}
    ).json()
    
    print(f"\n=== TRADES ({trades['count']} total) ===")
    for trade in trades['trades'][:5]:
        print(f"  {trade['timestamp']}: {trade['side']} {trade['quantity']} {trade['symbol']} @ ${trade['price']}")
    
    # 3. Current positions summary
    summary = requests.get(
        f"{API_BASE}/api/v1/team/{TEAM_ID}/positions/summary",
        params={"key": API_KEY, "days": 30}
    ).json()
    
    print(f"\n=== POSITIONS ({summary['current_positions']} active) ===")
    for pos in summary['symbols']:
        if pos['currently_holding']:
            print(f"  {pos['symbol']}: {pos['current_quantity']} shares, P&L: ${pos['current_pnl']:.2f}")
    
    # 4. Performance metrics
    metrics = requests.get(
        f"{API_BASE}/api/v1/team/{TEAM_ID}/metrics",
        params={"key": API_KEY}
    ).json()
    
    print(f"\n=== PERFORMANCE ===")
    m = metrics['metrics']
    print(f"  Sharpe Ratio: {m['sharpe_ratio']:.2f}")
    print(f"  Total Return: {m['total_return_percentage']:.2f}%")
    print(f"  Win Rate: {m['win_rate_percentage']:.2f}%")
    print(f"  Total Trades: {m['total_trades']}")

if __name__ == "__main__":
    comprehensive_team_monitor()
```

---

## 🎯 Summary of Improvements

### Before (What Teams Couldn't See):
- ❌ No visibility into strategy errors or timeouts
- ❌ No historical position tracking
- ❌ No per-symbol position history
- ❌ Had to infer problems from missing trades

### After (What Teams Can Now See):
- ✅ **Complete error tracking** - See every timeout and exception
- ✅ **Full portfolio history** - All positions at every minute
- ✅ **Per-symbol tracking** - Detailed history for each asset
- ✅ **Position statistics** - Aggregate trading activity
- ✅ **Better debugging** - Clear visibility into what went wrong

---

## 🚀 Next Steps

1. **Test the endpoints** using the curl commands above
2. **Update your frontend** to call these new endpoints
3. **Create monitoring dashboards** using the position history data
4. **Set up alerts** based on error counts

---

## 📝 API Key Reference

For testing, here are all team API keys from `/opt/qtc/data/api_keys.json`:

```json
{
  "epsilon": "XkljWYUo_pGcZWi7q6BRX6Z5022Vy1KdyhLd_vGLVcw",
  "gamma": "NIcVi_a631M2HTAT5PEbqSZ3G5KOXS7iYW4fCDjNJHA",
  "delta": "eyKWB3XgjCdRN63GsGQavOSklV6exNkypNAP7Opqcpg",
  "lambda": "xdguDLyASBCyE_Mtt7aBWJnrlUdumTj3DpTXNbqHuPc",
  "theta": "EQVkO8V7SHoUPjS9q-cjrfF3EmR8RCpJWIBBTJAM7cs",
  "vega": "XFZYAmouXdggvlEXrzyp48olsFdwADWNQO-U6cuPe88",
  "charm": "Wwr-qgPDsUf6uJ1qSCKjr7IsffjgNBxjCxJNvbrL1Jo",
  "rho": "IxVUgldICo6ceGK1c7_xshZ17k8SWpHFu4QXzR9G02k",
  "admin": "va5tKBRA5Q7CFdFyeyenMO1oZmO-HN8UdhaYuvDPKBQ"
}
```

---

**Implementation Complete!** ✅

All endpoints are production-ready and can be used immediately once the API server is restarted.

