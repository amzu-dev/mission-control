"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from './Dialog';

export default function SetupScreen() {
  const router = useRouter();
  const [workspacePath, setWorkspacePath] = useState('~/.openclaw');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });

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
      
      setDialogConfig({
        title: 'Success',
        message: 'Workspace configured successfully! The page will reload to load your agents.',
        type: 'success',
        onConfirm: () => {
          window.location.reload();
        }
      });
      setShowDialog(true);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-orange-400 mb-2">
              Welcome to Mission Control
            </h1>
            <p className="text-gray-400">
              Configure your OpenClaw workspace to get started
            </p>
          </div>

          {/* Status */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded p-4 text-center">
            <div className="text-yellow-500 font-bold mb-1">⚠️ No Agents Found</div>
            <div className="text-xs text-gray-500">
              Please configure your OpenClaw workspace path
            </div>
          </div>

          {/* Path Input */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">
              OpenClaw Workspace Path
            </label>
            <input
              type="text"
              value={workspacePath}
              onChange={(e) => {
                setWorkspacePath(e.target.value);
                setVerifyResult(null);
              }}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-4 py-3 text-sm text-gray-200 font-mono"
              placeholder="~/.openclaw"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            <div className="text-xs text-gray-600 mt-1">
              Use ~ for home directory (e.g., ~/.openclaw)
            </div>
          </div>

          {/* Common Paths */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Common locations:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWorkspacePath('~/.openclaw')}
                className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded text-xs text-gray-300 font-mono transition-colors"
              >
                ~/.openclaw
              </button>
              <button
                onClick={() => setWorkspacePath('/opt/openclaw')}
                className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded text-xs text-gray-300 font-mono transition-colors"
              >
                /opt/openclaw
              </button>
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={verifying || !workspacePath}
            className="w-full bg-blue-500 hover:bg-blue-600 text-black font-bold py-3 rounded transition-colors disabled:opacity-50"
          >
            {verifying ? 'VERIFYING...' : 'VERIFY WORKSPACE'}
          </button>

          {/* Verification Result */}
          {verifyResult && (
            <div className={`p-4 rounded border ${
              verifyResult.valid 
                ? 'bg-green-900/20 border-green-700 text-green-400' 
                : 'bg-red-900/20 border-red-700 text-red-400'
            }`}>
              {verifyResult.valid ? (
                <div className="space-y-3">
                  <div className="font-bold">✅ Valid OpenClaw Workspace</div>
                  <div className="text-xs space-y-1">
                    <div>Path: <span className="font-mono">{verifyResult.path}</span></div>
                    <div>Agents Found: {verifyResult.agentCount}</div>
                  </div>
                  <button
                    onClick={handleSave}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded transition-colors"
                  >
                    SAVE & CONTINUE
                  </button>
                </div>
              ) : (
                <div>
                  <div className="font-bold">❌ Invalid Workspace</div>
                  <div className="text-xs mt-1">{verifyResult.error}</div>
                </div>
              )}
            </div>
          )}

          {/* Help */}
          <div className="text-center text-xs text-gray-600">
            Need help? Make sure OpenClaw is installed and the path points to your .openclaw directory
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
