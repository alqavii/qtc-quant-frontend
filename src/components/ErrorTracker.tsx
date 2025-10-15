'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
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
interface StrategyError {
  timestamp: string;
  error_type: string;
  message: string;
  strategy: string;
  timeout: boolean;
  phase: string;
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
  return "Failed to load errors";
};

const getErrorIcon = (error: StrategyError) => {
  if (error.timeout) return Clock;
  if (error.error_type.includes('Validation')) return XCircle;
  return AlertTriangle;
};

const getErrorColor = (error: StrategyError) => {
  if (error.timeout) return {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    ring: "ring-amber-400/20",
  };
  if (error.error_type.includes('Validation')) return {
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    ring: "ring-rose-400/20",
  };
  return {
    bg: "bg-orange-500/10",
    text: "text-orange-300",
    ring: "ring-orange-400/20",
  };
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function ErrorTracker({ teamId, apiKey }: Props) {
  const [errors, setErrors] = useState<StrategyError[]>([]);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setFetchError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${teamId}/errors?key=${apiKey}&limit=50`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setErrors(result.errors || []);
        setErrorCount(result.error_count || 0);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setFetchError(formatApiError(errorData));
      }
    } catch (e: any) {
      setFetchError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_MS);
    return () => clearInterval(interval);
  }, [teamId, apiKey]);

  const cardBg = "border-white/10 bg-white/[0.03] backdrop-blur-sm";

  return (
    <Card className={cardBg}>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Strategy Errors</h3>
              <p className="text-xs text-white/60 mt-0.5">
                {errorCount} total error{errorCount !== 1 ? 's' : ''} logged
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

        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-400/10 p-3 text-amber-200"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">{fetchError}</div>
          </motion.div>
        )}

        {loading && errors.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="size-8 animate-spin text-amber-400" />
              <p className="text-sm text-white/60">Loading error logs...</p>
            </div>
          </div>
        ) : errors.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="size-12 text-emerald-400" />
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-1">No Errors!</p>
                <p className="text-sm text-white/60">Your strategy is running smoothly</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {errors.map((error, idx) => {
                const Icon = getErrorIcon(error);
                const colors = getErrorColor(error);

                return (
                  <motion.div
                    key={`${error.timestamp}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.03 }}
                    className={classNames(
                      "p-4 rounded-lg border ring-1 transition-all hover:shadow-lg",
                      colors.bg,
                      colors.ring,
                      "border-white/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={classNames("shrink-0 p-2 rounded-lg", colors.bg, colors.ring, "ring-1")}>
                        <Icon className={classNames("size-5", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={classNames("text-sm font-semibold", colors.text)}>
                              {error.error_type}
                            </span>
                            {error.timeout && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 text-xs font-medium ring-1 ring-amber-400/30">
                                <Clock className="size-3" />
                                Timeout
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/60 text-xs font-medium">
                              {error.phase.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 whitespace-nowrap">
                            {formatDateTime(error.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 font-mono break-all">
                          {error.message}
                        </p>
                        {error.strategy && (
                          <p className="text-xs text-white/50 mt-2">
                            Strategy: {error.strategy}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
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

