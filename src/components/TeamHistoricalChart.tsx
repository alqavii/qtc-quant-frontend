'use client';

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    // FULL PRECISION - Terminal style
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

// Terminal colors - functional, not decorative
const TEAM_COLORS = [
  "#00A0E8", // bloomberg blue
  "#00C805", // terminal green
  "#FFAA00", // amber warning
  "#FF0000", // red
  "#00FFFF", // cyan
  "#FF00FF", // magenta
  "#FFFF00", // yellow
  "#FFFFFF", // white
  "#808080", // gray
  "#FF8800", // orange
  "#88FF00", // lime
  "#00FF88", // spring green
];

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
interface Props {
  selectedTeam?: string | null;
}

export default function TeamHistoricalChart({ selectedTeam }: Props) {
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
  const filteredTeams = selectedTeam ? teams.filter(t => t === selectedTeam) : teams;

  return (
    <div className="w-full h-full bg-[#000000] text-[#CCCCCC] flex flex-col">
      {/* Control Bar */}
      <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={classNames(
                "border text-[10px] uppercase tracking-wider px-2 py-1 font-mono transition-colors",
                days === d
                  ? "border-[#00A0E8] bg-[#00A0E8] text-[#000000]"
                  : "border-[#333333] bg-[#0A0A0A] text-[#808080] hover:bg-[#1A1A1A] hover:text-[#CCCCCC]"
              )}
            >
              {d}D
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
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
        ) : chartData.length === 0 || teams.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="size-4 text-[#808080]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">NO DATA</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#333333" />
              <XAxis
                dataKey="timestamp"
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: "monospace" }}
                tickLine={{ stroke: "#333333" }}
                axisLine={{ stroke: "#333333" }}
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  if (days === 1) {
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  }
                  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                }}
                height={30}
              />
              <YAxis
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: "monospace" }}
                tickLine={{ stroke: "#333333" }}
                axisLine={{ stroke: "#333333" }}
                tickFormatter={(value) => {
                  // FULL PRECISION - Terminal style, just formatted compactly
                  return value.toLocaleString('en-US');
                }}
                width={80}
                domain={['auto', 'auto']}
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
                formatter={(value: any) => formatUSD(value)}
                labelFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "4px" }}
                iconType="line"
                formatter={(value) => <span style={{ color: "#CCCCCC", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase" }}>{value}</span>}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
              {filteredTeams.map((teamId, idx) => (
                <Line
                  key={teamId}
                  type="monotone"
                  dataKey={teamId}
                  stroke={TEAM_COLORS[idx % TEAM_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: TEAM_COLORS[idx % TEAM_COLORS.length], strokeWidth: 0 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}



