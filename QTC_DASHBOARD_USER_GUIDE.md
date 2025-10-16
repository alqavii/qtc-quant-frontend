# QTC Terminal Dashboard - Complete User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Main Terminal Interface](#main-terminal-interface)
4. [Team Control Center](#team-control-center)
5. [Dashboard Components](#dashboard-components)
6. [API Integration](#api-integration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

The QTC (Quantitative Trading Competition) Terminal Dashboard is a professional-grade trading interface designed in the style of Bloomberg terminals. It provides real-time monitoring, strategy management, and comprehensive analytics for quantitative trading teams.

### Key Features
- **Real-time System Monitoring**: Market status, orchestrator health, and data feed monitoring
- **Team Performance Analytics**: Live portfolio tracking, risk metrics, and trade analysis
- **Strategy Management**: Upload, monitor, and manage trading strategies
- **Professional Terminal UI**: High-density data display with Bloomberg-style aesthetics
- **Secure Authentication**: Team-based access control with API key authentication

---

## Getting Started

### Prerequisites
- Team ID (provided by competition organizers)
- API Key (unique to your team)
- Modern web browser with JavaScript enabled

### First-Time Access
1. Navigate to the QTC Terminal website
2. Click **"TEAM CONTROL CENTER"** in the top navigation
3. Select your team from the dropdown menu
4. Enter your API key
5. Click **"AUTHENTICATE"**

### Authentication
- Your credentials are stored locally in session storage
- You'll remain authenticated until you log out or close your browser
- Use the **"LOGOUT"** button to clear your session

---

## Main Terminal Interface

The main interface provides a high-level overview of the entire competition with three primary sections:

### 1. Team Rankings (Left Panel)
- **Real-time leaderboard** of all competing teams
- **Click any team** to view their performance in the charts
- **Rankings update automatically** every 60 seconds
- **Color-coded performance indicators**

### 2. Team Performance Chart (Top Right)
- **Historical portfolio performance** for selected teams
- **Interactive chart** showing portfolio value over time
- **Click team names** in the leaderboard to switch views
- **Time range selection** (1D, 7D, 30D)

### 3. Market Overview (Bottom Right)
- **Comprehensive market analysis** across all teams
- **Performance comparisons** and market trends
- **Statistical summaries** and distribution analysis

### System Status Banner
Located at the top of the main interface:
- **Market Status**: OPEN/CLOSED indicator
- **Trading Activity**: ACTIVE/PAUSED status
- **Team Counts**: Active vs. loaded teams
- **Data Feed**: Last update time and symbol count
- **Auto-refreshes** every 30 seconds

---

## Team Control Center

The Team Control Center is your private dashboard for managing your team's trading operations. Access it by clicking **"TEAM CONTROL CENTER"** and authenticating.

### Dashboard Sections

#### 1. Strategy Execution Health
**Purpose**: Monitor your strategy's operational status and performance

**Key Metrics**:
- **Strategy Status**: Active/Idle/Error states
- **Success Rate**: Percentage of successful executions
- **Execution Stats**: Total executions, failures, and timing
- **Performance**: Average execution time and timeout risk
- **Trading Activity**: Daily trades and signal generation rate
- **Error Tracking**: Count of errors and timeouts

**Color Coding**:
- 🟢 **Green**: Healthy/operational
- 🟡 **Yellow**: Warning conditions
- 🔴 **Red**: Critical issues requiring attention

#### 2. Strategy Upload
**Purpose**: Deploy and update your trading strategies

**Supported Formats**:
- **Single File**: `.py` files (strategy.py)
- **Package**: `.zip` files containing multiple Python files

**Upload Process**:
1. Drag and drop your file or click to browse
2. File validation occurs automatically
3. Click **"SUBMIT STRATEGY"**
4. Strategy loads on the next execution cycle

**Requirements**:
- Entry point must be `strategy.py`
- Automatic validation and security checks
- Loads on next cycle automatically

#### 3. Performance Metrics
**Purpose**: Track your team's financial performance and risk metrics

**Primary Metrics**:
- **Portfolio Value**: Current total portfolio value (cash + positions)
- **Total Return**: Percentage return since competition start (3 decimal precision)

**Risk Metrics**:
- **Sharpe Ratio**: Risk-adjusted return measure
- **Sortino Ratio**: Downside risk-adjusted return
- **Max Drawdown**: Largest peak-to-trough decline percentage

**Activity Metrics**:
- **Total Trades**: Complete count of executed trades

**Auto-refresh**: Updates every 60 seconds

#### 4. Portfolio Analytics
**Purpose**: Visualize portfolio composition and historical performance

**Portfolio Value Chart**:
- **Total Portfolio Value**: Combined cash and market value
- **Individual Asset Values**: Cash, stocks (NVDA, AAPL, etc.)
- **Historical tracking** with time range selection (1D, 7D, 30D)
- **Interactive tooltips** with precise values

**Position Breakdown Chart**:
- **Asset Quantities**: Number of shares for each position
- **Excludes cash** (shows only stock positions)
- **No currency symbols** (pure quantity display)
- **Time-series visualization** of position changes

#### 5. Trading Activity
**Purpose**: Monitor trade execution, orders, and asset-specific activity

**Trade Count Chart**:
- **Buy vs. Sell activity** over time
- **Bar chart visualization** of trading frequency
- **Daily trade summaries**

**Asset Trade Activity**:
- **Trades per asset** over time
- **Multi-asset comparison** (NVDA, AAPL, etc.)
- **Trading pattern analysis**

**Open Orders**:
- **Pending orders** waiting to fill
- **Order details**: Symbol, side, quantity, limit price
- **Status tracking**: New, Partially Filled, Accepted
- **Fill monitoring**: Track partial fills and average prices
- **Time tracking**: Order creation and last update times

**Trade History Table**:
- **Complete trade log** with pagination (1000 trades max)
- **Trade details**: Symbol, side, quantity, prices, timing
- **Price information**: Requested price vs. execution price
- **Slippage calculation**: Execution price - requested price
- **Order types**: Market, limit, etc.
- **Broker order IDs** for tracking

#### 6. System Alerts
**Purpose**: Monitor strategy execution errors and system issues

**Error Tracking**:
- **Error count** and types
- **Timeout monitoring**
- **Last error details** with timestamps
- **Error categorization** and descriptions
- **Real-time alerts** for critical issues

---

## API Integration

### Authentication
All team-specific endpoints require:
- **Team ID**: Your assigned team identifier
- **API Key**: Unique authentication token
- **Headers**: `Accept: application/json`

### Data Refresh Rates
- **System Status**: 30 seconds
- **Team Metrics**: 60 seconds
- **Portfolio Data**: 60 seconds
- **Trade Data**: 60 seconds
- **Health Monitoring**: 60 seconds

### Error Handling
- **Network errors**: Automatic retry with exponential backoff
- **API errors**: Detailed error messages with troubleshooting guidance
- **Authentication errors**: Clear instructions for credential issues
- **Data validation**: Client-side validation with server confirmation

---

## Troubleshooting

### Common Issues

#### "Authentication Failed"
- **Check team ID**: Ensure you selected the correct team from dropdown
- **Verify API key**: Confirm your API key is entered correctly
- **Network connection**: Ensure stable internet connection
- **Contact support**: If credentials are correct, reach out to organizers

#### "No Data Showing"
- **Check market hours**: Some data may not update when market is closed
- **Verify strategy status**: Ensure your strategy is active and running
- **Refresh manually**: Use refresh buttons to force data updates
- **Check system status**: Verify overall system health in status banner

#### "Strategy Upload Failed"
- **File format**: Ensure file is .py or .zip
- **File size**: Check for reasonable file sizes
- **Entry point**: Verify strategy.py exists in your upload
- **Validation errors**: Review error messages for specific issues

#### "Performance Metrics Showing Zero"
- **New team**: Metrics may take time to populate for new teams
- **Strategy not running**: Ensure strategy is active and executing
- **Data lag**: Allow up to 5 minutes for data propagation
- **Market conditions**: Some metrics require trading activity

#### "Charts Showing Limited Data"
- **Time range**: Server runtime affects available historical data
- **Data collection**: Historical data builds up over time
- **Market hours**: Some data only updates during market hours

### Performance Optimization

#### Browser Recommendations
- **Chrome/Edge**: Best performance and compatibility
- **Disable extensions**: Some extensions may interfere with functionality
- **Clear cache**: If experiencing issues, clear browser cache
- **Hardware acceleration**: Enable for better chart rendering

#### Network Considerations
- **Stable connection**: Ensure reliable internet for real-time updates
- **Bandwidth**: Charts and real-time data require consistent bandwidth
- **VPN issues**: Some VPNs may affect API connectivity

---

## Best Practices

### Strategy Development
1. **Test locally**: Validate your strategy logic before uploading
2. **Error handling**: Include comprehensive error handling in your code
3. **Performance**: Optimize for execution time to avoid timeouts
4. **Logging**: Use appropriate logging for debugging
5. **Version control**: Keep track of strategy versions

### Dashboard Usage
1. **Monitor regularly**: Check execution health and performance metrics
2. **Set alerts**: Watch for error notifications and system warnings
3. **Analyze patterns**: Use charts to identify trading patterns and opportunities
4. **Track orders**: Monitor open orders and trade execution quality
5. **Review errors**: Address strategy errors promptly

### Security
1. **Protect API keys**: Never share your API key with others
2. **Secure environment**: Use trusted networks and devices
3. **Log out**: Always log out when finished, especially on shared computers
4. **Report issues**: Immediately report any suspicious activity

### Performance Monitoring
1. **Execution health**: Regularly check success rates and execution times
2. **Risk metrics**: Monitor Sharpe ratio, drawdown, and volatility
3. **Trade analysis**: Review slippage and execution quality
4. **System status**: Stay informed about market and system conditions

---

## Support and Resources

### Getting Help
- **Documentation**: This guide covers all major features
- **System status**: Check the status banner for system-wide issues
- **Error messages**: Most errors include specific guidance
- **Competition organizers**: Contact for credential or competition-specific issues

### Additional Resources
- **API Documentation**: Detailed endpoint specifications
- **Strategy Examples**: Sample strategies and best practices
- **Competition Rules**: Specific rules and constraints
- **Technical Support**: For technical issues with the platform

---

*Last Updated: January 2025*
*Version: 1.0*
