'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 60_000;

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface Trade {
  team_id: string;
  timestamp: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: string; // API returns as string
  requested_price: string; // API returns as string
  execution_price: string; // API returns as string
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

const parseTradeNumber = (value: string | null | undefined): number => {
  if (!value || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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
  return "Failed to load trades";
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function TradeCountChart({ teamId, apiKey }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<'hour' | 'day'>('day');

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

  // Transform trades into time-bucketed counts
  const chartData = React.useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const buckets: { [key: string]: { buys: number; sells: number; timestamp: number } } = {};

    trades.forEach((trade) => {
      const date = new Date(trade.timestamp);
      let bucketKey: string;

      if (groupBy === 'hour') {
        // Group by hour
        bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        // Group by day
        bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          buys: 0,
          sells: 0,
          timestamp: new Date(bucketKey).getTime(),
        };
      }

      if (trade.side === 'buy') {
        buckets[bucketKey].buys += 1;
      } else {
        buckets[bucketKey].sells += 1;
      }
    });

    return Object.entries(buckets)
      .map(([key, value]) => ({
        time: key,
        timestamp: value.timestamp,
        buys: value.buys,
        sells: value.sells,
        total: value.buys + value.sells,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [trades, groupBy]);

  const cardBg = "border-white/10 bg-white/[0.03] backdrop-blur-sm";

  return (
    <Card className={cardBg}>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-cyan-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Trade Activity</h3>
              <p className="text-xs text-white/60 mt-0.5">Number of trades over time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Group by selector */}
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(['hour', 'day'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setGroupBy(option)}
                  className={classNames(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                    groupBy === option
                      ? "bg-cyan-500/80 text-white shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {option === 'hour' ? 'Hourly' : 'Daily'}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
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
            className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-400/10 p-3 text-amber-200"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">{error}</div>
          </motion.div>
        )}

        {loading && trades.length === 0 ? (
          <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="size-8 animate-spin text-cyan-400" />
              <p className="text-sm text-white/60">Loading trade activity...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <BarChart3 className="size-8 text-white/40" />
              <p className="text-sm text-white/60">No trade data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                stroke="#ffffff"
                tick={{ fill: "#ffffff", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => {
                  if (groupBy === 'hour') {
                    return value.split(' ')[1]; // Show only time
                  }
                  return value; // Show full date
                }}
              />
              <YAxis
                stroke="#ffffff"
                tick={{ fill: "#ffffff", fontSize: 12 }}
                allowDecimals={false}
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
                formatter={(value: any, name: string) => {
                  const labels: { [key: string]: string } = {
                    buys: "Buy Orders",
                    sells: "Sell Orders",
                    total: "Total Trades",
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => {
                  const labels: { [key: string]: string } = {
                    buys: "Buy Orders",
                    sells: "Sell Orders",
                    total: "Total Trades",
                  };
                  return <span style={{ color: "#ffffff" }}>{labels[value] || value}</span>;
                }}
              />
              <Bar dataKey="buys" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sells" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {lastUpdated && (
          <div className="mt-4 text-xs text-white/50 text-right">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

