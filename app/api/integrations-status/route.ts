import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get Discord status
    let discordEnabled = false;
    let telegramEnabled = false;
    
    try {
      const { stdout: discordOut } = await execAsync('openclaw config get channels.discord.enabled --json');
      discordEnabled = discordOut.trim() === 'true';
    } catch (error) {
      // Discord not configured
    }
    
    try {
      const { stdout: telegramOut } = await execAsync('openclaw config get channels.telegram --json');
      const telegramConfig = JSON.parse(telegramOut || '{}');
      telegramEnabled = telegramConfig?.accounts && Object.keys(telegramConfig.accounts).length > 0;
    } catch (error) {
      // Telegram not configured
    }
    
    return NextResponse.json({
      discord: {
        enabled: discordEnabled,
        status: discordEnabled ? 'connected' : 'disabled'
      },
      telegram: {
        enabled: telegramEnabled,
        status: telegramEnabled ? 'connected' : 'disabled'
      }
    });
  } catch (error: any) {
    console.error('Error fetching integrations status:', error);
    return NextResponse.json({
      discord: { enabled: false, status: 'error' },
      telegram: { enabled: false, status: 'error' }
    });
  }
}
