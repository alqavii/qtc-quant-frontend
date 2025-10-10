'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
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

const formatUSD = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return "N/A";
  
  try {
    // Handle very large numbers
    if (Math.abs(n) >= 1e12) {
      return `$${(n / 1e12).toFixed(2)}T`;
    } else if (Math.abs(n) >= 1e9) {
      return `$${(n / 1e9).toFixed(2)}B`;
    } else if (Math.abs(n) >= 1e6) {
      return `$${(n / 1e6).toFixed(2)}M`;
    }
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
};

const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

// Team colors - vibrant and highly distinguishable
const TEAM_COLORS = [
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#14b8a6", // teal
  "#a78bfa", // light purple
  "#fbbf24", // yellow
  "#34d399", // light green
  "#fb7185", // light pink
  "#22d3ee", // light cyan
];

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function TeamHistoricalChart() {
  const [data, setData] = useState<TeamHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [days, setDays] = useState<number>(7);

  const fetchData = async () => {
    setError(null);
    try {
      const response: HistoryResponse = await fetchJson(`${API_URL}?days=${days}&limit=500`);
      setData(response.teams);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to fetch historical data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [days]);

  // Transform data for recharts
  const chartData = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) return [];
    
    try {
      const allTimestamps = new Set<string>();
      Object.values(data).forEach(history => {
        if (Array.isArray(history)) {
          history.forEach(point => {
            if (point && point.timestamp) {
              allTimestamps.add(point.timestamp);
            }
          });
        }
      });

      if (allTimestamps.size === 0) return [];

      const sortedTimestamps = Array.from(allTimestamps).sort();
      
      return sortedTimestamps.map(timestamp => {
        const point: any = { timestamp: new Date(timestamp).getTime() };
        Object.entries(data).forEach(([teamId, history]) => {
          if (Array.isArray(history)) {
            const dataPoint = history.find(h => h && h.timestamp === timestamp);
            const value = dataPoint?.value;
            // Only add valid finite numbers
            point[teamId] = (typeof value === 'number' && isFinite(value)) ? value : null;
          }
        });
        return point;
      });
    } catch (e) {
      console.error('Error transforming chart data:', e);
      return [];
    }
  }, [data]);

  const teams = data ? Object.keys(data) : [];

  const bodyBg = "bg-[#0a0a14]";
  const cardBg = "border-white/10 bg-white/[0.03] backdrop-blur-sm";

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
            <div className="rounded-xl bg-violet-500/20 p-3 ring-1 ring-violet-400/20">
              <TrendingUp className="size-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Portfolio Performance</h2>
              <p className="text-sm text-white/60 mt-1">Historical value comparison across all teams</p>
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
                      ? "bg-violet-500/80 text-white shadow-lg"
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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-400/10 p-4 text-amber-200"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-medium">Failed to load historical data</div>
              <div className="text-sm opacity-80">{error}</div>
            </div>
          </motion.div>
        )}

        {/* Main Chart */}
        <Card className={classNames("mb-6", cardBg)}>
          <CardContent className="p-6">
            {loading && !data ? (
              <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="size-8 animate-spin text-violet-400" />
                  <p className="text-sm text-white/60">Loading historical data...</p>
                </div>
              </div>
            ) : chartData.length === 0 || teams.length === 0 ? (
              <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <AlertTriangle className="size-8 text-white/40" />
                  <p className="text-sm text-white/60">No historical data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <defs>
                    {teams.map((teamId, idx) => (
                      <linearGradient key={teamId} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAM_COLORS[idx % TEAM_COLORS.length]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={TEAM_COLORS[idx % TEAM_COLORS.length]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#ffffff"
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      if (days === 1) {
                        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      }
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis
                    stroke="#ffffff"
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `$${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `$${(value / 1000).toFixed(0)}k`;
                      } else if (value >= 1) {
                        return `$${value.toFixed(0)}`;
                      } else {
                        return `$${value.toFixed(2)}`;
                      }
                    }}
                    domain={['auto', 'auto']}
                    padding={{ top: 20, bottom: 20 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 20, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                    labelStyle={{ color: "#ffffff", marginBottom: "8px" }}
                    itemStyle={{ color: "#ffffff", padding: "2px 0" }}
                    formatter={(value: any) => formatUSD(value)}
                    labelFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      });
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                    formatter={(value) => <span style={{ color: "#ffffff" }}>{value}</span>}
                  />
                  {teams.map((teamId, idx) => (
                    <Line
                      key={teamId}
                      type="monotone"
                      dataKey={teamId}
                      stroke={TEAM_COLORS[idx % TEAM_COLORS.length]}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: TEAM_COLORS[idx % TEAM_COLORS.length], strokeWidth: 2, stroke: '#ffffff' }}
                      connectNulls
                      isAnimationActive={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {lastUpdated && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white">
            <Calendar className="size-3" />
            <span>Last updated: {lastUpdated.toLocaleString()}</span>
            <span>•</span>
            <span>Auto-refreshes every 60s</span>
          </div>
        )}
      </div>
    </div>
  );
}



