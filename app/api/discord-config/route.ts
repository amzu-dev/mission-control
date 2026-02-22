import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get current Discord configuration
    const { stdout } = await execAsync('openclaw config get channels.discord --json');
    const config = JSON.parse(stdout || '{}');
    
    return NextResponse.json({ 
      config: config || {},
      enabled: config?.enabled || false
    });
  } catch (error: any) {
    console.error('Error fetching Discord config:', error);
    return NextResponse.json({ 
      config: {},
      enabled: false
    });
  }
}

export async function POST(request: Request) {
  try {
    const {
      botToken,
      enabled,
      guildId,
      userId,
      requireMention,
      dmPolicy,
      groupPolicy,
      streaming,
      historyLimit
    } = await request.json();
    
    if (!botToken && enabled) {
      return NextResponse.json({ 
        error: 'Bot token is required when enabling Discord' 
      }, { status: 400 });
    }
    
    // Build configuration commands
    const commands: string[] = [];
    
    // Set bot token securely
    if (botToken) {
      commands.push(`openclaw config set channels.discord.token '"${botToken}"' --json`);
    }
    
    // Set enabled status
    commands.push(`openclaw config set channels.discord.enabled ${enabled} --json`);
    
    // Set DM policy
    if (dmPolicy) {
      commands.push(`openclaw config set channels.discord.dmPolicy '${dmPolicy}'`);
    }
    
    // Set group policy
    if (groupPolicy) {
      commands.push(`openclaw config set channels.discord.groupPolicy '${groupPolicy}'`);
    }
    
    // Configure guild if provided
    if (guildId) {
      const guildConfig = {
        requireMention: requireMention !== undefined ? requireMention : true,
        users: userId ? [userId] : []
      };
      
      commands.push(
        `openclaw config set channels.discord.guilds.${guildId} '${JSON.stringify(guildConfig)}' --json`
      );
    }
    
    // Set streaming mode
    if (streaming) {
      commands.push(`openclaw config set channels.discord.streaming '${streaming}'`);
    }
    
    // Set history limit
    if (historyLimit !== undefined) {
      commands.push(`openclaw config set channels.discord.historyLimit ${historyLimit} --json`);
    }
    
    // Execute all commands
    for (const cmd of commands) {
      await execAsync(cmd);
    }
    
    // Restart gateway if Discord is enabled
    if (enabled) {
      try {
        await execAsync('openclaw gateway restart');
      } catch (restartError) {
        console.warn('Gateway restart may have failed:', restartError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Discord configuration saved successfully',
      needsRestart: enabled
    });
  } catch (error: any) {
    console.error('Error updating Discord config:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
