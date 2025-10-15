'use client';

import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Activity, Zap, Target, AlertCircle } from "lucide-react";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 60_000; // Poll every 60 seconds

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface ExecutionHealth {
  team_id: string;
  timestamp: string;
  strategy: {
    entry_point: string;
    repo_path: string;
    status: string;
    last_uploaded: string;
    run_24_7: boolean;
  };
  execution: {
    is_active: boolean;
    last_execution: string;
    seconds_since_last: number;
    total_executions_today: number;
    successful_executions: number;
    failed_executions: number;
    success_rate_percentage: number;
  };
  errors: {
    error_count: number;
    timeout_count: number;
    last_error: {
      timestamp: string;
      error_type: string;
      message: string;
    } | null;
  };
  performance: {
    avg_execution_time_ms: number;
    approaching_timeout: boolean;
    timeout_risk: string;
    timeout_limit_seconds: number;
  };
  trading: {
    total_trades_today: number;
    signal_rate_percentage: number;
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

const formatTimeAgo = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};

const formatDateTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

const getStatusColor = (status: string) => {
  if (status === "active") return "text-[#00C805]";
  if (status === "idle") return "text-[#FFAA00]";
  return "text-[#FF0000]";
};

const getRiskColor = (risk: string) => {
  if (risk === "low") return "text-[#00C805]";
  if (risk === "medium") return "text-[#FFAA00]";
  return "text-[#FF0000]";
};

const getSuccessRateColor = (rate: number) => {
  if (rate >= 95) return "text-[#00C805]";
  if (rate >= 80) return "text-[#FFAA00]";
  return "text-[#FF0000]";
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function TeamExecutionHealth({ teamId, apiKey }: Props) {
  const [health, setHealth] = useState<ExecutionHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/execution-health?key=${apiKey}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setHealth(result);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Failed to fetch execution health");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, POLL_MS);
    return () => clearInterval(interval);
  }, [teamId, apiKey]);

  if (loading && !health) {
    return (
      <div className="w-full bg-[#000000] border border-[#333333] flex flex-col">
        <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#00A0E8]"></div>
            <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">STRATEGY EXECUTION HEALTH</h2>
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="size-4 animate-spin text-[#00A0E8]" />
            <p className="text-[10px] text-[#808080] uppercase tracking-wider">LOADING...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="w-full bg-[#000000] border border-[#333333] flex flex-col">
        <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#00A0E8]"></div>
            <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">STRATEGY EXECUTION HEALTH</h2>
          </div>
        </div>
        <div className="border-b border-[#FF0000] bg-[#FF0000]/10 px-2 py-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3 shrink-0 text-[#FF0000]" />
            <div className="text-[10px] text-[#FF0000] uppercase tracking-wider">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="w-full bg-[#000000] border border-[#333333] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#333333] bg-[#0A0A0A] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#00A0E8]"></div>
          <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">STRATEGY EXECUTION HEALTH</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">
              {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchHealth}
            className="border border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] p-1 transition-colors"
            title="Refresh Health"
          >
            <RefreshCw className="size-3 text-[#00A0E8]" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 p-1">
        <div className="grid grid-cols-12 gap-1 h-full">
          
          {/* Strategy Status (3 columns) */}
          <div className="col-span-3 border border-[#333333] bg-[#0A0A0A] p-2 flex flex-col">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-2">STRATEGY STATUS</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {health.strategy.status === "active" ? (
                  <CheckCircle className="size-3 text-[#00C805]" />
                ) : (
                  <AlertTriangle className="size-3 text-[#FF0000]" />
                )}
                <span className={classNames(
                  "text-[10px] uppercase tracking-wider font-mono font-bold",
                  getStatusColor(health.strategy.status)
                )}>
                  {health.strategy.status}
                </span>
              </div>
              <div className="text-[10px] text-[#CCCCCC] font-mono">
                {health.strategy.entry_point}
              </div>
              <div className="text-[10px] text-[#808080] font-mono">
                Last Upload: {formatDateTime(health.strategy.last_uploaded)}
              </div>
              <div className="text-[10px] text-[#808080]">
                24/7: {health.strategy.run_24_7 ? "YES" : "NO"}
              </div>
            </div>
          </div>

          {/* Execution Stats (3 columns) */}
          <div className="col-span-3 border border-[#333333] bg-[#0A0A0A] p-2 flex flex-col">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-2">EXECUTION STATS</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Success Rate:</span>
                <span className={classNames(
                  "text-[10px] font-mono font-bold",
                  getSuccessRateColor(health.execution.success_rate_percentage)
                )}>
                  {health.execution.success_rate_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Executions Today:</span>
                <span className="text-[10px] text-[#CCCCCC] font-mono">
                  {health.execution.total_executions_today}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Failed:</span>
                <span className="text-[10px] text-[#FF0000] font-mono">
                  {health.execution.failed_executions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Last Execution:</span>
                <span className="text-[10px] text-[#CCCCCC] font-mono">
                  {formatTimeAgo(health.execution.seconds_since_last)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance (3 columns) */}
          <div className="col-span-3 border border-[#333333] bg-[#0A0A0A] p-2 flex flex-col">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-2">PERFORMANCE</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Avg Time:</span>
                <span className="text-[10px] text-[#CCCCCC] font-mono">
                  {health.performance.avg_execution_time_ms}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Timeout Risk:</span>
                <span className={classNames(
                  "text-[10px] font-mono font-bold",
                  getRiskColor(health.performance.timeout_risk)
                )}>
                  {health.performance.timeout_risk.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Timeouts:</span>
                <span className="text-[10px] text-[#FF0000] font-mono">
                  {health.errors.timeout_count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Limit:</span>
                <span className="text-[10px] text-[#808080] font-mono">
                  {health.performance.timeout_limit_seconds}s
                </span>
              </div>
            </div>
          </div>

          {/* Trading Activity (3 columns) */}
          <div className="col-span-3 border border-[#333333] bg-[#0A0A0A] p-2 flex flex-col">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-2">TRADING ACTIVITY</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Trades Today:</span>
                <span className="text-[10px] text-[#CCCCCC] font-mono">
                  {health.trading.total_trades_today}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Signal Rate:</span>
                <span className="text-[10px] text-[#CCCCCC] font-mono">
                  {health.trading.signal_rate_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Currently Active:</span>
                <span className={classNames(
                  "text-[10px] font-mono font-bold",
                  health.execution.is_active ? "text-[#00C805]" : "text-[#808080]"
                )}>
                  {health.execution.is_active ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">Total Errors:</span>
                <span className="text-[10px] text-[#FF0000] font-mono">
                  {health.errors.error_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Messages */}
      {health.performance.approaching_timeout && (
        <div className="border-t border-[#FFAA00] bg-[#FFAA00]/10 px-2 py-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-3 shrink-0 text-[#FFAA00]" />
            <div className="text-[10px] text-[#FFAA00] uppercase tracking-wider">
              WARNING: STRATEGY APPROACHING TIMEOUT LIMIT ({health.performance.avg_execution_time_ms}ms / {health.performance.timeout_limit_seconds}s)
            </div>
          </div>
        </div>
      )}

      {health.errors.last_error && (
        <div className="border-t border-[#FF0000] bg-[#FF0000]/10 px-2 py-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3 shrink-0 text-[#FF0000]" />
            <div className="text-[10px] text-[#FF0000] uppercase tracking-wider">
              LAST ERROR: {health.errors.last_error.error_type} - {health.errors.last_error.message} ({formatDateTime(health.errors.last_error.timestamp)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
