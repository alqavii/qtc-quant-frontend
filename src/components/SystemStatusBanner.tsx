'use client';

import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const POLL_MS = 30_000; // Poll every 30 seconds

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface SystemStatus {
  status: string;
  timestamp: string;
  market: {
    is_open: boolean;
    status: string;
  };
  orchestrator: {
    running: boolean;
    last_heartbeat: string;
    execution_frequency_seconds: number;
    teams_loaded: number;
    teams_active: number;
  };
  data_feed: {
    last_update: string;
    seconds_since_update: number;
    status: string;
    symbols_tracked: number;
  };
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

const getStatusColor = (status: string, isHealthy: boolean) => {
  if (!isHealthy) return "text-[#FF0000]";
  if (status === "healthy" || status === "operational") return "text-[#00C805]";
  if (status === "delayed") return "text-[#FFAA00]";
  return "text-[#808080]";
};

const getStatusIcon = (isHealthy: boolean, isRunning: boolean) => {
  if (!isHealthy || !isRunning) return <AlertTriangle className="size-3" />;
  return <CheckCircle className="size-3" />;
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function SystemStatusBanner() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/status`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStatus(result);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Failed to fetch system status");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="w-full bg-[#000000] border-b border-[#333333] px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-3 animate-spin text-[#00A0E8]" />
            <span className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">
              LOADING SYSTEM STATUS...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="w-full bg-[#000000] border-b border-[#FF0000] px-2 py-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-3 text-[#FF0000]" />
          <span className="text-[10px] text-[#FF0000] uppercase tracking-wider font-mono">
            SYSTEM STATUS ERROR: {error}
          </span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const isSystemHealthy = status.status === "operational";
  const isMarketOpen = status.market.is_open;
  const isOrchestratorRunning = status.orchestrator.running;
  const isDataFeedHealthy = status.data_feed.status === "healthy";

  return (
    <div className="w-full bg-[#000000] border-b border-[#333333] px-2 py-1">
      <div className="flex items-center justify-between">
        {/* Left side - System status indicators */}
        <div className="flex items-center gap-4">
          {/* Market Status */}
          <div className="flex items-center gap-1">
            {getStatusIcon(isMarketOpen, isMarketOpen)}
            <span className={classNames(
              "text-[10px] uppercase tracking-wider font-mono",
              getStatusColor(isMarketOpen ? "healthy" : "unhealthy", isMarketOpen)
            )}>
              {isMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
            </span>
          </div>

          {/* Orchestrator Status */}
          <div className="flex items-center gap-1">
            {getStatusIcon(isOrchestratorRunning, isOrchestratorRunning)}
            <span className={classNames(
              "text-[10px] uppercase tracking-wider font-mono",
              getStatusColor(isOrchestratorRunning ? "healthy" : "unhealthy", isOrchestratorRunning)
            )}>
              {isOrchestratorRunning ? "TRADING ACTIVE" : "TRADING PAUSED"}
            </span>
          </div>

          {/* Teams Status */}
          <div className="flex items-center gap-1">
            <Activity className="size-3 text-[#00A0E8]" />
            <span className="text-[10px] text-[#CCCCCC] uppercase tracking-wider font-mono">
              {status.orchestrator.teams_active}/{status.orchestrator.teams_loaded} TEAMS
            </span>
          </div>

          {/* Data Feed Status */}
          <div className="flex items-center gap-1">
            {getStatusIcon(isDataFeedHealthy, isDataFeedHealthy)}
            <span className={classNames(
              "text-[10px] uppercase tracking-wider font-mono",
              getStatusColor(status.data_feed.status, isDataFeedHealthy)
            )}>
              FEED: {formatTimeAgo(status.data_feed.seconds_since_update)} | {status.data_feed.symbols_tracked} SYMBOLS
            </span>
          </div>
        </div>

        {/* Right side - Last updated and refresh */}
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">
              {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchStatus}
            className="border border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] p-1 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="size-3 text-[#00A0E8]" />
          </button>
        </div>
      </div>

      {/* Error overlay if system has issues */}
      {error && (
        <div className="mt-1 pt-1 border-t border-[#333333]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3 text-[#FF0000]" />
            <span className="text-[10px] text-[#FF0000] uppercase tracking-wider font-mono">
              {error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
