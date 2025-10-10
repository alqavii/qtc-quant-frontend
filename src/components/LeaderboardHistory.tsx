'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, RefreshCw, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    label: 'Sharpe Ratio',
    description: 'Risk-adjusted return',
    format: (v: number | null) => formatNumber(v, 2),
    icon: TrendingUp,
    betterHigher: true,
  },
  sortino_ratio: {
    label: 'Sortino Ratio',
    description: 'Downside risk-adjusted return',
    format: (v: number | null) => formatNumber(v, 2),
    icon: Activity,
    betterHigher: true,
  },
  calmar_ratio: {
    label: 'Calmar Ratio',
    description: 'Return vs max drawdown',
    format: (v: number | null) => formatNumber(v, 2),
    icon: Trophy,
    betterHigher: true,
  },
  max_drawdown: {
    label: 'Max Drawdown',
    description: 'Largest peak-to-trough decline',
    format: (v: number | null) => v !== null ? `${formatNumber(v, 2)}%` : 'N/A',
    icon: AlertTriangle,
    betterHigher: false, // lower (closer to 0) is better
  },
  total_return: {
    label: 'Total Return',
    description: 'Overall return percentage',
    format: (v: number | null) => v !== null ? `${formatNumber(v, 2)}%` : 'N/A',
    icon: TrendingUp,
    betterHigher: true,
  },
};

// Color gradient for bars
const getBarColor = (rank: number, total: number) => {
  const colors = [
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f59e0b", // amber
    "#10b981", // emerald
    "#6366f1", // indigo
    "#f43f5e", // rose
    "#14b8a6", // teal
  ];
  return colors[rank % colors.length];
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
        color: getBarColor(idx, sorted.length),
      };
    });
  }, [data, selectedMetric]);

  const bodyBg = "bg-[#0a0a14]";
  const cardBg = "border-white/10 bg-white/[0.03] backdrop-blur-sm";
  const currentMetric = METRICS[selectedMetric];

  return (
    <div className={classNames("w-full text-white py-8", bodyBg)}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="rounded-xl bg-amber-500/20 p-3 ring-1 ring-amber-400/20">
              <Trophy className="size-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Performance Rankings</h2>
              <p className="text-sm text-white/60 mt-1">Compare teams by different performance metrics</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            {/* Time period selector */}
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {[1, 7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={classNames(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    days === d
                      ? "bg-amber-500/80 text-white shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {d === 1 ? '1 Day' : `${d} Days`}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 backdrop-blur transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/10"
              onClick={fetchData}
              title="Refresh"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(METRICS) as MetricType[]).map((metric) => {
              const MetricIcon = METRICS[metric].icon;
              return (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={classNames(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                    selectedMetric === metric
                      ? "bg-violet-500/90 text-white shadow-lg ring-2 ring-violet-400/50"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <MetricIcon className="size-4" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">{METRICS[metric].label}</div>
                    {selectedMetric === metric && (
                      <div className="text-xs opacity-80">{METRICS[metric].description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-400/10 p-4 text-amber-200"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-medium">Failed to load performance metrics</div>
              <div className="text-sm opacity-80">{error}</div>
            </div>
          </motion.div>
        )}

        {/* Rankings Chart */}
        <Card className={cardBg}>
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <currentMetric.icon className="size-5 text-violet-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentMetric.label} Rankings</h3>
                  <p className="text-xs text-white/60 mt-0.5">{currentMetric.description}</p>
                </div>
              </div>
              <div className="text-xs text-white/60">
                Last {days} {days === 1 ? 'day' : 'days'}
              </div>
            </div>
            
            {loading && !data ? (
              <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="size-8 animate-spin text-violet-400" />
                  <p className="text-sm text-white/60">Loading rankings...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-96 items-center justify-center">
                <p className="text-sm text-white/60">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart 
                  data={chartData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    stroke="#ffffff"
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    label={{ 
                      value: currentMetric.label, 
                      position: 'insideBottom', 
                      offset: -5,
                      style: { fill: '#ffffff', fontSize: 12 }
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="team_id"
                    stroke="#ffffff"
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 20, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                    labelStyle={{ color: "#ffffff", marginBottom: "8px", fontWeight: "bold" }}
                    itemStyle={{ color: "#ffffff", padding: "2px 0" }}
                    formatter={(value: any) => [currentMetric.format(value), currentMetric.label]}
                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {lastUpdated && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white">
            <span>Last updated: {lastUpdated.toLocaleString()}</span>
            <span>•</span>
            <span>Auto-refreshes every 60s</span>
          </div>
        )}
      </div>
    </div>
  );
}



