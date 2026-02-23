"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import SetupScreen from './components/SetupScreen';
import AgentHierarchy from './components/AgentHierarchy';

interface DashboardData {
  name: string;
  emoji: string;
  status: string;
  uptime: number;
  workspace: string;
  stats: {
    totalFiles: number;
    memoryFiles: number;
  };
  recentActivity: Array<{
    date: string;
    preview: string;
  }>;
}

interface AgentNode {
  id: string;
  name: string;
  emoji: string;
  workspace: string;
  active: boolean;
  model: string;
  tokens: number;
  contextTokens: number;
  lastActive: string | null;
  kind: string;
  channel: string | null;
  bindings: number;
  subagents: Array<{
    key: string;
    displayName: string;
    model: string;
    tokens: number;
    contextTokens: number;
    lastActive: string | null;
    status: string;
    channel: string | null;
    type: 'active';
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    emoji: string;
    type: 'team';
  }>;
}

interface VersionInfo {
  current: string;
  latest: string | null;
  updateAvailable: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [hierarchy, setHierarchy] = useState<AgentNode[]>([]);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchData();
    fetchHierarchy();
    fetchVersion();
    const interval = setInterval(() => {
      fetchData();
      fetchHierarchy();
    }, 10000);
    const versionInterval = setInterval(fetchVersion, 300000); // Check version every 5 minutes
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(versionInterval);
      clearInterval(timer);
    };
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      if (initialLoad) setInitialLoad(false);
    }
  }

  async function fetchHierarchy() {
    try {
      const res = await fetch('/api/agent-hierarchy');
      const json = await res.json();
      setHierarchy(json.hierarchy || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
    }
  }

  async function fetchVersion() {
    try {
      const res = await fetch('/api/version');
      const json = await res.json();
      setVersion(json);
    } catch (error) {
      console.error('Failed to fetch version:', error);
    }
  }

  // Show better loading screen
  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🚀</div>
          <div className="text-xl font-bold text-orange-400 mb-2">INITIALIZING MISSION CONTROL</div>
          <div className="text-sm text-gray-500">Scanning OpenClaw workspace...</div>
        </div>
      </div>
    );
  }

  // Show setup screen if no agents found after initial load
  if (!initialLoad && hierarchy.length === 0) {
    return <SetupScreen />;
  }

  // Calculate totals
  const totalAgents = hierarchy.length;
  const activeAgents = hierarchy.filter(a => a.active).length;
  const totalSubagents = hierarchy.reduce((sum, a) => sum + a.subagents.length, 0);
  const totalTokens = hierarchy.reduce((sum, a) => sum + a.tokens, 0);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-base uppercase tracking-wider">MISSION CONTROL</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">STATUS:</span>
            <span className="status-active font-bold uppercase">{data.status}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-gray-500">
              AGENTS: <span className="text-orange-400 font-bold">{activeAgents}/{totalAgents}</span>
            </div>
            <div className="text-gray-500">
              SUBAGENTS: <span className="text-purple-400 font-bold">{totalSubagents}</span>
            </div>
            <div className="text-gray-500">
              TOKENS: <span className="text-blue-400 font-bold">{totalTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Version Info */}
          {version && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">v{version.current}</span>
              {version.updateAvailable && version.latest && (
                <a
                  href="https://github.com/openclaw/openclaw/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition-colors"
                  title={`Update available: v${version.latest}`}
                >
                  ⬆ v{version.latest}
                </a>
              )}
            </div>
          )}
          
          <button
            onClick={() => router.push('/subagents')}
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-400 font-bold text-xs rounded transition-colors"
            title="Agent Hierarchy"
          >
            🌳 HIERARCHY
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-400 font-bold text-xs rounded transition-colors"
            title="Settings"
          >
            ⚙️ SETTINGS
          </button>
          <button
            onClick={() => router.push('/manage')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded transition-colors"
          >
            MANAGE AGENTS
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">GMT</span>
            <span className="font-bold tabular-nums">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-[1800px] mx-auto">
          {/* System Info */}
          <div className="panel">
            <div className="panel-header">SYSTEM INFO</div>
            <div className="panel-content space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{data.emoji}</span>
                <div>
                  <div className="font-bold text-2xl">{data.name}</div>
                  <div className="text-xs text-gray-500">OPENCLAW AGENT</div>
                </div>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">WORKSPACE</span>
                  <span className="text-xs text-gray-400 truncate max-w-[180px]">{data.workspace}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">UPTIME</span>
                  <span>{Math.floor(data.uptime / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">FILES</span>
                  <span>{data.stats.totalFiles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MEMORY LOGS</span>
                  <span>{data.stats.memoryFiles}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Hierarchy - Takes up 3 columns */}
          <div className="panel lg:col-span-3">
            <div className="panel-header">
              AGENT HIERARCHY
              <span className="ml-3 text-xs text-gray-500">
                {totalAgents} Agents • {totalSubagents} Subagents • {totalTokens.toLocaleString()} Total Tokens
              </span>
            </div>
            <div className="panel-content max-h-[600px] overflow-y-auto">
              <AgentHierarchy agents={hierarchy} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="panel lg:col-span-4">
            <div className="panel-header">RECENT ACTIVITY</div>
            <div className="panel-content space-y-3">
              {data.recentActivity.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  No recent activity recorded
                </div>
              ) : (
                data.recentActivity.map((activity, i) => {
                  const activityDate = new Date(activity.date);
                  const isValidDate = !isNaN(activityDate.getTime());
                  
                  return (
                    <div key={i} className="border-b border-[#222] pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">{activity.date}</span>
                        <span className="text-xs text-gray-500">
                          {isValidDate 
                            ? formatDistanceToNow(activityDate, { addSuffix: true })
                            : 'recent'
                          }
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 line-clamp-2">
                        {activity.preview || 'No activity recorded'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
