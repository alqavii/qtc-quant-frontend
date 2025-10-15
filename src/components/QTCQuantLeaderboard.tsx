'use client';

import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

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

interface Props {
  onTeamSelect?: (teamId: string | null) => void;
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
export default function QTCQuantLeaderboard({ onTeamSelect }: Props) {
  const [rows, setRows] = useState<LeaderboardItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

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

  const handleTeamClick = (teamId: string) => {
    const newSelection = selectedTeam === teamId ? null : teamId;
    setSelectedTeam(newSelection);
    onTeamSelect?.(newSelection);
  };

  return (
    <div className="w-full h-full bg-[#000000] text-[#CCCCCC] flex flex-col" data-testid="qtc-root">
      {/* Error Display */}
      {error && (
        <div className="border-b border-[#FF0000] bg-[#FF0000]/10 p-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3 shrink-0 text-[#FF0000]" />
            <div className="text-[10px] text-[#FF0000] uppercase tracking-wider">{error}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !rows ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="size-6 animate-spin text-[#00A0E8]" />
            <p className="text-[10px] text-[#808080] uppercase tracking-wider">LOADING...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse" data-testid="qtc-table">
            <thead className="sticky top-0 bg-[#0A0A0A] border-b border-[#333333]">
              <tr className="text-left text-[10px] uppercase tracking-wider text-[#808080]">
                <th className="w-12 px-2 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">TEAM</th>
                <th className="px-2 py-2 text-right font-medium">VALUE</th>
                <th className="w-16 px-2 py-2 text-center font-medium">CHG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {rows && rows.map((r, idx) => {
                const isSelected = selectedTeam === r.team_id;
                const rankClass = idx === 0 ? "text-[#FFAA00]" : idx === 1 ? "text-[#CCCCCC]" : idx === 2 ? "text-[#CD7F32]" : "text-[#808080]";
                
                return (
                  <tr
                    key={r.team_id}
                    onClick={() => handleTeamClick(r.team_id)}
                    className={classNames(
                      "transition-colors cursor-pointer border-l-2",
                      isSelected
                        ? "bg-[#00A0E8]/10 border-l-[#00A0E8] hover:bg-[#00A0E8]/20"
                        : "border-l-transparent hover:bg-[#1A1A1A]"
                    )}
                  >
                    <td className="px-2 py-2">
                      <span className={classNames("text-xs font-bold font-mono tabular-nums", rankClass)}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#CCCCCC]">
                          {r.team_id}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-[#00A0E8]">●</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className="text-xs font-mono tabular-nums text-[#CCCCCC]">
                        {formatUSD(r.portfolio_value)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {typeof r.portfolio_value === "number" && r.portfolio_value >= 10000 ? (
                        <span className="text-[10px] text-[#00C805] font-bold">▲</span>
                      ) : typeof r.portfolio_value === "number" ? (
                        <span className="text-[10px] text-[#FF0000] font-bold">▼</span>
                      ) : (
                        <span className="text-[10px] text-[#808080]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && rows && rows.length === 0 && (
                <tr>
                  <td className="px-2 py-8 text-center text-[#808080] text-[10px] uppercase tracking-wider" colSpan={4}>
                    NO DATA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Footer */}
      {lastUpdated && (
        <div className="border-t border-[#333333] px-2 py-1 bg-[#0A0A0A]">
          <div className="text-[10px] text-[#808080] uppercase tracking-wider">
            {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
