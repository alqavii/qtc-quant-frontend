'use client';

import React, { useState } from "react";
import { Monitor, TrendingUp, Activity, Users, BarChart3 } from "lucide-react";
import QTCQuantLeaderboard from "../components/QTCQuantLeaderboard";
import TeamHistoricalChart from "../components/TeamHistoricalChart";
import LeaderboardHistory from "../components/LeaderboardHistory";
import Link from "next/link";

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function Page() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#CCCCCC]">
      {/* Terminal Header */}
      <div className="border-b border-[#333333] bg-[#000000]">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            {/* Left: Terminal Branding */}
            <div className="flex items-center gap-3">
              <div className="border border-[#00A0E8] px-2 py-1">
                <Monitor className="size-4 text-[#00A0E8]" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#00A0E8] uppercase tracking-wider">
                  QTC TERMINAL
                </h1>
                <p className="text-[10px] text-[#808080] uppercase tracking-wider">
                  QUANTITATIVE TRADING COMPETITION
                </p>
              </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-2">
              <Link
                href="/submit"
                className="border border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] text-[#CCCCCC] text-xs uppercase tracking-wider px-3 py-1 transition-all"
              >
                <div className="flex items-center gap-1">
                  <BarChart3 className="size-3" />
                  <span>SUBMIT STRATEGY</span>
                </div>
              </Link>
              <Link
                href="/dashboard"
                className="border border-[#00A0E8] bg-[#00A0E8] hover:bg-[#00B8FF] text-[#000000] text-xs uppercase tracking-wider px-3 py-1 font-bold transition-all"
              >
                <div className="flex items-center gap-1">
                  <Activity className="size-3" />
                  <span>TEAM DASHBOARD</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Market Status Bar */}
      <div className="border-b border-[#333333] bg-[#0A0A0A] px-3 py-1">
        <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00C805] animate-pulse"></div>
            <span className="text-[#808080]">MARKET:</span>
            <span className="text-[#00C805] font-bold">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#808080]">UPDATE FREQ:</span>
            <span className="text-[#CCCCCC]">60S</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#808080]">DATA FEED:</span>
            <span className="text-[#CCCCCC]">REAL-TIME</span>
          </div>
        </div>
      </div>

      {/* Main MDI Grid Layout */}
      <div className="p-2 grid grid-cols-12 gap-2" style={{ height: 'calc(100vh - 96px)' }}>
        {/* Left Column: Leaderboard (4 columns) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
          <div className="flex-1 border border-[#333333] bg-[#000000] flex flex-col">
            <div className="border-b border-[#333333] px-3 py-2 bg-[#0A0A0A]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#00A0E8]"></div>
                <Users className="size-3 text-[#00A0E8]" />
                <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">
                  TEAM RANKINGS
                </h2>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <QTCQuantLeaderboard onTeamSelect={setSelectedTeam} />
            </div>
          </div>
        </div>

        {/* Right Column: Charts (8 columns) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-2">
          {/* Top: Team Historical Performance */}
          <div className="flex-1 border border-[#333333] bg-[#000000] flex flex-col">
            <div className="border-b border-[#333333] px-3 py-2 bg-[#0A0A0A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#00A0E8]"></div>
                  <TrendingUp className="size-3 text-[#00A0E8]" />
                  <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">
                    TEAM PERFORMANCE
                  </h2>
                  {selectedTeam && (
                    <span className="text-[10px] text-[#FFAA00] font-mono">
                      [{selectedTeam.toUpperCase()}]
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#808080] uppercase tracking-wider">
                  CLICK TEAM TO SELECT
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <TeamHistoricalChart selectedTeam={selectedTeam} />
            </div>
          </div>

          {/* Bottom: Market Overview / All Teams */}
          <div className="flex-1 border border-[#333333] bg-[#000000] flex flex-col">
            <div className="border-b border-[#333333] px-3 py-2 bg-[#0A0A0A]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#00A0E8]"></div>
                <BarChart3 className="size-3 text-[#00A0E8]" />
                <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">
                  MARKET OVERVIEW - ALL TEAMS
                </h2>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <LeaderboardHistory />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#333333] bg-[#000000] px-3 py-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="text-[#808080]">QTC TERMINAL v1.0</span>
            <span className="text-[#808080]">|</span>
            <span className="text-[#CCCCCC]">
              {new Date().toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#808080]">API:</span>
            <span className="text-[#00C805]">CONNECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
