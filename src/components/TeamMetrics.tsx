'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 60_000; // Auto-refresh every 60 seconds

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface MetricsData {
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  max_drawdown_percentage: number;
  current_drawdown: number;
  current_drawdown_percentage: number;
  total_return: number;
  total_return_percentage: number;
  annualized_return: number;
  annualized_return_percentage: number;
  annualized_volatility: number;
  annualized_volatility_percentage: number;
  avg_win: number;
  avg_loss: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  current_value: number;
  starting_value: number;
  peak_value: number;
  trough_value: number;
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

const formatNumber = (n: number | null | undefined, decimals: number = 2, fallback: number = 0) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return fallback.toFixed(decimals);
  return n.toFixed(decimals);
};

const formatUSD = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "N/A";
  
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
  return "Failed to load metrics";
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function TeamMetrics({ teamId, apiKey }: Props) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTotalTrades = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/trades?key=${apiKey}&limit=1`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTotalTrades(data.count || 0);
      }
    } catch (e: any) {
      console.error('Failed to fetch total trades:', e);
    }
  };

  const fetchMetrics = async () => {
    setError(null);
    try {
      console.log(`Fetching metrics for team: ${teamId}`);
      
      // Fetch both metrics and total trades in parallel
      const [metricsResponse, tradesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/team/${teamId}/metrics?key=${apiKey}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }),
        fetch(`${API_BASE_URL}/api/v1/team/${teamId}/trades?key=${apiKey}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        })
      ]);

      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setMetrics(data.metrics);
      } else {
        const errorData = await metricsResponse.json().catch(() => ({}));
        setError(formatApiError(errorData));
      }

      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        console.log(`Trades API response for team ${teamId}:`, {
          count: tradesData.count,
          actualTrades: tradesData.trades?.length || 0,
          teamId: tradesData.team_id,
          firstTradeTeamId: tradesData.trades?.[0]?.team_id
        });
        
        // Use the actual count of trades returned, not the API-reported count
        const actualTradeCount = tradesData.trades?.length || 0;
        setTotalTrades(actualTradeCount);
        
        // Verify all trades belong to the correct team
        if (tradesData.trades && tradesData.trades.length > 0) {
          const wrongTeamTrades = tradesData.trades.filter((trade: any) => trade.team_id !== teamId);
          if (wrongTeamTrades.length > 0) {
            console.warn(`Found ${wrongTeamTrades.length} trades for wrong team in response for team ${teamId}`);
          }
        }
      } else {
        const errorData = await tradesResponse.json().catch(() => ({}));
        console.error('Trades API error:', errorData);
      }

      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, POLL_MS);
    return () => clearInterval(interval);
  }, [teamId, apiKey]);

  const cardBg = "border-[#333333] bg-[#000000]";

  if (loading && !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className={cardBg}>
            <CardContent className="p-3">
              <div className="h-20 animate-pulse bg-[#1A1A1A]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={classNames("border-[#FF0000] bg-[#FF0000]/5", cardBg)}>
        <CardContent className="p-3">
          <p className="text-[#FF0000] text-xs uppercase tracking-wider">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const safeInteger = (value: number | null | undefined, fallback = 0) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

  const totalTrades = safeInteger(metrics.total_trades);
  const winningTrades = safeInteger(metrics.winning_trades);
  const losingTrades = safeInteger(metrics.losing_trades);

  const metricCards = [
    {
      label: "Portfolio Value",
      value: formatUSD(metrics.current_value),
      change: metrics.total_return_percentage,
      category: "primary",
    },
    {
      label: "Total Return",
      value: `${formatNumber(metrics.total_return_percentage, 3)}%`,
      change: metrics.total_return_percentage,
      category: "performance",
    },
    {
      label: "Sharpe Ratio",
      value: formatNumber(metrics.sharpe_ratio, 2),
      category: "risk",
    },
    {
      label: "Sortino Ratio",
      value: formatNumber(metrics.sortino_ratio, 2),
      category: "risk",
    },
    {
      label: "Max Drawdown",
      value: `${formatNumber(metrics.max_drawdown_percentage, 2)}%`,
      category: "risk",
    },
    {
      label: "Total Trades",
      value: totalTrades.toString(),
      category: "activity",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {metricCards.map((metric, idx) => {
          const isPositive = metric.change !== undefined ? metric.change >= 0 : null;
          const isPrimary = metric.category === "primary";
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card className={classNames(
                cardBg,
                isPrimary && "border-[#00A0E8]"
              )}>
                <CardContent className="p-3 h-[88px] flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[#808080]">
                        {metric.label}
                      </span>
                      {isPositive !== null && (
                        <div className={classNames(
                          "flex items-center text-[10px] font-bold",
                          isPositive ? "text-[#00C805]" : "text-[#FF0000]"
                        )}>
                          {isPositive ? "▲" : "▼"}
                        </div>
                      )}
                    </div>
                    <div className={classNames(
                      "font-mono font-bold tabular-nums",
                      isPrimary ? "text-2xl text-[#00A0E8]" : "text-xl text-[#CCCCCC]"
                    )}>
                      {metric.value}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {lastUpdated && (
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-[#808080] uppercase tracking-wider">
          <RefreshCw className="size-2" />
          <span>{lastUpdated.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

