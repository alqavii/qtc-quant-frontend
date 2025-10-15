'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";
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
interface PortfolioSnapshot {
  timestamp: string;
  cash: number;
  market_value: number;
  positions: {
    [symbol: string]: {
      symbol: string;
      quantity: number;
      side: string;
      avg_cost: number;
      value: number;
      pnl_unrealized: number;
    };
  };
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

const formatUSD = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return "N/A";
  
  if (Math.abs(n) >= 1e6) {
    return `$${(n / 1e6).toFixed(2)}M`;
  } else if (Math.abs(n) >= 1e3) {
    return `$${(n / 1e3).toFixed(1)}k`;
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatApiError = (errorData: any): string => {
  // Handle FastAPI validation errors (422)
  if (errorData.detail) {
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
    }
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    }
  }
  return "Failed to load portfolio history";
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function PortfolioHistoryChart({ teamId, apiKey }: Props) {
  const [data, setData] = useState<PortfolioSnapshot[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [days, setDays] = useState<number>(7);

  const fetchData = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/portfolio-history?key=${apiKey}&days=${days}&limit=1000`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result.snapshots || []);
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
  }, [teamId, apiKey, days]);

  // Transform data for chart
  const { chartData, symbols } = React.useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], symbols: [] };

    // Get all unique symbols across all snapshots
    const allSymbols = new Set<string>();
    data.forEach((snapshot) => {
      Object.keys(snapshot.positions || {}).forEach((symbol) => {
        allSymbols.add(symbol);
      });
    });

    const uniqueSymbols = Array.from(allSymbols).sort();

    const transformedData = data.map((snapshot) => {
      // market_value already includes cash, so use it as total_value
      const point: any = {
        timestamp: new Date(snapshot.timestamp).getTime(),
        total_value: snapshot.market_value,
        cash: snapshot.cash,
      };

      // Add each symbol's value
      uniqueSymbols.forEach((symbol) => {
        const position = snapshot.positions?.[symbol];
        point[symbol] = position?.value || 0;
      });

      return point;
    });

    return { chartData: transformedData, symbols: uniqueSymbols };
  }, [data]);

  const cardBg = "border-[#333333] bg-[#000000]";

  return (
    <Card className={cardBg}>
      <CardContent className="p-3">
        <div className="mb-3 flex items-center justify-between border-b border-[#333333] pb-2">
          <div>
            <h3 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">PORTFOLIO VALUE</h3>
            <p className="text-[10px] text-[#808080] mt-0.5 uppercase tracking-wider">TOTAL VALUE + CASH + INDIVIDUAL ASSETS</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Time period selector */}
            <div className="flex gap-1 border border-[#333333]">
              {[1, 7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={classNames(
                    "px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-all",
                    days === d
                      ? "bg-[#00A0E8] text-[#000000]"
                      : "text-[#808080] hover:text-[#CCCCCC] hover:bg-[#1A1A1A]"
                  )}
                >
                  {d === 1 ? '1D' : `${d}D`}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="border border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] h-auto px-2 py-1"
              onClick={fetchData}
              title="Refresh"
            >
              <RefreshCw className="size-3 text-[#808080]" />
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 flex items-start gap-2 border border-[#FF0000] bg-[#FF0000]/10 p-2"
          >
            <AlertTriangle className="mt-0.5 size-3 shrink-0 text-[#FF0000]" />
            <div className="text-[10px] text-[#FF0000] uppercase tracking-wider">{error}</div>
          </motion.div>
        )}

        {loading && !data ? (
          <div className="flex h-80 items-center justify-center border border-[#333333]">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="size-6 animate-spin text-[#00A0E8]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">LOADING...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center border border-[#333333]">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="size-6 text-[#808080]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">NO DATA</p>
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
                  if (days === 1) {
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  }
                  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                }}
              />
              <YAxis
                stroke="#808080"
                tick={{ fill: "#808080", fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: "#333333" }}
                tickFormatter={(value) => formatUSD(value)}
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
                wrapperStyle={{ paddingTop: "12px" }}
                iconType="plainline"
                formatter={(value) => {
                  const labels: { [key: string]: string } = {
                    total_value: "TOTAL",
                    cash: "CASH",
                  };
                  return <span style={{ color: "#CCCCCC", fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }}>{labels[value] || value}</span>;
                }}
              />
              <Line
                type="monotone"
                dataKey="total_value"
                stroke="#00A0E8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#00A0E8", stroke: '#000000', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="cash"
                stroke="#00C805"
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 2"
              />
              {symbols.map((symbol, index) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={SYMBOL_COLORS[index % SYMBOL_COLORS.length]}
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="1 1"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {lastUpdated && (
          <div className="mt-2 text-[10px] text-[#808080] text-right uppercase tracking-wider">
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

