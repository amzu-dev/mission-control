"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '../components/Dialog';

export default function Settings() {
  const router = useRouter();
  const [workspacePath, setWorkspacePath] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });

  useEffect(() => {
    // Load current workspace path
    const saved = localStorage.getItem('openclaw_workspace_path');
    const defaultPath = (process.env.HOME || '~') + '/.openclaw';
    const current = saved || defaultPath;
    setCurrentPath(current);
    setWorkspacePath(current);
  }, []);

  async function handleVerify() {
    if (!workspacePath) return;
    
    setVerifying(true);
    setVerifyResult(null);
    
    try {
      const res = await fetch('/api/verify-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePath })
      });
      
      const data = await res.json();
      setVerifyResult(data);
    } catch (error) {
      setVerifyResult({ valid: false, error: 'Failed to verify workspace' });
    } finally {
      setVerifying(false);
    }
  }

  function handleSave() {
    if (verifyResult?.valid) {
      localStorage.setItem('openclaw_workspace_path', verifyResult.path);
      setCurrentPath(verifyResult.path);
      
      setDialogConfig({
        title: 'Success',
        message: 'Workspace path saved successfully! The page will reload to apply changes.',
        type: 'success',
        onConfirm: () => {
          window.location.href = '/';
        }
      });
      setShowDialog(true);
    }
  }

  function handleReset() {
    const defaultPath = (process.env.HOME || '~') + '/.openclaw';
    setWorkspacePath(defaultPath);
    setVerifyResult(null);
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
          <span className="text-base font-bold uppercase tracking-wider">SETTINGS</span>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0a0a0a] border border-[#333] rounded p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-orange-400 mb-2">OpenClaw Workspace</h2>
              <p className="text-sm text-gray-400">
                Configure the location of your OpenClaw installation directory.
              </p>
            </div>

            {/* Current Path */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
              <div className="text-xs text-gray-500 mb-1">CURRENT WORKSPACE</div>
              <div className="text-sm text-gray-200 font-mono">{currentPath}</div>
            </div>

            {/* Path Input */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Workspace Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workspacePath}
                  onChange={(e) => {
                    setWorkspacePath(e.target.value);
                    setVerifyResult(null);
                  }}
                  className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 font-mono"
                  placeholder="~/.openclaw"
                />
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-400 font-bold text-xs rounded transition-colors"
                >
                  RESET
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verifying || !workspacePath}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-black font-bold text-xs rounded transition-colors disabled:opacity-50"
                >
                  {verifying ? 'VERIFYING...' : 'VERIFY'}
                </button>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Use ~ for home directory (e.g., ~/.openclaw)
              </div>
            </div>

            {/* Verification Result */}
            {verifyResult && (
              <div className={`p-4 rounded border ${
                verifyResult.valid 
                  ? 'bg-green-900/20 border-green-700 text-green-400' 
                  : 'bg-red-900/20 border-red-700 text-red-400'
              }`}>
                {verifyResult.valid ? (
                  <div className="space-y-2">
                    <div className="font-bold flex items-center gap-2">
                      ✅ Valid OpenClaw Workspace
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Path: <span className="font-mono">{verifyResult.path}</span></div>
                      <div>Agents Directory: {verifyResult.hasAgents ? '✓ Found' : '✗ Not Found'}</div>
                      <div>Agent Count: {verifyResult.agentCount}</div>
                    </div>
                    <button
                      onClick={handleSave}
                      className="mt-3 w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded transition-colors"
                    >
                      SAVE & APPLY
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      ❌ Invalid Workspace
                    </div>
                    <div className="text-xs mt-1">{verifyResult.error}</div>
                  </div>
                )}
              </div>
            )}

            {/* Help */}
            <div className="border-t border-[#333] pt-6">
              <h3 className="text-sm font-bold text-gray-400 mb-3">Common Locations</h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setWorkspacePath('~/.openclaw')}
                  className="block w-full text-left px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded text-gray-300 font-mono transition-colors"
                >
                  ~/.openclaw
                </button>
                <button
                  onClick={() => setWorkspacePath('/Users/' + (process.env.USER || 'username') + '/.openclaw')}
                  className="block w-full text-left px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded text-gray-300 font-mono transition-colors"
                >
                  /Users/{process.env.USER || 'username'}/.openclaw
                </button>
              </div>
            </div>
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
