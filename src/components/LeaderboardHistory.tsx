'use client';

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { RefreshCw, AlertTriangle } from "lucide-react";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_URL = "https://api.qtcq.xyz/api/v1/leaderboard/history";
const POLL_MS = 60_000;

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface HistoryPoint {
  timestamp: string;
  value: number;
}

interface TeamHistory {
  [teamId: string]: HistoryPoint[];
}

interface HistoryResponse {
  days: number;
  teams: TeamHistory;
}

interface CalculatedMetrics {
  team_id: string;
  total_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  current_value: number;
  starting_value: number;
}

type MetricType = 'sharpe_ratio' | 'sortino_ratio' | 'calmar_ratio' | 'max_drawdown' | 'total_return';

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const fetchJson = async (url: string, timeoutMs = 12_000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      mode: "cors",
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

const formatNumber = (n: number | null | undefined, decimals: number = 2) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return "N/A";
  try {
    return n.toFixed(decimals);
  } catch {
    return "N/A";
  }
};

// Calculate returns from price series
const calculateReturns = (values: number[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0 && isFinite(values[i]) && isFinite(values[i - 1])) {
      const ret = (values[i] - values[i - 1]) / values[i - 1];
      if (isFinite(ret)) {
        returns.push(ret);
      }
    }
  }
  return returns;
};

// Calculate max drawdown
const calculateMaxDrawdown = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown * 100; // Return as percentage
};

// Calculate Sharpe ratio (simplified, assuming risk-free rate = 0)
const calculateSharpeRatio = (returns: number[]): number => {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Annualize (assuming daily returns)
  const annualizedReturn = mean * 252; // 252 trading days
  const annualizedStdDev = stdDev * Math.sqrt(252);
  
  return annualizedReturn / annualizedStdDev;
};

// Calculate Sortino ratio (downside deviation)
const calculateSortinoRatio = (returns: number[]): number => {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < 0);
  
  if (downsideReturns.length === 0) return 0;
  
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length;
  const downsideStdDev = Math.sqrt(downsideVariance);
  
  if (downsideStdDev === 0) return 0;
  
  // Annualize
  const annualizedReturn = mean * 252;
  const annualizedDownsideStdDev = downsideStdDev * Math.sqrt(252);
  
  return annualizedReturn / annualizedDownsideStdDev;
};

// Calculate Calmar ratio
const calculateCalmarRatio = (totalReturn: number, maxDrawdown: number): number => {
  if (maxDrawdown === 0) return 0;
  return (totalReturn / 100) / (maxDrawdown / 100);
};

// Calculate metrics for a team
const calculateTeamMetrics = (teamId: string, history: HistoryPoint[]): CalculatedMetrics => {
  // Validate history data
  if (!history || history.length < 2) {
    return {
      team_id: teamId,
      total_return: 0,
      max_drawdown: 0,
      sharpe_ratio: 0,
      sortino_ratio: 0,
      calmar_ratio: 0,
      current_value: history && history.length > 0 ? history[history.length - 1].value : 0,
      starting_value: history && history.length > 0 ? history[0].value : 0,
    };
  }
  
  try {
    // Filter out invalid values
    const values = history
      .map(h => h.value)
      .filter(v => typeof v === 'number' && isFinite(v));
    
    if (values.length < 2) {
      return {
        team_id: teamId,
        total_return: 0,
        max_drawdown: 0,
        sharpe_ratio: 0,
        sortino_ratio: 0,
        calmar_ratio: 0,
        current_value: values.length > 0 ? values[values.length - 1] : 0,
        starting_value: values.length > 0 ? values[0] : 0,
      };
    }
    
    const starting = values[0];
    const current = values[values.length - 1];
    const totalReturn = starting !== 0 ? ((current - starting) / starting) * 100 : 0;
    
    const returns = calculateReturns(values);
    const maxDrawdown = calculateMaxDrawdown(values);
    const sharpeRatio = calculateSharpeRatio(returns);
    const sortinoRatio = calculateSortinoRatio(returns);
    const calmarRatio = calculateCalmarRatio(totalReturn, maxDrawdown);
    
    // Ensure all values are finite
    return {
      team_id: teamId,
      total_return: isFinite(totalReturn) ? totalReturn : 0,
      max_drawdown: isFinite(maxDrawdown) ? maxDrawdown : 0,
      sharpe_ratio: isFinite(sharpeRatio) ? sharpeRatio : 0,
      sortino_ratio: isFinite(sortinoRatio) ? sortinoRatio : 0,
      calmar_ratio: isFinite(calmarRatio) ? calmarRatio : 0,
      current_value: current,
      starting_value: starting,
    };
  } catch (e) {
    console.error(`Error calculating metrics for team ${teamId}:`, e);
    return {
      team_id: teamId,
      total_return: 0,
      max_drawdown: 0,
      sharpe_ratio: 0,
      sortino_ratio: 0,
      calmar_ratio: 0,
      current_value: 0,
      starting_value: 0,
    };
  }
};

// Metric configurations
const METRICS = {
  sharpe_ratio: {
    label: 'SHARPE',
    description: 'RISK-ADJ RETURN',
    format: (v: number | null) => formatNumber(v, 2),
    betterHigher: true,
  },
  sortino_ratio: {
    label: 'SORTINO',
    description: 'DOWNSIDE RISK-ADJ',
    format: (v: number | null) => formatNumber(v, 2),
    betterHigher: true,
  },
  calmar_ratio: {
    label: 'CALMAR',
    description: 'RETURN VS DRAWDOWN',
    format: (v: number | null) => formatNumber(v, 2),
    betterHigher: true,
  },
  max_drawdown: {
    label: 'MAX DD',
    description: 'PEAK TO TROUGH',
    format: (v: number | null) => v !== null ? `${formatNumber(v, 2)}%` : 'N/A',
    betterHigher: false, // lower (closer to 0) is better
  },
  total_return: {
    label: 'RETURN',
    description: 'TOTAL RETURN %',
    format: (v: number | null) => v !== null ? `${formatNumber(v, 2)}%` : 'N/A',
    betterHigher: true,
  },
};

// Terminal color gradient for bars - functional, not decorative
const getBarColor = (value: number, metric: MetricType) => {
  if (metric === 'max_drawdown') {
    // For drawdown, more negative is worse
    if (value > 20) return "#FF0000"; // red - bad
    if (value > 10) return "#FFAA00"; // amber - warning
    return "#00C805"; // green - good
  }
  
  // For other metrics, higher is better
  if (value < 0) return "#FF0000"; // red - negative
  if (value < 0.5) return "#808080"; // gray - weak
  if (value < 1.0) return "#FFAA00"; // amber - moderate
  return "#00C805"; // green - good
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function LeaderboardHistory() {
  const [data, setData] = useState<CalculatedMetrics[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('sharpe_ratio');
  const [days, setDays] = useState<number>(7);

  const fetchData = async () => {
    setError(null);
    try {
      const response: HistoryResponse = await fetchJson(
        `${API_URL}?days=${days}&limit=1000`
      );
      
      // Calculate metrics for each team
      const calculatedMetrics: CalculatedMetrics[] = Object.entries(response.teams).map(
        ([teamId, history]) => calculateTeamMetrics(teamId, history)
      );
      
      setData(calculatedMetrics);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to fetch performance metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [days]);

  // Transform data for bar chart
  const chartData = React.useMemo(() => {
    if (!data) return [];

    // Sort by the selected metric
    const sorted = [...data].sort((a, b) => {
      let aVal = 0, bVal = 0;
      
      switch (selectedMetric) {
        case 'sharpe_ratio':
          aVal = a.sharpe_ratio;
          bVal = b.sharpe_ratio;
          break;
        case 'sortino_ratio':
          aVal = a.sortino_ratio;
          bVal = b.sortino_ratio;
          break;
        case 'calmar_ratio':
          aVal = a.calmar_ratio;
          bVal = b.calmar_ratio;
          break;
        case 'max_drawdown':
          aVal = a.max_drawdown;
          bVal = b.max_drawdown;
          // For max drawdown, lower is better (less drawdown)
          return aVal - bVal;
        case 'total_return':
          aVal = a.total_return;
          bVal = b.total_return;
          break;
      }
      
      return bVal - aVal; // Higher is better for most metrics
    });

    return sorted.map((team, idx) => {
      let value = 0;
      switch (selectedMetric) {
        case 'sharpe_ratio':
          value = team.sharpe_ratio;
          break;
        case 'sortino_ratio':
          value = team.sortino_ratio;
          break;
        case 'calmar_ratio':
          value = team.calmar_ratio;
          break;
        case 'max_drawdown':
          value = team.max_drawdown;
          break;
        case 'total_return':
          value = team.total_return;
          break;
      }

      return {
        team_id: team.team_id,
        value: value,
        rank: idx + 1,
        color: getBarColor(value, selectedMetric),
      };
    });
  }, [data, selectedMetric]);

  const currentMetric = METRICS[selectedMetric];

  return (
    <div className="w-full h-full bg-[#000000] text-[#CCCCCC] flex flex-col">
      {/* Control Bar */}
      <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Metric Selector - Compact */}
          {(Object.keys(METRICS) as MetricType[]).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={classNames(
                "border text-[10px] uppercase tracking-wider px-2 py-1 font-mono transition-colors",
                selectedMetric === metric
                  ? "border-[#00A0E8] bg-[#00A0E8] text-[#000000]"
                  : "border-[#333333] bg-[#0A0A0A] text-[#808080] hover:bg-[#1A1A1A] hover:text-[#CCCCCC]"
              )}
            >
              {METRICS[metric].label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time period selector */}
          <div className="flex items-center gap-1">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={classNames(
                  "border text-[10px] uppercase tracking-wider px-2 py-1 font-mono transition-colors",
                  days === d
                    ? "border-[#FFAA00] bg-[#FFAA00] text-[#000000]"
                    : "border-[#333333] bg-[#0A0A0A] text-[#808080] hover:bg-[#1A1A1A] hover:text-[#CCCCCC]"
                )}
              >
                {d}D
              </button>
            ))}
          </div>
          
          {lastUpdated && (
            <span className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">
              {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          
          <button
            onClick={fetchData}
            className="border border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] p-1 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="size-3 text-[#00A0E8]" />
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="border-b border-[#333333] bg-[#000000] px-2 py-1">
        <div className="text-[10px] text-[#808080] uppercase tracking-wider">
          {currentMetric.description}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-b border-[#FF0000] bg-[#FF0000]/10 px-2 py-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3 shrink-0 text-[#FF0000]" />
            <div className="text-[10px] text-[#FF0000] uppercase tracking-wider">{error}</div>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 p-1 overflow-hidden">
        {loading && !data ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="size-4 animate-spin text-[#00A0E8]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">LOADING...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="size-4 text-[#808080]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">NO DATA</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#333333" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: "monospace" }}
                tickLine={{ stroke: "#333333" }}
                axisLine={{ stroke: "#333333" }}
              />
              <YAxis
                type="category"
                dataKey="team_id"
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: "monospace" }}
                tickLine={{ stroke: "#333333" }}
                axisLine={{ stroke: "#333333" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000",
                  border: "1px solid #333333",
                  borderRadius: "0",
                  padding: "4px 8px",
                }}
                labelStyle={{ color: "#00A0E8", fontSize: "10px", fontFamily: "monospace", marginBottom: "4px" }}
                itemStyle={{ color: "#CCCCCC", fontSize: "10px", fontFamily: "monospace", padding: "1px 0" }}
                formatter={(value: any) => [currentMetric.format(value), currentMetric.label]}
                cursor={{ fill: 'rgba(0, 160, 232, 0.1)' }}
              />
              <Bar dataKey="value" radius={0}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}



