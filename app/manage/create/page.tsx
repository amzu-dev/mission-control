"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmojiPicker from '../../components/EmojiPicker';
import Dialog from '../../components/Dialog';

export default function CreateAgent() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });
  const [newAgent, setNewAgent] = useState({
    agentId: '',
    name: '',
    emoji: '🤖',
    vibe: '',
    telegramBotToken: '',
    telegramAccountId: '',
    model: 'anthropic/claude-sonnet-4-5'
  });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  async function handleCreateAgent() {
    if (!newAgent.agentId || !newAgent.name) {
      setMessage('❌ Agent ID and Name are required!');
      return;
    }
    
    // Validate emoji
    if (!newAgent.emoji) {
      setMessage('❌ Please select an emoji!');
      return;
    }
    
    setCreating(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setDialogConfig({
          title: 'Success',
          message: `${data.message} Redirecting to agent management...`,
          type: 'success',
          onConfirm: () => {
            router.push('/manage');
          }
        });
        setShowDialog(true);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to create agent');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Top Bar */}
      <div className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/manage')}
            className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
          >
            ← BACK TO AGENTS
          </button>
          <span className="text-base font-bold uppercase tracking-wider">CREATE NEW AGENT</span>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-400 font-bold text-[10px] rounded transition-colors"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Agent ID * (lowercase, no spaces)
                </label>
                <input
                  type="text"
                  value={newAgent.agentId}
                  onChange={(e) => setNewAgent({ ...newAgent, agentId: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                  placeholder="e.g., my-agent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                  placeholder="e.g., My Assistant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Emoji *
                </label>
                <EmojiPicker
                  value={newAgent.emoji}
                  onChange={(emoji) => setNewAgent({ ...newAgent, emoji })}
                />
                <div className="text-[10px] text-gray-600 mt-1">
                  Single emoji only
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Model
                </label>
                <select
                  value={newAgent.model}
                  onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                >
                  <option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option>
                  <option value="anthropic/claude-opus-4-5">Claude Opus 4.5</option>
                  <option value="anthropic/claude-opus-4-6">Claude Opus 4.6</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Vibe / Personality
              </label>
              <textarea
                value={newAgent.vibe}
                onChange={(e) => setNewAgent({ ...newAgent, vibe: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm h-24 text-gray-200"
                placeholder="Describe the agent's personality and approach..."
              />
            </div>
            
            <div className="border-t border-[#333] pt-6">
              <h3 className="text-sm font-bold text-gray-400 mb-4">Telegram Configuration (Optional)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={newAgent.telegramBotToken}
                    onChange={(e) => setNewAgent({ ...newAgent, telegramBotToken: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Telegram Account ID (optional)
                  </label>
                  <input
                    type="text"
                    value={newAgent.telegramAccountId}
                    onChange={(e) => setNewAgent({ ...newAgent, telegramAccountId: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                    placeholder="Defaults to agent ID"
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCreateAgent}
              disabled={creating}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded transition-colors disabled:opacity-50"
            >
              {creating ? 'CREATING...' : 'CREATE AGENT'}
            </button>
            
            {message && (
              <div className={`p-3 rounded text-sm ${
                message.startsWith('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog
        isOpen={showDialog}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onClose={() => setShowDialog(false)}
        onConfirm={dialogConfig.onConfirm}
        confirmText="OK"
      />
    </div>
  );
}
