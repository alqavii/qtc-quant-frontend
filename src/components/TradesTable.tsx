'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 60_000;
const PAGE_SIZE = 50;

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

const formatUSD = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const parseTradeNumber = (value: string | null | undefined): number => {
  if (!value || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const calculateSlippage = (trade: Trade): number => {
  const executionPrice = parseTradeNumber(trade.execution_price);
  const requestedPrice = parseTradeNumber(trade.requested_price);
  return executionPrice - requestedPrice;
};

const getSlippageColor = (trade: Trade): string => {
  const slippage = calculateSlippage(trade);
  
  if (slippage === 0) return "text-[#808080]"; // Gray for no slippage
  
  if (trade.side === "buy") {
    // For BUY orders: positive slippage (higher execution price) = bad = red
    // negative slippage (lower execution price) = good = green
    return slippage > 0 ? "text-[#FF0000]" : "text-[#00C805]";
  } else {
    // For SELL orders: positive slippage (higher execution price) = good = green
    // negative slippage (lower execution price) = bad = red
    return slippage > 0 ? "text-[#00C805]" : "text-[#FF0000]";
  }
};

const calculateTotalValue = (trade: Trade): number => {
  const executionPrice = parseTradeNumber(trade.execution_price);
  const quantity = parseTradeNumber(trade.quantity);
  return executionPrice * quantity;
};

const formatDateTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
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
export default function TradesTable({ teamId, apiKey }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalTrades, setTotalTrades] = useState<number>(0);

  const fetchData = async () => {
    setError(null);
    try {
      console.log(`TradesTable: Fetching trades for team: ${teamId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/trades?key=${apiKey}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`TradesTable: API response for team ${teamId}:`, {
          count: result.count,
          actualTrades: result.trades?.length || 0,
          teamId: result.team_id,
          firstTradeTeamId: result.trades?.[0]?.team_id
        });
        
        // Filter trades to ensure they belong to the correct team
        const filteredTrades = (result.trades || []).filter((trade: Trade) => trade.team_id === teamId);
        
        setTrades(filteredTrades);
        setTotalTrades(filteredTrades.length); // Use actual count of filtered trades
        setLastUpdated(new Date());
        
        if (filteredTrades.length !== (result.trades || []).length) {
          console.warn(`TradesTable: Filtered out ${(result.trades || []).length - filteredTrades.length} trades for wrong team`);
        }
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

  // Pagination
  const totalPages = Math.ceil(trades.length / PAGE_SIZE);
  const paginatedTrades = trades.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const cardBg = "border-white/10 bg-white/[0.03] backdrop-blur-sm";

  return (
    <Card className={cardBg}>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="size-5 text-cyan-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Trade History</h3>
              <p className="text-xs text-white/60 mt-0.5">
                {totalTrades} total trade{totalTrades !== 1 ? 's' : ''}
              </p>
            </div>
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
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="size-8 animate-spin text-cyan-400" />
              <p className="text-sm text-white/60">Loading trades...</p>
            </div>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Table className="size-8 text-white/40" />
              <p className="text-sm text-white/60">No trades yet</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-white/50 border-b border-white/10">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Requested Price</th>
                    <th className="px-4 py-3 text-right">Execution Price</th>
                    <th className="px-4 py-3 text-right">Slippage</th>
                    <th className="px-4 py-3 text-right">Order Type</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedTrades.map((trade, idx) => (
                      <motion.tr
                        key={`${trade.timestamp}-${trade.symbol}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-white/70">
                          {formatDateTime(trade.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-300 text-sm font-medium ring-1 ring-violet-400/20">
                            {trade.symbol}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={classNames(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ring-1",
                              trade.side === "buy"
                                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20"
                                : "bg-rose-500/10 text-rose-300 ring-rose-400/20"
                            )}
                          >
                            {trade.side === "buy" ? (
                              <ArrowUpRight className="size-3.5" />
                            ) : (
                              <ArrowDownRight className="size-3.5" />
                            )}
                            {trade.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-white">
                          {parseTradeNumber(trade.quantity)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-white">
                          {formatUSD(parseTradeNumber(trade.requested_price))}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-white">
                          {formatUSD(parseTradeNumber(trade.execution_price))}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono">
                          <span className={getSlippageColor(trade)}>
                            {calculateSlippage(trade) > 0 ? "+" : ""}{formatUSD(calculateSlippage(trade))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-white/70">
                          {trade.order_type.toUpperCase()}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-white/60">
                  Showing {currentPage * PAGE_SIZE + 1} to{" "}
                  {Math.min((currentPage + 1) * PAGE_SIZE, trades.length)} of {trades.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm text-white px-3">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
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

