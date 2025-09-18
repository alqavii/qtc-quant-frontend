'use client';

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const POLL_MS = 60_000;
const API_URL = "https://api.qtcq.xyz/leaderboard";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface LeaderboardItem {
  team_id: string;
  portfolio_value: number | null;
}
interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
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
  if (n === null || n === undefined || Number.isNaN(n)) return "N/A";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
};

const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

const sortRowsDesc = (rows: LeaderboardItem[]) => {
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = a.portfolio_value ?? -Infinity;
    const bv = b.portfolio_value ?? -Infinity;
    if (av === bv) return a.team_id.localeCompare(b.team_id);
    return bv - av;
  });
  return copy;
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function QTCQuantLeaderboard() {
  const [rows, setRows] = useState<LeaderboardItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(false);

  // Light self-tests once
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    try {
      console.groupCollapsed("[QTC Leaderboard] Self-tests");
      console.assert(formatUSD(1234.5) === "$1,234.50", "formatUSD basic");
      console.assert(formatUSD(null) === "N/A", "formatUSD null");
      console.assert(classNames("a", undefined, "c") === "a c", "classNames");
      console.groupEnd();
    } catch {}
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const data: LeaderboardResponse = await fetchJson(API_URL);
      const cleaned = (data?.leaderboard ?? []).map((r) => ({
        team_id: r.team_id,
        portfolio_value: typeof r.portfolio_value === "number" ? r.portfolio_value : null,
      }));
      setRows(sortRowsDesc(cleaned));
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const headerGradient =
    "bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(168,85,247,0.25),transparent_60%),linear-gradient(180deg,#0b0f1c_0%,#0a0a14_100%)]";
  const bodyBg = "bg-[#0a0a14]";

  return (
    <div className={classNames("min-h-svh w-full text-white", bodyBg)} data-testid="qtc-root">
      {/* Top banner / hero */}
      <div className={classNames("relative overflow-hidden", headerGradient)}>
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl"
            initial={{ opacity: 0.2, scale: 0.9 }}
            animate={{ opacity: 0.35, scale: 1.05 }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.35), transparent 50%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-16">
          <div className="flex items-center justify-between gap-4">
            <motion.h1
              layout
              className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight"
            >
              <span className="opacity-80">QTC</span>
              <span className="mx-2 opacity-40">|</span>
              <span className="opacity-95">Quant</span>
              <span className="ml-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs sm:text-sm font-medium text-white/80 ring-1 ring-white/10">
                <Trophy className="size-4" /> Leaderboard
              </span>
            </motion.h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/5 backdrop-blur transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-[1px] active:scale-[0.96] active:bg-white/20 active:shadow-inner"
                onClick={fetchData}
                title="Refresh"
              >
                <RefreshCw className="mr-2 size-4 animate-spin-slow [animation-duration:7s]" /> Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 text-xs sm:text-sm text-white/60">
            <span>Updates every minute</span>
            {lastUpdated && (
              <span className="ml-2">• Last updated: {lastUpdated.toLocaleString()}</span>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-400/10 p-3 text-amber-200"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <div className="font-medium">Couldn't load the leaderboard.</div>
                <div className="text-sm opacity-80">
                  {error.includes("TypeError: Failed to fetch") || error.includes("CORS")
                    ? "If this is blocked by CORS, proxy this request through your backend."
                    : error}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed" data-testid="qtc-table">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-white/50">
                    <th className="w-16 px-4 py-4">Rank</th>
                    <th className="px-4 py-4">Team</th>
                    <th className="w-48 px-4 py-4 text-right">Portfolio Value</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {loading && (!rows || rows.length === 0) &&
                      [...Array(8)].map((_, i) => (
                        <motion.tr
                          key={`skeleton-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <td className="px-4 py-4">
                            <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="ml-auto h-4 w-28 animate-pulse rounded bg-white/10" />
                          </td>
                        </motion.tr>
                      ))}

                    {!loading && rows && rows.length > 0 &&
                      rows.map((r, idx) => (
                        <motion.tr
                          key={r.team_id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.6 }}
                          className={classNames(
                            "border-t border-white/5 hover:bg-white/[0.04]",
                            idx < 3 &&
                              "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
                          )}
                          data-testid={`qtc-row-${idx}`}
                        >
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                                {idx + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="size-8 rounded-xl bg-violet-500/20 ring-1 ring-violet-400/20" />
                                <div className="absolute inset-0 -z-10 rounded-xl blur-xl bg-violet-700/20" />
                              </div>
                              <div className="font-mono text-sm sm:text-base tracking-tight text-white">
                                {r.team_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle text-right">
                            <div className="inline-flex items-center justify-end gap-2 font-medium text-white">
                              <span className="tabular-nums text-white">
                                {formatUSD(r.portfolio_value)}
                              </span>
                              {typeof r.portfolio_value === "number" ? (
                                <ArrowUpRight className="size-4 opacity-40" />
                              ) : (
                                <ArrowDownRight className="size-4 opacity-40" />
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}

                    {!loading && rows && rows.length === 0 && (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td className="px-4 py-8 text-center text-white/60" colSpan={3}>
                          No teams yet.
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer tips */}
        <div className="mt-6 text-xs text-white/40">
          <span>
            Powered by QT Capital{" "}
            <code className="rounded bg-white/5 px-1 py-0.5">QTC-Alpha v1.0</code>
          </span>
          <span className="ml-2">• Polls every 60s • Null values shown as N/A</span>
        </div>
      </div>

      {/* Subtle corner decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rotate-12 rounded-full bg-gradient-to-tr from-violet-700/20 via-fuchsia-600/10 to-transparent blur-3xl" />
      </div>

      <style jsx global>{`
        .animate-spin-slow { animation: spin linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
