"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EmojiPicker from '../../../components/EmojiPicker';
import Dialog from '../../../components/Dialog';

interface AgentFile {
  filename: string;
  content: string;
  path: string;
}

interface AgentInfo {
  id: string;
  identityName: string;
  identityEmoji: string;
  model: string;
  workspace: string;
  bindings: number;
  isDefault: boolean;
}

export default function EditAgent() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;
  
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AgentFile | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentEmoji, setAgentEmoji] = useState('');
  const [agentModel, setAgentModel] = useState('');
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (agentId) {
      loadAgentInfo(agentId);
      loadAgentFiles(agentId);
    }
  }, [agentId]);

  async function loadAgentInfo(id: string) {
    try {
      const res = await fetch(`/api/agent-info?agentId=${id}`);
      const data = await res.json();
      if (data.agent) {
        setAgentInfo(data.agent);
        setAgentName(data.agent.identityName || '');
        setAgentEmoji(data.agent.identityEmoji || '🤖');
        setAgentModel(data.agent.model || 'anthropic/claude-sonnet-4-5');
      }
    } catch (error) {
      console.error('Failed to load agent info:', error);
    }
  }

  async function loadAgentFiles(id: string) {
    try {
      const res = await fetch(`/api/agent-files?agentId=${id}`);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAgent() {
    // Safety check for main agent
    if (agentId === 'main') {
      setDialogConfig({
        title: 'Cannot Delete Main Agent',
        message: 'The main agent cannot be deleted as it is required for the system to function.',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
      return;
    }
    
    // Show confirmation dialog
    setDialogConfig({
      title: 'Delete Agent',
      message: `Are you sure you want to delete agent "${agentId}"? This action cannot be undone and will remove all agent files and configuration.`,
      type: 'warning',
      onConfirm: async () => {
        setShowDialog(false);
        setDeleting(true);
        
        try {
          const res = await fetch('/api/delete-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId })
          });
          
          const data = await res.json();
          
          if (res.ok) {
            setDialogConfig({
              title: 'Success',
              message: `Agent "${agentId}" has been deleted successfully. Redirecting...`,
              type: 'success',
              onConfirm: () => {
                router.push('/manage');
              }
            });
            setShowDialog(true);
          } else {
            setDialogConfig({
              title: 'Error',
              message: `Failed to delete agent: ${data.error}`,
              type: 'error',
              onConfirm: undefined
            });
            setShowDialog(true);
          }
        } catch (error) {
          setDialogConfig({
            title: 'Error',
            message: 'Failed to delete agent. Please try again.',
            type: 'error',
            onConfirm: undefined
          });
          setShowDialog(true);
        } finally {
          setDeleting(false);
        }
      }
    });
    setShowDialog(true);
  }

  async function handleUpdateAgent() {
    // Validate emoji
    if (!agentEmoji) {
      setDialogConfig({
        title: 'Validation Error',
        message: 'Please select an emoji!',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
      return;
    }
    
    setUpdatingAgent(true);
    try {
      const res = await fetch('/api/update-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          name: agentName,
          emoji: agentEmoji,
          model: agentModel
        })
      });
      
      if (res.ok) {
        setDialogConfig({
          title: 'Success',
          message: 'Agent updated successfully!',
          type: 'success',
          onConfirm: undefined
        });
        setShowDialog(true);
        setEditingInfo(false);
        await loadAgentInfo(agentId);
      } else {
        const data = await res.json();
        setDialogConfig({
          title: 'Error',
          message: `Failed to update agent: ${data.error}`,
          type: 'error',
          onConfirm: undefined
        });
        setShowDialog(true);
      }
    } catch (error) {
      setDialogConfig({
        title: 'Error',
        message: 'Failed to update agent. Please try again.',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
    } finally {
      setUpdatingAgent(false);
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
        setDialogConfig({
          title: 'Success',
          message: 'File saved successfully!',
          type: 'success',
          onConfirm: undefined
        });
        setShowDialog(true);
        await loadAgentFiles(agentId);
      } else {
        const data = await res.json();
        setDialogConfig({
          title: 'Error',
          message: `Failed to save file: ${data.error}`,
          type: 'error',
          onConfirm: undefined
        });
        setShowDialog(true);
      }
    } catch (error) {
      setDialogConfig({
        title: 'Error',
        message: 'Failed to save file. Please try again.',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
    } finally {
      setSaving(false);
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
          <span className="text-base font-bold uppercase tracking-wider">
            EDIT AGENT: {agentId}
          </span>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-400 font-bold text-[10px] rounded transition-colors"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Agent Info Card */}
          {agentInfo && (
            <div className="bg-[#0a0a0a] border border-[#333] rounded p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{agentInfo.identityEmoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-orange-400">{agentInfo.identityName}</h2>
                    <div className="text-sm text-gray-600">{agentInfo.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingInfo(!editingInfo)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded transition-colors"
                  >
                    {editingInfo ? 'CANCEL' : '✏️ EDIT INFO'}
                  </button>
                  {agentId !== 'main' && (
                    <button
                      onClick={handleDeleteAgent}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors disabled:opacity-50"
                      title="Delete agent"
                    >
                      {deleting ? 'DELETING...' : '🗑️ DELETE'}
                    </button>
                  )}
                </div>
              </div>

              {editingInfo ? (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#333]">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Name</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Emoji</label>
                    <EmojiPicker
                      value={agentEmoji}
                      onChange={setAgentEmoji}
                    />
                    <div className="text-[10px] text-gray-600 mt-1">
                      Single emoji only
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Model</label>
                    <select
                      value={agentModel}
                      onChange={(e) => setAgentModel(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                    >
                      <option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option>
                      <option value="anthropic/claude-opus-4-5">Claude Opus 4.5</option>
                      <option value="anthropic/claude-opus-4-6">Claude Opus 4.6</option>
                      <option value="anthropic/claude-sonnet-3-5">Claude Sonnet 3.5</option>
                      <option value="openai/gpt-4">GPT-4</option>
                      <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <button
                      onClick={handleUpdateAgent}
                      disabled={updatingAgent}
                      className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded transition-colors disabled:opacity-50"
                    >
                      {updatingAgent ? 'UPDATING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#333] text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Model</div>
                    <div className="text-orange-400 font-bold">{agentInfo.model}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Workspace</div>
                    <div className="text-gray-300 text-xs truncate">{agentInfo.workspace}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Bindings</div>
                    <div className="text-blue-400 font-bold">{agentInfo.bindings}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Default</div>
                    <div className={agentInfo.isDefault ? 'text-green-400 font-bold' : 'text-gray-500'}>
                      {agentInfo.isDefault ? 'YES' : 'NO'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Editor */}
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading files...</div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {/* File List */}
              <div className="bg-[#0a0a0a] border border-[#333] rounded p-4">
                <h3 className="text-sm font-bold text-gray-400 mb-3">FILES</h3>
                {files.length === 0 ? (
                  <div className="text-sm text-gray-600">No files found</div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <button
                        key={file.filename}
                        onClick={() => handleFileSelect(file)}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                          selectedFile?.filename === file.filename
                            ? 'bg-orange-500 text-black font-bold'
                            : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300'
                        }`}
                      >
                        {file.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* File Editor */}
              <div className="col-span-3 bg-[#0a0a0a] border border-[#333] rounded p-4">
                <h3 className="text-sm font-bold text-gray-400 mb-3">
                  {selectedFile ? selectedFile.filename : 'EDITOR'}
                </h3>
                {selectedFile ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm font-mono h-[500px] resize-none text-gray-200"
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
      </div>

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
