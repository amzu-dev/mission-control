"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import Dialog from '../components/Dialog';

interface Subagent {
  id: string;
  displayName: string;
  model: string;
  tokens: number;
  contextTokens: number;
  createdAt: string;
  lastActive: string;
  status: string;
  task: string;
  messages: any[];
}

export default function SubagentsPage() {
  const router = useRouter();
  const [subagents, setSubagents] = useState<Subagent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubagent, setExpandedSubagent] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });
  
  const [newSubagent, setNewSubagent] = useState({
    task: '',
    label: '',
    agentId: 'main',
    model: 'anthropic/claude-sonnet-4-5',
    mode: 'session' as 'session' | 'run',
    cleanup: 'keep' as 'keep' | 'delete',
    timeoutSeconds: 300
  });
  
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSubagents();
    const interval = setInterval(loadSubagents, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadSubagents() {
    try {
      const res = await fetch('/api/subagents-manage');
      const data = await res.json();
      setSubagents(data.subagents || []);
    } catch (error) {
      console.error('Failed to load subagents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSubagent() {
    if (!newSubagent.task) {
      setDialogConfig({
        title: 'Validation Error',
        message: 'Task description is required',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
      return;
    }
    
    setCreating(true);
    
    try {
      const res = await fetch('/api/subagents-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubagent)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setDialogConfig({
          title: 'Success',
          message: `Subagent spawned successfully! It's now working on the task.`,
          type: 'success',
          onConfirm: () => {
            setShowCreateDialog(false);
            setNewSubagent({
              task: '',
              label: '',
              agentId: 'main',
              model: 'anthropic/claude-sonnet-4-5',
              mode: 'session',
              cleanup: 'keep',
              timeoutSeconds: 300
            });
            loadSubagents();
          }
        });
        setShowDialog(true);
      } else {
        setDialogConfig({
          title: 'Error',
          message: `Failed to create subagent: ${data.error}`,
          type: 'error',
          onConfirm: undefined
        });
        setShowDialog(true);
      }
    } catch (error) {
      setDialogConfig({
        title: 'Error',
        message: 'Failed to create subagent. Please try again.',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
    } finally {
      setCreating(false);
    }
  }

  async function handleKillSubagent(subagent: Subagent) {
    setDialogConfig({
      title: 'Terminate Subagent',
      message: `Are you sure you want to terminate "${subagent.displayName}"? This will stop the task immediately.`,
      type: 'warning',
      onConfirm: async () => {
        setShowDialog(false);
        
        try {
          const res = await fetch(`/api/subagents-manage?id=${subagent.id}`, {
            method: 'DELETE'
          });
          
          if (res.ok) {
            setDialogConfig({
              title: 'Success',
              message: 'Subagent terminated successfully',
              type: 'success',
              onConfirm: undefined
            });
            setShowDialog(true);
            loadSubagents();
          } else {
            const data = await res.json();
            setDialogConfig({
              title: 'Error',
              message: `Failed to terminate subagent: ${data.error}`,
              type: 'error',
              onConfirm: undefined
            });
            setShowDialog(true);
          }
        } catch (error) {
          setDialogConfig({
            title: 'Error',
            message: 'Failed to terminate subagent',
            type: 'error',
            onConfirm: undefined
          });
          setShowDialog(true);
        }
      }
    });
    setShowDialog(true);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="text-base font-bold">LOADING...</div>
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
          <span className="text-base font-bold uppercase tracking-wider">SUBAGENT MANAGEMENT</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            Active: <span className="text-orange-400 font-bold">{subagents.length}</span>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded transition-colors"
          >
            + SPAWN SUBAGENT
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Info Card */}
          <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-2">🤖 About Subagents</h3>
            <p className="text-xs text-gray-300">
              Subagents are isolated AI sessions that work on specific tasks. Spawn a subagent to delegate work, 
              monitor its progress, and verify results. Each subagent runs independently with its own context and history.
            </p>
          </div>

          {/* Subagents List */}
          {subagents.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-[#333] rounded p-12 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">No Active Subagents</h3>
              <p className="text-sm text-gray-600 mb-4">
                Spawn a subagent to delegate tasks and monitor their work
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded transition-colors"
              >
                + SPAWN YOUR FIRST SUBAGENT
              </button>
            </div>
          ) : (
            subagents.map((subagent) => {
              const isExpanded = expandedSubagent === subagent.id;
              const recentMessages = subagent.messages.slice(-5).reverse();
              
              return (
                <div key={subagent.id} className="bg-[#0a0a0a] border border-[#333] rounded">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedSubagent(isExpanded ? null : subagent.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-[#111] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${subagent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <div className="text-left">
                        <div className="text-base font-bold text-orange-400">{subagent.displayName}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{subagent.task || 'No task description'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs">
                        <div className="text-gray-500">Model: <span className="text-white">{subagent.model.split('/')[1]}</span></div>
                        <div className="text-gray-500">Tokens: <span className="text-blue-400">{subagent.tokens.toLocaleString()}</span></div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKillSubagent(subagent);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded transition-colors"
                      >
                        🗑️ KILL
                      </button>
                      <span className="text-2xl transform transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-[#333] p-4 space-y-4">
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="bg-[#1a1a1a] p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">CONTEXT LIMIT</div>
                          <div className="font-bold text-purple-400">{subagent.contextTokens.toLocaleString()}</div>
                        </div>
                        <div className="bg-[#1a1a1a] p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">CREATED</div>
                          <div className="font-bold text-cyan-400 text-xs">
                            {formatDistanceToNow(new Date(subagent.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="bg-[#1a1a1a] p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">LAST ACTIVE</div>
                          <div className="font-bold text-cyan-400 text-xs">
                            {formatDistanceToNow(new Date(subagent.lastActive), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="bg-[#1a1a1a] p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">STATUS</div>
                          <div className="font-bold uppercase">
                            {subagent.status === 'active' ? (
                              <span className="text-green-500">ACTIVE</span>
                            ) : (
                              <span className="text-red-500">ERROR</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Assigned Task:</div>
                        <div className="bg-[#1a1a1a] p-3 rounded text-sm text-gray-300">
                          {subagent.task || 'No task description'}
                        </div>
                      </div>

                      {/* Recent Messages */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Recent Activity:</div>
                        {recentMessages.length === 0 ? (
                          <div className="text-xs text-gray-600 italic">No messages yet</div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
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
                                        <div className="line-clamp-4">{c.text}</div>
                                      )}
                                      {c.type === 'toolCall' && (
                                        <div className="text-cyan-400">🔧 {c.name}</div>
                                      )}
                                    </div>
                                  ))
                                ) : typeof msg.content === 'string' ? (
                                  <div className="text-gray-400 mt-1 line-clamp-4">{msg.content}</div>
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

      {/* Create Subagent Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateDialog(false)}
          />
          
          <div className="relative bg-[#0a0a0a] border-2 border-[#333] rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-orange-500 bg-[#1a1a1a] px-6 py-4">
              <h3 className="text-lg font-bold text-white">Spawn New Subagent</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Task Description *
                </label>
                <textarea
                  value={newSubagent.task}
                  onChange={(e) => setNewSubagent({ ...newSubagent, task: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 h-32"
                  placeholder="Describe the task you want the subagent to work on..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    value={newSubagent.label}
                    onChange={(e) => setNewSubagent({ ...newSubagent, label: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                    placeholder="e.g., research-task"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Model
                  </label>
                  <select
                    value={newSubagent.model}
                    onChange={(e) => setNewSubagent({ ...newSubagent, model: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                  >
                    <option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option>
                    <option value="anthropic/claude-opus-4-5">Claude Opus 4.5</option>
                    <option value="anthropic/claude-opus-4-6">Claude Opus 4.6</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Mode
                  </label>
                  <select
                    value={newSubagent.mode}
                    onChange={(e) => setNewSubagent({ ...newSubagent, mode: e.target.value as any })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                  >
                    <option value="session">Session (persistent)</option>
                    <option value="run">Run (one-shot)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Cleanup
                  </label>
                  <select
                    value={newSubagent.cleanup}
                    onChange={(e) => setNewSubagent({ ...newSubagent, cleanup: e.target.value as any })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                  >
                    <option value="keep">Keep (preserve session)</option>
                    <option value="delete">Delete (auto-cleanup)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-[#1a1a1a] rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 font-bold text-sm rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubagent}
                disabled={creating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded transition-colors disabled:opacity-50"
              >
                {creating ? 'SPAWNING...' : 'SPAWN SUBAGENT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog
        isOpen={showDialog}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onClose={() => setShowDialog(false)}
        onConfirm={dialogConfig.onConfirm}
        confirmText={dialogConfig.onConfirm ? 'Confirm' : 'OK'}
        cancelText="Cancel"
      />
    </div>
  );
}
