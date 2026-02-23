"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AgentHierarchy from '../components/AgentHierarchy';

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
  }>;
}

export default function SubagentsPage() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<AgentNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHierarchy();
    const interval = setInterval(fetchHierarchy, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHierarchy() {
    try {
      const res = await fetch('/api/agent-hierarchy');
      const json = await res.json();
      setHierarchy(json.hierarchy || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalAgents = hierarchy.length;
  const activeAgents = hierarchy.filter(a => a.active).length;
  const totalSubagents = hierarchy.reduce((sum, a) => sum + a.subagents.length, 0);
  const activeSubagents = hierarchy.reduce((sum, a) => 
    sum + a.subagents.filter(s => s.status === 'active').length, 0
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="text-base font-bold">LOADING AGENT HIERARCHY...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Top Bar */}
      <div className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
          >
            ← DASHBOARD
          </button>
          <span className="text-base font-bold uppercase tracking-wider">AGENT HIERARCHY</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-gray-500">
            AGENTS: <span className="text-orange-400 font-bold">{activeAgents}/{totalAgents}</span>
          </div>
          <div className="text-gray-500">
            SUBAGENTS: <span className="text-purple-400 font-bold">{activeSubagents}/{totalSubagents}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Info Card */}
          <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-2">🌳 Agent Hierarchy</h3>
            <p className="text-xs text-gray-300">
              View all your agents and their spawned subagents in a hierarchical tree structure. 
              Click the arrow (▶) next to parent agents to expand and see their active subagents.
            </p>
          </div>

          {/* Hierarchy Tree */}
          {hierarchy.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-[#333] rounded p-12 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">No Agents Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure your OpenClaw workspace to see your agents here
              </p>
              <button
                onClick={() => router.push('/manage/create')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded transition-colors"
              >
                CREATE YOUR FIRST AGENT
              </button>
            </div>
          ) : (
            <AgentHierarchy agents={hierarchy} />
          )}
        </div>
      </div>
    </div>
  );
}
