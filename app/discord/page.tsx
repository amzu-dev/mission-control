"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '../components/Dialog';

export default function DiscordSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });
  
  const [config, setConfig] = useState({
    enabled: false,
    botToken: '',
    guildId: '',
    userId: '',
    requireMention: true,
    dmPolicy: 'pairing' as 'pairing' | 'allowlist' | 'open' | 'disabled',
    groupPolicy: 'allowlist' as 'allowlist' | 'open' | 'disabled',
    streaming: 'off' as 'off' | 'partial' | 'block' | 'progress',
    historyLimit: 20
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('/api/discord-config');
      const data = await res.json();
      
      if (data.config) {
        setConfig({
          enabled: data.enabled || false,
          botToken: '',
          guildId: Object.keys(data.config.guilds || {})[0] || '',
          userId: data.config.guilds?.[Object.keys(data.config.guilds || {})[0]]?.users?.[0] || '',
          requireMention: data.config.guilds?.[Object.keys(data.config.guilds || {})[0]]?.requireMention !== false,
          dmPolicy: data.config.dmPolicy || 'pairing',
          groupPolicy: data.config.groupPolicy || 'allowlist',
          streaming: data.config.streaming || 'off',
          historyLimit: data.config.historyLimit || 20
        });
      }
    } catch (error) {
      console.error('Failed to load Discord config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (config.enabled && !config.botToken) {
      setDialogConfig({
        title: 'Validation Error',
        message: 'Bot token is required to enable Discord integration.',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
      return;
    }
    
    setSaving(true);
    
    try {
      const res = await fetch('/api/discord-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setDialogConfig({
          title: 'Success',
          message: data.needsRestart 
            ? 'Discord configuration saved! The gateway is restarting to apply changes.'
            : 'Discord configuration saved successfully.',
          type: 'success',
          onConfirm: undefined
        });
        setShowDialog(true);
      } else {
        setDialogConfig({
          title: 'Error',
          message: `Failed to save configuration: ${data.error}`,
          type: 'error',
          onConfirm: undefined
        });
        setShowDialog(true);
      }
    } catch (error) {
      setDialogConfig({
        title: 'Error',
        message: 'Failed to save Discord configuration. Please try again.',
        type: 'error',
        onConfirm: undefined
      });
      setShowDialog(true);
    } finally {
      setSaving(false);
    }
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
            onClick={() => router.push('/settings')}
            className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
          >
            ← BACK TO SETTINGS
          </button>
          <span className="text-base font-bold uppercase tracking-wider">DISCORD INTEGRATION</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          <span className={`text-xs font-bold ${config.enabled ? 'text-green-500' : 'text-gray-500'}`}>
            {config.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl">💬</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-orange-400 mb-2">Discord Bot Integration</h1>
                <p className="text-sm text-gray-400 mb-4">
                  Connect your OpenClaw agent to Discord for DMs and server interactions.
                </p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm font-bold text-gray-300">Enable Discord Integration</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Setup */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-6">
            <h2 className="text-lg font-bold text-orange-400 mb-4">1. Bot Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Bot Token *
                </label>
                <input
                  type="password"
                  value={config.botToken}
                  onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 font-mono"
                  placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.AbCdEf.GhIjKlMnOpQrStUvWxYz..."
                />
                <div className="text-xs text-gray-600 mt-1">
                  Get this from Discord Developer Portal → Your App → Bot → Reset Token
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Server ID (Guild ID)
                  </label>
                  <input
                    type="text"
                    value={config.guildId}
                    onChange={(e) => setConfig({ ...config, guildId: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 font-mono"
                    placeholder="123456789012345678"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Right-click your server → Copy Server ID
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Your User ID
                  </label>
                  <input
                    type="text"
                    value={config.userId}
                    onChange={(e) => setConfig({ ...config, userId: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 font-mono"
                    placeholder="987654321098765432"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Right-click your avatar → Copy User ID
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-6">
            <h2 className="text-lg font-bold text-orange-400 mb-4">2. Access Policies</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  DM Policy
                </label>
                <select
                  value={config.dmPolicy}
                  onChange={(e) => setConfig({ ...config, dmPolicy: e.target.value as any })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                >
                  <option value="pairing">Pairing (requires approval)</option>
                  <option value="allowlist">Allowlist (specific users)</option>
                  <option value="open">Open (anyone can DM)</option>
                  <option value="disabled">Disabled (no DMs)</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  Controls who can send DMs to your bot
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Server/Guild Policy
                </label>
                <select
                  value={config.groupPolicy}
                  onChange={(e) => setConfig({ ...config, groupPolicy: e.target.value as any })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                >
                  <option value="allowlist">Allowlist (approved servers)</option>
                  <option value="open">Open (any server)</option>
                  <option value="disabled">Disabled (no servers)</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  Controls server/channel access
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireMention}
                  onChange={(e) => setConfig({ ...config, requireMention: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-gray-300">Require @mention in server channels</span>
              </label>
              <div className="text-xs text-gray-600 mt-1 ml-6">
                When enabled, bot only responds when @mentioned in servers
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-6">
            <h2 className="text-lg font-bold text-orange-400 mb-4">3. Features</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Streaming Mode
                </label>
                <select
                  value={config.streaming}
                  onChange={(e) => setConfig({ ...config, streaming: e.target.value as any })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                >
                  <option value="off">Off (send complete message)</option>
                  <option value="partial">Partial (edit as tokens arrive)</option>
                  <option value="block">Block (send in chunks)</option>
                  <option value="progress">Progress (show progress)</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  How responses are delivered
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  History Limit
                </label>
                <input
                  type="number"
                  value={config.historyLimit}
                  onChange={(e) => setConfig({ ...config, historyLimit: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Messages to include in context (0-100)
                </div>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-2">📖 Setup Instructions</h3>
            <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://discord.com/developers/applications" target="_blank" className="text-orange-400 hover:underline">Discord Developer Portal</a></li>
              <li>Create a New Application → Add a Bot</li>
              <li>Enable <strong>Message Content Intent</strong> and <strong>Server Members Intent</strong></li>
              <li>Copy the Bot Token and paste above</li>
              <li>Generate invite URL with <code className="bg-[#1a1a1a] px-1 rounded">bot</code> + <code className="bg-[#1a1a1a] px-1 rounded">applications.commands</code> scopes</li>
              <li>Add bot to your server with these permissions: View Channels, Send Messages, Read Message History, Embed Links, Attach Files</li>
              <li>Enable Developer Mode in Discord (User Settings → Advanced)</li>
              <li>Right-click your server/avatar to copy IDs</li>
              <li>Save configuration below and approve pairing in DMs!</li>
            </ol>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded transition-colors disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE DISCORD CONFIGURATION'}
          </button>
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
      />
    </div>
  );
}
