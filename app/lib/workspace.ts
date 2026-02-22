// Workspace path management
export const DEFAULT_WORKSPACE_PATH = process.env.HOME + '/.openclaw';

export function getWorkspacePath(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_WORKSPACE_PATH;
  }
  
  const saved = localStorage.getItem('openclaw_workspace_path');
  return saved || DEFAULT_WORKSPACE_PATH;
}

export function setWorkspacePath(path: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('openclaw_workspace_path', path);
  }
}

export function clearWorkspacePath(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('openclaw_workspace_path');
  }
}
