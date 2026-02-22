"use client";

import { useState } from 'react';
import EmojiPicker from './EmojiPicker';

interface Agent {
  id: string;
  name: string;
  emoji: string;
}

interface AgentFile {
  filename: string;
  content: string;
  path: string;
}

export default function AgentManager({ agents }: { agents: Agent[] }) {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AgentFile | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Create form state
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
  const [createMessage, setCreateMessage] = useState('');

  async function loadAgentFiles(agentId: string) {
    try {
      const res = await fetch(`/api/agent-files?agentId=${agentId}`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
        if (data.files.length > 0) {
          setSelectedFile(data.files[0]);
          setEditContent(data.files[0].content || '');
        }
      }
    } catch (error) {
      console.error('Failed to load agent files:', error);
    }
  }

  function handleFileSelect(file: AgentFile) {
    setSelectedFile(file);
    setEditContent(file.content || '');
  }

  async function handleSaveFile() {
    if (!selectedFile) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile.path,
          content: editContent
        })
      });
      
      if (res.ok) {
        alert('File saved successfully!');
        // Reload files
        await loadAgentFiles(selectedAgent);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save file');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAgent() {
    if (!newAgent.agentId || !newAgent.name) {
      setCreateMessage('Agent ID and Name are required!');
      return;
    }
    
    setCreating(true);
    setCreateMessage('');
    
    try {
      const res = await fetch('/api/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCreateMessage(`✅ ${data.message}`);
        // Reset form
        setNewAgent({
          agentId: '',
          name: '',
          emoji: '🤖',
          vibe: '',
          telegramBotToken: '',
          telegramAccountId: '',
          model: 'anthropic/claude-sonnet-4-5'
        });
      } else {
        setCreateMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setCreateMessage('❌ Failed to create agent');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
            activeTab === 'create' 
              ? 'bg-orange-500 text-black' 
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
          }`}
        >
          CREATE AGENT
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
            activeTab === 'edit' 
              ? 'bg-orange-500 text-black' 
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
          }`}
        >
          EDIT AGENTS
        </button>
      </div>

      {/* Create Agent Form */}
      {activeTab === 'create' && (
        <div className="bg-[#0a0a0a] border border-[#333] rounded p-6 space-y-4">
          <h2 className="text-xl font-bold text-orange-400 mb-4">Create New Agent</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Agent ID * (lowercase, no spaces)
              </label>
              <input
                type="text"
                value={newAgent.agentId}
                onChange={(e) => setNewAgent({ ...newAgent, agentId: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm"
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
                className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm"
                placeholder="e.g., My Assistant"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Emoji
              </label>
              <EmojiPicker
                value={newAgent.emoji}
                onChange={(emoji) => setNewAgent({ ...newAgent, emoji })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Model
              </label>
              <select
                value={newAgent.model}
                onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm"
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
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm h-24"
              placeholder="Describe the agent's personality and approach..."
            />
          </div>
          
          <div className="border-t border-[#333] pt-4 mt-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">Telegram Configuration (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={newAgent.telegramBotToken}
                  onChange={(e) => setNewAgent({ ...newAgent, telegramBotToken: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm"
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
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm"
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
          
          {createMessage && (
            <div className={`p-3 rounded text-sm ${
              createMessage.startsWith('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {createMessage}
            </div>
          )}
        </div>
      )}

      {/* Edit Agent Files */}
      {activeTab === 'edit' && (
        <div className="grid grid-cols-3 gap-4">
          {/* Agent Selector */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">SELECT AGENT</h3>
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent.id);
                    loadAgentFiles(agent.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                    selectedAgent === agent.id
                      ? 'bg-orange-500 text-black'
                      : 'bg-[#1a1a1a] hover:bg-[#222]'
                  }`}
                >
                  <span className="text-xl">{agent.emoji}</span>
                  <span className="text-sm font-medium">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File List */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">FILES</h3>
            {files.length === 0 ? (
              <div className="text-sm text-gray-600">Select an agent to see files</div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => handleFileSelect(file)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                      selectedFile?.filename === file.filename
                        ? 'bg-orange-500 text-black font-bold'
                        : 'bg-[#1a1a1a] hover:bg-[#222]'
                    }`}
                  >
                    {file.filename}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Editor */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">
              {selectedFile ? selectedFile.filename : 'EDITOR'}
            </h3>
            {selectedFile ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm font-mono h-[450px] resize-none text-gray-200"
                  spellCheck={false}
                  style={{ color: '#e5e5e5' }}
                />
                <button
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-2 rounded transition-colors disabled:opacity-50"
                >
                  {saving ? 'SAVING...' : 'SAVE FILE'}
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Select a file to edit</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
