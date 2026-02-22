"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ManageAgents() {
  const router = useRouter();
  const [allAgents, setAllAgents] = useState<AllAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle'>('all');

  useEffect(() => {
    fetchAllAgents();
  }, []);

  async function fetchAllAgents() {
    try {
      const res = await fetch('/api/all-agents');
      const json = await res.json();
      setAllAgents(json.agents || []);
    } catch (error) {
      console.error('Failed to fetch all agents:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAgents = allAgents.filter(agent => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && agent.active) ||
      (filterStatus === 'idle' && !agent.active);
    
    return matchesSearch && matchesStatus;
  });

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
          <span className="text-base font-bold uppercase tracking-wider">MANAGE AGENTS</span>
          <button
            onClick={() => router.push('/settings')}
            className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-400 font-bold text-[10px] rounded transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-xs text-gray-200 w-48 focus:border-orange-500 outline-none"
          />
          
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'idle')}
            className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-xs text-gray-200 focus:border-orange-500 outline-none"
          >
            <option value="all">All ({allAgents.length})</option>
            <option value="active">Active ({allAgents.filter(a => a.active).length})</option>
            <option value="idle">Idle ({allAgents.filter(a => !a.active).length})</option>
          </select>
          
          <button
            onClick={() => router.push('/manage/create')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded transition-colors"
          >
            + CREATE NEW AGENT
          </button>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Results Summary */}
          {!loading && searchQuery && (
            <div className="mb-4 text-sm text-gray-400">
              Found {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center text-gray-500 py-12">Loading agents...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                {searchQuery || filterStatus !== 'all' ? (
                  <div className="text-gray-500">No agents match your filters</div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gray-500">No agents found</div>
                    <div className="text-sm text-gray-600">
                      Configure your OpenClaw workspace path in settings
                    </div>
                    <button
                      onClick={() => router.push('/settings')}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded transition-colors"
                    >
                      ⚙️ GO TO SETTINGS
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-[#0a0a0a] border border-[#333] rounded p-4 hover:border-orange-500 transition-colors cursor-pointer"
                  onClick={() => router.push(`/manage/edit/${agent.id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{agent.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                        <h3 className="font-bold text-orange-400">{agent.name}</h3>
                      </div>
                      <div className="text-xs text-gray-600">{agent.id}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span className="text-gray-300">{agent.model.split('/')[1] || agent.model}</span>
                    </div>
                    {agent.tokens > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tokens:</span>
                        <span className="text-blue-400">{agent.tokens.toLocaleString()}</span>
                      </div>
                    )}
                    {agent.bindings > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bindings:</span>
                        <span className="text-purple-400">{agent.bindings}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={agent.active ? 'text-green-500' : 'text-gray-500'}>
                        {agent.active ? 'ACTIVE' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
