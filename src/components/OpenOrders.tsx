'use client';

import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, Clock, TrendingUp, TrendingDown } from "lucide-react";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 30_000; // Poll every 30 seconds for open orders

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface OpenOrder {
  order_id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  order_type: string;
  limit_price: number | null;
  status: string;
  filled_qty: number;
  filled_avg_price: number | null;
  time_in_force: string;
  created_at: string;
  updated_at: string;
  requested_price: number;
  broker_order_id: string;
}

interface OpenOrdersResponse {
  team_id: string;
  open_orders_count: number;
  orders: OpenOrder[];
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatDateTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

const getTimeAgo = (timestamp: string) => {
  try {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${diffHour}h ago`;
  } catch {
    return "N/A";
  }
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function OpenOrders({ teamId, apiKey }: Props) {
  const [data, setData] = useState<OpenOrdersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/orders/open?key=${apiKey}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Failed to fetch open orders");
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

  return (
    <div className="w-full bg-[#000000] border border-[#333333] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#00A0E8]"></div>
          <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">OPEN ORDERS</h2>
          {data && (
            <span className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">
              ({data.open_orders_count} PENDING)
            </span>
          )}
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

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && !data ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="size-4 animate-spin text-[#00A0E8]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">LOADING...</p>
            </div>
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <Clock className="size-4 text-[#808080]" />
              <p className="text-[10px] text-[#808080] uppercase tracking-wider">NO OPEN ORDERS</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#333333] bg-[#0A0A0A]">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-[#808080] uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-[#808080] uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-[#808080] uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-2 text-center text-[10px] font-bold text-[#808080] uppercase tracking-wider">Side</th>
                  <th className="px-4 py-2 text-center text-[10px] font-bold text-[#808080] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-[#808080] uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-[#808080] uppercase tracking-wider">Limit Price</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-[#808080] uppercase tracking-wider">Filled</th>
                  <th className="px-4 py-2 text-center text-[10px] font-bold text-[#808080] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order, idx) => (
                  <tr
                    key={order.order_id}
                    className={classNames(
                      "border-b border-[#333333] hover:bg-[#1A1A1A] transition-colors",
                      idx % 2 === 0 ? "bg-[#000000]" : "bg-[#0A0A0A]"
                    )}
                  >
                    {/* Time */}
                    <td className="px-4 py-2 text-[10px] text-[#CCCCCC] font-mono">
                      <div>{formatDateTime(order.created_at)}</div>
                      <div className="text-[9px] text-[#808080]">{getTimeAgo(order.created_at)}</div>
                    </td>

                    {/* Order ID */}
                    <td className="px-4 py-2 text-[10px] text-[#CCCCCC] font-mono">
                      {order.order_id.substring(0, 8)}...
                    </td>

                    {/* Symbol */}
                    <td className="px-4 py-2 text-[11px] text-[#00A0E8] font-mono font-bold">
                      {order.symbol}
                    </td>

                    {/* Side */}
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {order.side === "buy" ? (
                          <>
                            <TrendingUp className="size-3 text-[#00C805]" />
                            <span className="text-[10px] text-[#00C805] font-mono font-bold">BUY</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="size-3 text-[#FF0000]" />
                            <span className="text-[10px] text-[#FF0000] font-mono font-bold">SELL</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-2 text-center text-[10px] text-[#CCCCCC] font-mono uppercase">
                      {order.order_type}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-2 text-right text-[11px] text-[#CCCCCC] font-mono">
                      {order.quantity}
                    </td>

                    {/* Limit Price */}
                    <td className="px-4 py-2 text-right text-[11px] text-[#CCCCCC] font-mono">
                      {order.limit_price ? formatUSD(order.limit_price) : "-"}
                    </td>

                    {/* Filled */}
                    <td className="px-4 py-2 text-right text-[10px] font-mono">
                      {order.filled_qty > 0 ? (
                        <div>
                          <span className="text-[#00C805]">{order.filled_qty}</span>
                          <span className="text-[#808080]"> / </span>
                          <span className="text-[#CCCCCC]">{order.quantity}</span>
                        </div>
                      ) : (
                        <span className="text-[#808080]">0 / {order.quantity}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 text-center">
                      <span className={classNames(
                        "text-[10px] font-mono font-bold uppercase px-2 py-0.5 border",
                        order.status === "new" ? "text-[#FFAA00] border-[#FFAA00] bg-[#FFAA00]/10" :
                        order.status === "partially_filled" ? "text-[#00A0E8] border-[#00A0E8] bg-[#00A0E8]/10" :
                        order.status === "accepted" ? "text-[#00C805] border-[#00C805] bg-[#00C805]/10" :
                        "text-[#808080] border-[#333333] bg-[#1A1A1A]"
                      )}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
