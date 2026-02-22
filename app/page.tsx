"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import SetupScreen from './components/SetupScreen';

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

interface Agent {
  name: string;
  status: string;
  model: string;
  tokens: number;
  lastActive: string;
  kind: string;
}

interface AllAgent {
  id: string;
  name: string;
  emoji: string;
  workspace: string;
  configured: boolean;
  active: boolean;
  model: string;
  tokens: number;
  contextTokens: number;
  lastActive: string | null;
  kind: string;
  channel: string | null;
  bindings: number;
}

interface Subagent {
  key: string;
  displayName: string;
  model: string;
  tokens: number;
  contextTokens: number;
  lastActive: string;
  channel: string | null;
  status: string;
  messages: any[];
  transcriptPath: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<AllAgent[]>([]);
  const [subagents, setSubagents] = useState<Subagent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(['main']));
  const [expandedSubagents, setExpandedSubagents] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    fetchAgents();
    fetchAllAgents();
    fetchSubagents();
    const interval = setInterval(() => {
      fetchData();
      fetchAgents();
      fetchAllAgents();
      fetchSubagents();
    }, 10000);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
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
    }
  }

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      setAgents(json.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }

  async function fetchAllAgents() {
    try {
      const res = await fetch('/api/all-agents');
      const json = await res.json();
      setAllAgents(json.agents || []);
    } catch (error) {
      console.error('Failed to fetch all agents:', error);
    }
  }

  async function fetchSubagents() {
    try {
      const res = await fetch('/api/subagents');
      const json = await res.json();
      setSubagents(json.subagents || []);
    } catch (error) {
      console.error('Failed to fetch subagents:', error);
    }
  }

  function toggleAgent(agentId: string) {
    setSelectedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  }

  function toggleSubagent(key: string) {
    setExpandedSubagents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  const selectedAgentDetails = allAgents.filter(a => selectedAgents.has(a.id));

  // Show loading screen
  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="text-base font-bold">LOADING...</div>
        </div>
      </div>
    );
  }

  // Show setup screen if no agents found
  if (allAgents.length === 0 && !agents.length && !subagents.length) {
    return <SetupScreen />;
  }

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
        </div>
        
        <div className="flex items-center gap-4">
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
          {/* Agent Info */}
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

          {/* Agent Selector */}
          <div className="panel">
            <div className="panel-header">SELECT AGENTS ({allAgents.length})</div>
            <div className="panel-content space-y-2 max-h-[500px] overflow-y-auto">
              {allAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-2 rounded transition-colors hover:bg-[#1a1a1a] group"
                >
                  <input
                    type="checkbox"
                    checked={selectedAgents.has(agent.id)}
                    onChange={() => toggleAgent(agent.id)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-xl">{agent.emoji}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    <div>
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-[10px] text-gray-600">{agent.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.active && (
                      <span className="text-[10px] text-green-500 font-bold">ACTIVE</span>
                    )}
                    {agent.bindings > 0 && (
                      <span className="text-[10px] text-blue-500 font-bold">{agent.bindings} BIND</span>
                    )}
                    <button
                      onClick={() => router.push(`/manage/edit/${agent.id}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-orange-500 hover:bg-orange-600 text-black text-[10px] font-bold rounded"
                      title="Edit agent"
                    >
                      ✏️ EDIT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Agent Details */}
          <div className="panel lg:col-span-2">
            <div className="panel-header">SELECTED AGENTS DETAIL ({selectedAgentDetails.length})</div>
            <div className="panel-content space-y-4 max-h-[500px] overflow-y-auto">
              {selectedAgentDetails.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  No agents selected. Select agents from the left panel.
                </div>
              ) : (
                selectedAgentDetails.map((agent) => (
                  <div key={agent.id} className="border border-[#333] rounded p-4 bg-[#0a0a0a]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{agent.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${agent.active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                            <span className="text-lg font-bold text-orange-400">{agent.name}</span>
                          </div>
                          <div className="text-xs text-gray-600">{agent.id}</div>
                        </div>
                      </div>
                      {agent.lastActive && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#1a1a1a] p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">MODEL</div>
                        <div className="font-bold text-orange-400 text-[11px]">{agent.model}</div>
                      </div>
                      
                      <div className="bg-[#1a1a1a] p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">STATUS</div>
                        <div className="font-bold uppercase">
                          {agent.active ? (
                            <span className="text-green-500">ACTIVE</span>
                          ) : (
                            <span className="text-gray-500">IDLE</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-[#1a1a1a] p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">TOKENS USED</div>
                        <div className="font-bold text-blue-400">{agent.tokens.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-[#1a1a1a] p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">CONTEXT LIMIT</div>
                        <div className="font-bold text-purple-400">{agent.contextTokens.toLocaleString()}</div>
                      </div>
                      
                      {agent.bindings > 0 && (
                        <div className="bg-[#1a1a1a] p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">BINDINGS</div>
                          <div className="font-bold text-blue-400">{agent.bindings}</div>
                        </div>
                      )}
                      
                      {agent.channel && (
                        <div className="bg-[#1a1a1a] p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">CHANNEL</div>
                          <div className="font-bold uppercase text-cyan-400">{agent.channel}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subagents */}
          <div className="panel lg:col-span-4">
            <div className="panel-header">SUBAGENTS ({subagents.length})</div>
            <div className="panel-content space-y-3">
              {subagents.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  No active subagents. Subagents appear when spawned for specific tasks.
                </div>
              ) : (
                subagents.map((sub) => {
                  const isExpanded = expandedSubagents.has(sub.key);
                  const recentMessages = sub.messages.slice(-5).reverse();
                  
                  return (
                    <div key={sub.key} className="border border-[#333] rounded bg-[#0a0a0a]">
                      {/* Subagent Header */}
                      <button
                        onClick={() => toggleSubagent(sub.key)}
                        className="w-full p-4 flex items-center justify-between hover:bg-[#111] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${sub.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                          <div className="text-left">
                            <div className="text-base font-bold text-orange-400">{sub.displayName}</div>
                            <div className="text-xs text-gray-500">{sub.key}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs">
                            <div className="text-gray-500">Model: <span className="text-white">{sub.model}</span></div>
                            <div className="text-gray-500">Tokens: <span className="text-blue-400">{sub.tokens.toLocaleString()}</span></div>
                          </div>
                          <span className="text-2xl transform transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            ▼
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-[#333] p-4 space-y-3">
                          <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                            <div className="bg-[#1a1a1a] p-3 rounded">
                              <div className="text-xs text-gray-500 mb-1">CONTEXT LIMIT</div>
                              <div className="font-bold text-purple-400">{sub.contextTokens.toLocaleString()}</div>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 rounded">
                              <div className="text-xs text-gray-500 mb-1">LAST ACTIVE</div>
                              <div className="font-bold text-cyan-400">
                                {formatDistanceToNow(new Date(sub.lastActive), { addSuffix: true })}
                              </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 rounded">
                              <div className="text-xs text-gray-500 mb-1">STATUS</div>
                              <div className="font-bold uppercase">
                                {sub.status === 'active' ? (
                                  <span className="text-green-500">ACTIVE</span>
                                ) : (
                                  <span className="text-red-500">ERROR</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Recent Activity */}
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Recent Messages:</div>
                            {recentMessages.length === 0 ? (
                              <div className="text-xs text-gray-600 italic">No messages yet</div>
                            ) : (
                              <div className="space-y-2">
                                {recentMessages.map((msg: any, i: number) => (
                                  <div key={i} className="bg-[#1a1a1a] p-3 rounded text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-orange-400 uppercase">{msg.role}</span>
                                      {msg.timestamp && (
                                        <span className="text-gray-600">
                                          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                        </span>
                                      )}
                                    </div>
                                    {msg.content && Array.isArray(msg.content) ? (
                                      msg.content.map((c: any, j: number) => (
                                        <div key={j} className="text-gray-400 mt-1">
                                          {c.type === 'text' && (
                                            <div className="line-clamp-3">{c.text}</div>
                                          )}
                                          {c.type === 'toolCall' && (
                                            <div className="text-cyan-400">🔧 {c.name}</div>
                                          )}
                                        </div>
                                      ))
                                    ) : typeof msg.content === 'string' ? (
                                      <div className="text-gray-400 mt-1 line-clamp-3">{msg.content}</div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="panel lg:col-span-4">
            <div className="panel-header">RECENT ACTIVITY</div>
            <div className="panel-content space-y-3">
              {data.recentActivity.map((activity, i) => {
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
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
