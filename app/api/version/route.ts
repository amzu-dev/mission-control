import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get current OpenClaw version
    let currentVersion = 'unknown';
    try {
      const { stdout } = await execAsync('openclaw --version', { timeout: 3000 });
      const match = stdout.match(/(\d+\.\d+\.\d+)/);
      if (match) {
        currentVersion = match[1];
      }
    } catch (error) {
      console.error('Failed to get current version:', error);
    }

    // Get latest version from GitHub
    let latestVersion = null;
    let updateAvailable = false;
    
    try {
      const response = await fetch('https://api.github.com/repos/openclaw/openclaw/releases/latest', {
        headers: {
          'User-Agent': 'Mission-Control-Dashboard'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        latestVersion = data.tag_name?.replace(/^v/, '') || null;
        
        if (currentVersion !== 'unknown' && latestVersion) {
          updateAvailable = compareVersions(latestVersion, currentVersion) > 0;
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest version from GitHub:', error);
    }

    return NextResponse.json({
      current: currentVersion,
      latest: latestVersion,
      updateAvailable
    });
  } catch (error: any) {
    console.error('Error in version check:', error);
    return NextResponse.json({ 
      current: 'unknown',
      latest: null,
      updateAvailable: false,
      error: error.message 
    });
  }
}

// Simple semantic version comparison
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0);
    if (diff !== 0) return diff;
  }
  
  return 0;
}
