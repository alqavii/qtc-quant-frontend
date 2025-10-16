'use client';

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart3, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 60_000;

// Color palette for different symbols
const SYMBOL_COLORS = [
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
// TYPES
// ----------------------------------------------------------------------------
interface Trade {
  team_id: string;
  timestamp: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  requested_price: string;
  execution_price: string;
  order_type: string;
  broker_order_id: string | null;
}

interface Props {
  teamId: string;
  apiKey: string;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

const formatApiError = (errorData: any): string => {
  if (errorData.detail) {
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
    }
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    }
  }
  return "Failed to load trades";
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function AssetTradesChart({ teamId, apiKey }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<'hour' | 'day'>('hour');

  const fetchData = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/trades?key=${apiKey}&limit=1000`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTrades(result.trades || []);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(formatApiError(errorData));
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_MS);
    return () => clearInterval(interval);
  }, [teamId, apiKey]);

  // Transform trades into time-bucketed counts per symbol
  const { chartData, symbols } = React.useMemo(() => {
    if (!trades || trades.length === 0) return { chartData: [], symbols: [] };

    // Get all unique symbols
    const symbolSet = new Set<string>();
    trades.forEach((trade) => {
      symbolSet.add(trade.symbol);
    });
    const uniqueSymbols = Array.from(symbolSet).sort();

    // Create time buckets
    const buckets: { [key: string]: { [symbol: string]: number; timestamp: number } } = {};

    trades.forEach((trade) => {
      const date = new Date(trade.timestamp);
      let bucketKey: string;

      if (groupBy === 'hour') {
        bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { timestamp: new Date(bucketKey).getTime() };
        uniqueSymbols.forEach(symbol => {
          buckets[bucketKey][symbol] = 0;
        });
      }

      buckets[bucketKey][trade.symbol] = (buckets[bucketKey][trade.symbol] || 0) + 1;
    });

    const transformedData = Object.entries(buckets)
      .map(([key, value]) => ({
        time: key,
        ...value
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return { chartData: transformedData, symbols: uniqueSymbols };
  }, [trades, groupBy]);

  const cardBg = "border-[#333333] bg-[#000000]";

  return (
    <Card className={cardBg}>
      <CardContent className="p-3">
        <div className="mb-3 flex items-center justify-between border-b border-[#333333] pb-2">
          <div>
            <h3 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">ASSET TRADE ACTIVITY</h3>
            <p className="text-[10px] text-[#808080] mt-0.5 uppercase tracking-wider">TRADE COUNT PER SYMBOL OVER TIME</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Time grouping selector */}
            <div className="flex gap-1 border border-[#333333]">
              {[
                { value: 'hour', label: 'H' },
                { value: 'day', label: 'D' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupBy(option.value as 'hour' | 'day')}
                  className={classNames(
                    "px-2 py-1 text-[10px] uppercase tracking-wider font-mono transition-colors",
                    groupBy === option.value
                      ? "bg-[#00A0E8] text-[#000000]"
                      : "bg-[#000000] text-[#808080] hover:bg-[#1A1A1A] hover:text-[#CCCCCC]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <Button
              variant="ghost"
              className="border border-[#333333] bg-[#000000] hover:bg-[#1A1A1A] text-[#CCCCCC] text-xs uppercase tracking-wider px-2 py-1 h-auto"
              onClick={fetchData}
              title="Refresh"
            >
              <RefreshCw className="size-3" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 border border-[#FF0000] bg-[#FF0000]/10 p-2 text-[#FF0000]">
            <AlertTriangle className="size-3 shrink-0" />
            <div className="text-[10px] uppercase tracking-wider">{error}</div>
          </div>
        )}

        {loading && trades.length === 0 ? (
          <div className="flex h-80 items-center justify-center border border-[#333333]">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="size-6 animate-spin text-[#00A0E8]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">LOADING...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center border border-[#333333]">
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="size-6 text-[#808080]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">NO TRADES</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="1 1" stroke="#333333" />
              <XAxis
                dataKey="timestamp"
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: "#333333" }}
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  if (groupBy === 'hour') {
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  }
                  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                }}
              />
              <YAxis
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: "#333333" }}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000",
                  border: "1px solid #333333",
                  borderRadius: "0px",
                  padding: "8px",
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
                labelStyle={{ color: "#00A0E8", marginBottom: "4px", fontSize: '10px' }}
                itemStyle={{ color: "#CCCCCC", padding: "2px 0", fontSize: '11px' }}
                formatter={(value: any, name: string) => [Math.round(value), `${name} trades`]}
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
                wrapperStyle={{ paddingTop: "12px" }}
                iconType="plainline"
                formatter={(value) => <span style={{ color: "#CCCCCC", fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }}>{value}</span>}
              />
              {symbols.map((symbol, index) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={SYMBOL_COLORS[index % SYMBOL_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: SYMBOL_COLORS[index % SYMBOL_COLORS.length], stroke: '#000000', strokeWidth: 1 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {lastUpdated && (
          <div className="mt-3 pt-2 border-t border-[#333333] text-[10px] text-[#808080] uppercase tracking-wider">
            Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
