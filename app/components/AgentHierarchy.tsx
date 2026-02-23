"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Subagent {
  key: string;
  displayName: string;
  model: string;
  tokens: number;
  contextTokens: number;
  lastActive: string | null;
  status: string;
  channel: string | null;
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
  subagents: Subagent[];
}

interface AgentHierarchyProps {
  agents: AgentNode[];
}

export default function AgentHierarchy({ agents }: AgentHierarchyProps) {
  const router = useRouter();
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  function toggleAgent(agentId: string) {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  }

  return (
    <div className="space-y-2">
      {agents.map((agent) => {
        const isExpanded = expandedAgents.has(agent.id);
        const hasSubagents = agent.subagents.length > 0;
        
        return (
          <div key={agent.id} className="border border-[#333] rounded bg-[#0a0a0a] overflow-hidden">
            {/* Parent Agent Row */}
            <div className="flex items-center justify-between p-4 hover:bg-[#111] transition-colors">
              <div className="flex items-center gap-3 flex-1">
                {/* Expand/Collapse Button */}
                {hasSubagents ? (
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className="text-gray-500 hover:text-orange-400 transition-colors"
                  >
                    <span className="text-sm transform transition-transform inline-block" 
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      ▶
                    </span>
                  </button>
                ) : (
                  <span className="w-4"></span>
                )}
                
                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full ${agent.active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                
                {/* Agent Info */}
                <span className="text-2xl">{agent.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-orange-400">{agent.name}</span>
                    {agent.bindings > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded font-bold">
                        {agent.bindings} BIND
                      </span>
                    )}
                    {hasSubagents && (
                      <span className="text-[10px] px-2 py-0.5 bg-purple-600 text-white rounded font-bold">
                        {agent.subagents.length} SUB
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{agent.id}</div>
                </div>
              </div>
              
              {/* Agent Stats */}
              <div className="flex items-center gap-4">
                <div className="text-right text-xs">
                  <div className="text-gray-500">
                    <span className="text-white font-bold">{agent.model.split('/')[1] || agent.model}</span>
                  </div>
                  <div className="text-gray-500">
                    Tokens: <span className="text-blue-400 font-bold">{agent.tokens.toLocaleString()}</span>
                  </div>
                </div>
                
                {agent.lastActive && (
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true })}
                  </div>
                )}
                
                <button
                  onClick={() => router.push(`/manage/edit/${agent.id}`)}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-black text-[10px] font-bold rounded transition-colors"
                >
                  ✏️ EDIT
                </button>
              </div>
            </div>

            {/* Subagents */}
            {isExpanded && hasSubagents && (
              <div className="border-t border-[#333] bg-[#050505]">
                {agent.subagents.map((sub, idx) => (
                  <div 
                    key={sub.key}
                    className="flex items-center gap-3 p-3 pl-12 hover:bg-[#0a0a0a] transition-colors border-b border-[#222] last:border-0"
                  >
                    {/* Tree Line */}
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm">
                        {idx === agent.subagents.length - 1 ? '└─' : '├─'}
                      </span>
                    </div>
                    
                    {/* Subagent Status */}
                    <div className={`w-2 h-2 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    
                    {/* Subagent Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cyan-400">{sub.displayName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          sub.status === 'active' ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'
                        }`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{sub.key}</div>
                    </div>
                    
                    {/* Subagent Stats */}
                    <div className="text-right text-xs text-gray-500">
                      <div>{sub.model.split('/')[1] || sub.model}</div>
                      <div className="text-blue-400">{sub.tokens.toLocaleString()} tokens</div>
                    </div>
                    
                    {sub.lastActive && (
                      <div className="text-xs text-gray-600 w-24 text-right">
                        {formatDistanceToNow(new Date(sub.lastActive), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
