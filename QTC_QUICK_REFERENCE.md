# QTC Terminal - Quick Reference Card

## 🔐 Authentication
- **Team Control Center** → Select Team → Enter API Key → Authenticate
- **Session persists** until logout or browser close
- **Store credentials securely** - never share API keys

## 📊 Main Dashboard Sections

### 🏥 Strategy Execution Health
- **Strategy Status**: Active/Idle/Error
- **Success Rate**: Target >95%
- **Execution Time**: Monitor for timeout risk
- **Trades Today**: Daily trading activity
- **Signal Rate**: (Trades Today / Total Executions) × 100

### 📈 Performance Metrics
- **Portfolio Value**: Total cash + positions
- **Total Return**: % return (3 decimal places)
- **Sharpe Ratio**: Risk-adjusted return
- **Sortino Ratio**: Downside risk-adjusted return
- **Max Drawdown**: Peak-to-trough decline %
- **Total Trades**: Complete trade count

### 💼 Portfolio Analytics
- **Portfolio Value Chart**: Total + individual assets (cash, NVDA, AAPL, etc.)
- **Position Breakdown**: Share quantities (excludes cash, no $ symbols)

### 📋 Trading Activity
- **Trade Count Chart**: Buy vs. sell over time
- **Asset Trade Activity**: Trades per asset over time
- **Open Orders**: Pending orders with status (New/Partially Filled/Accepted)
- **Trade History**: Complete log with slippage calculation

### ⚠️ System Alerts
- **Error Tracking**: Strategy execution errors
- **Timeout Monitoring**: Performance warnings
- **Last Error Details**: Timestamp and description

## 🔄 Upload Strategy
- **Formats**: .py (single) or .zip (package)
- **Entry Point**: Must be `strategy.py`
- **Process**: Drag/drop → Validate → Submit → Loads next cycle
- **Requirements**: Auto-validation, security checks

## 🎯 Key Endpoints
- **System Status**: `/api/v1/status` (public)
- **Team Metrics**: `/api/v1/team/{id}/metrics`
- **Portfolio History**: `/api/v1/team/{id}/portfolio-history`
- **Trades**: `/api/v1/team/{id}/trades`
- **Open Orders**: `/api/v1/team/{id}/orders/open`
- **Execution Health**: `/api/v1/team/{id}/execution-health`
- **Upload Strategy**: `/api/v1/team/{id}/upload-strategy`

## 🚨 Status Indicators
- 🟢 **Green**: Healthy/Operational
- 🟡 **Yellow**: Warning/Delayed
- 🔴 **Red**: Critical/Error
- ⚪ **Gray**: Inactive/Unknown

## ⏱️ Refresh Rates
- **System Status**: 30 seconds
- **All Team Data**: 60 seconds
- **Manual Refresh**: Available on all components

## 🔧 Common Issues
| Issue | Solution |
|-------|----------|
| Auth Failed | Check team ID + API key |
| No Data | Verify strategy active, check market hours |
| Upload Failed | Ensure .py/.zip format, check entry point |
| Zero Metrics | New teams need time, ensure strategy running |
| Limited Chart Data | Server runtime affects historical data |

## 📱 Interface Tips
- **Click team names** in leaderboard to view performance
- **Time ranges**: 1D, 7D, 30D available on charts
- **Hover tooltips** for detailed values
- **Terminal style**: High density, professional layout
- **Responsive design**: Works on desktop and mobile

## 🎨 Color Scheme
- **Primary Blue**: #00A0E8 (headings, active elements)
- **Success Green**: #00C805 (positive values, healthy status)
- **Warning Orange**: #FFAA00 (warnings, pending)
- **Error Red**: #FF0000 (errors, negative values)
- **Text Gray**: #CCCCCC (main text)
- **Muted Gray**: #808080 (secondary text)

---
*Quick Reference v1.0 - QTC Terminal Dashboard*
