'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key, LogOut, Activity, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TeamMetrics from "@/components/TeamMetrics";
import TeamExecutionHealth from "@/components/TeamExecutionHealth";
import StrategyUpload from "@/components/StrategyUpload";
import OpenOrders from "@/components/OpenOrders";
import PortfolioHistoryChart from "@/components/PortfolioHistoryChart";
import PositionBreakdownChart from "@/components/PositionBreakdownChart";
import TradesTable from "@/components/TradesTable";
import TradeCountChart from "@/components/TradeCountChart";
import AssetTradesChart from "@/components/AssetTradesChart";
import ErrorTracker from "@/components/ErrorTracker";

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const API_BASE_URL = "https://api.qtcq.xyz";
const LEADERBOARD_URL = "https://api.qtcq.xyz/leaderboard";

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const classNames = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

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
  return "Invalid credentials. Please check your team ID and API key.";
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------
export default function TeamDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [teamId, setTeamId] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [inputTeamId, setInputTeamId] = useState<string>("");
  const [inputApiKey, setInputApiKey] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(true);

  // Fetch available teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(LEADERBOARD_URL, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          mode: 'cors',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.leaderboard && Array.isArray(data.leaderboard)) {
            const teamIds = data.leaderboard
              .map((item: { team_id: string }) => item.team_id)
              .filter((id: string) => id && typeof id === 'string')
              .sort();
            
            if (teamIds.length > 0) {
              setTeams(teamIds);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch teams:', e);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  // Check stored credentials on mount
  useEffect(() => {
    const storedTeamId = sessionStorage.getItem('team_id');
    const storedApiKey = sessionStorage.getItem('api_key');
    
    if (storedTeamId && storedApiKey) {
      setTeamId(storedTeamId);
      setApiKey(storedApiKey);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    
    if (!inputTeamId.trim()) {
      setAuthError("Please select your team");
      return;
    }
    if (!inputApiKey.trim()) {
      setAuthError("Please enter your API key");
      return;
    }

    // Validate by attempting to fetch team metrics
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/team/${inputTeamId}/metrics?key=${inputApiKey}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          mode: 'cors',
        }
      );

      if (response.ok) {
        // Store credentials
        sessionStorage.setItem('team_id', inputTeamId);
        sessionStorage.setItem('api_key', inputApiKey);
        setTeamId(inputTeamId);
        setApiKey(inputApiKey);
        setIsAuthenticated(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAuthError(formatApiError(errorData));
      }
    } catch (e) {
      setAuthError("Failed to authenticate. Please try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('team_id');
    sessionStorage.removeItem('api_key');
    setIsAuthenticated(false);
    setTeamId("");
    setApiKey("");
    setInputTeamId("");
    setInputApiKey("");
  };

  const bodyBg = "bg-[#000000]";
  const cardBg = "border-[#333333] bg-[#000000]";

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className={classNames("min-h-screen w-full text-[#CCCCCC] py-8", bodyBg)}>
        <div className="mx-auto max-w-md px-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 border-b border-[#333333] pb-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <Lock className="size-5 text-[#00A0E8]" />
              <h1 className="text-xl font-bold tracking-wider text-[#00A0E8] uppercase">
                QTC TERMINAL
              </h1>
            </div>
            <p className="text-xs text-[#808080] uppercase tracking-wider">
              Team Authentication Required
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={cardBg}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Team ID Selector */}
                  <div>
                    <label htmlFor="teamId" className="block text-[10px] font-medium text-[#808080] mb-1 uppercase tracking-wider">
                      Team ID
                    </label>
                    <div className="relative">
                      <select
                        id="teamId"
                        value={inputTeamId}
                        onChange={(e) => setInputTeamId(e.target.value)}
                        disabled={isLoadingTeams}
                        className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] text-[#CCCCCC] appearance-none cursor-pointer focus:outline-none focus:border-[#00A0E8] transition-all disabled:opacity-50 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      >
                        <option value="" className="bg-[#0A0A0A] text-[#808080]">
                          {isLoadingTeams ? 'LOADING...' : 'SELECT TEAM'}
                        </option>
                        {teams.map((team) => (
                          <option key={team} value={team} className="bg-[#0A0A0A] text-[#CCCCCC]">
                            {team.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#808080]">
                        <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label htmlFor="apiKey" className="block text-[10px] font-medium text-[#808080] mb-1 uppercase tracking-wider">
                      API Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-[#808080]" />
                      <input
                        id="apiKey"
                        type="password"
                        value={inputApiKey}
                        onChange={(e) => setInputApiKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="ENTER API KEY"
                        className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#333333] text-[#CCCCCC] placeholder-[#808080] focus:outline-none focus:border-[#00A0E8] transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2 border border-[#FF0000] bg-[#FF0000]/10 p-2 text-[#FF0000]"
                    >
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <div className="text-xs uppercase tracking-wider">{authError}</div>
                    </motion.div>
                  )}

                  {/* Login Button */}
                  <button
                    onClick={handleLogin}
                    disabled={!inputTeamId || !inputApiKey}
                    className={classNames(
                      "w-full py-2 px-3 font-medium transition-all duration-100 flex items-center justify-center gap-2 border text-sm uppercase tracking-wider",
                      !inputTeamId || !inputApiKey
                        ? "bg-[#1A1A1A] text-[#808080] cursor-not-allowed border-[#333333]"
                        : "bg-[#00A0E8] text-[#000000] hover:bg-[#00B8FF] border-[#00A0E8]"
                    )}
                  >
                    <Lock className="size-4" />
                    <span>AUTHENTICATE</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="mt-4 text-center text-[10px] text-[#808080] uppercase tracking-wider border-t border-[#333333] pt-4">
            <p>SECURE CONNECTION | LOCAL STORAGE ONLY</p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  return (
    <div className={classNames("min-h-screen w-full text-[#CCCCCC]", bodyBg)}>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-[#333333] bg-[#000000]">
        <div className="mx-auto max-w-7xl px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="border border-[#00A0E8] px-2 py-1">
                <Activity className="size-4 text-[#00A0E8]" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#00A0E8] uppercase tracking-wider">
                  TEAM CONTROL CENTER | {teamId.toUpperCase()}
                </h1>
                <p className="text-[10px] text-[#808080] uppercase tracking-wider">STRATEGY MANAGEMENT & LIVE ANALYTICS</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="border border-[#333333] bg-[#0A0A0A] hover:bg-[#1A1A1A] text-[#CCCCCC] text-xs uppercase tracking-wider px-3 py-1 h-auto"
            >
              <LogOut className="mr-1 size-3" />
              LOGOUT
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-3 py-4 space-y-4">
        {/* Strategy Execution Health */}
        <section>
          <TeamExecutionHealth teamId={teamId} apiKey={apiKey} />
        </section>

        {/* Strategy Upload */}
        <section>
          <StrategyUpload teamId={teamId} apiKey={apiKey} />
        </section>

        {/* Performance Metrics */}
        <section>
          <div className="flex items-center gap-2 mb-2 border-b border-[#333333] pb-1">
            <div className="w-1 h-4 bg-[#00A0E8]"></div>
            <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">PERFORMANCE METRICS</h2>
          </div>
          <TeamMetrics teamId={teamId} apiKey={apiKey} />
        </section>

        {/* Portfolio History */}
        <section>
          <div className="flex items-center gap-2 mb-2 border-b border-[#333333] pb-1">
            <div className="w-1 h-4 bg-[#00A0E8]"></div>
            <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">PORTFOLIO ANALYTICS</h2>
          </div>
          <div className="space-y-3">
            <PortfolioHistoryChart teamId={teamId} apiKey={apiKey} />
            <PositionBreakdownChart teamId={teamId} apiKey={apiKey} />
          </div>
        </section>

        {/* Trading Activity */}
        <section>
          <div className="flex items-center gap-2 mb-2 border-b border-[#333333] pb-1">
            <div className="w-1 h-4 bg-[#00A0E8]"></div>
            <h2 className="text-xs font-bold text-[#00A0E8] uppercase tracking-wider">TRADING ACTIVITY</h2>
          </div>
          <div className="space-y-3">
            <TradeCountChart teamId={teamId} apiKey={apiKey} />
            <AssetTradesChart teamId={teamId} apiKey={apiKey} />
            <OpenOrders teamId={teamId} apiKey={apiKey} />
            <TradesTable teamId={teamId} apiKey={apiKey} />
          </div>
        </section>

        {/* Error Tracking */}
        <section>
          <div className="flex items-center gap-2 mb-2 border-b border-[#333333] pb-1">
            <div className="w-1 h-4 bg-[#FF0000]"></div>
            <h2 className="text-xs font-bold text-[#FF0000] uppercase tracking-wider">SYSTEM ALERTS</h2>
          </div>
          <ErrorTracker teamId={teamId} apiKey={apiKey} />
        </section>
      </div>
    </div>
  );
}

