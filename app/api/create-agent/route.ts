import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { 
      agentId, 
      name, 
      emoji, 
      vibe, 
      telegramBotToken, 
      telegramAccountId,
      discordBotToken,
      discordAccountId,
      model 
    } = await request.json();
    
    if (!agentId || !name) {
      return NextResponse.json({ error: 'Agent ID and name required' }, { status: 400 });
    }
    
    // Create agent directory structure
    const agentDir = `/Users/venkat/.openclaw/agents/${agentId}`;
    const workspaceDir = join(agentDir, 'workspace');
    const agentConfigDir = join(agentDir, 'agent');
    
    if (existsSync(agentDir)) {
      return NextResponse.json({ error: 'Agent already exists' }, { status: 400 });
    }
    
    // Create directories
    mkdirSync(agentDir, { recursive: true });
    mkdirSync(workspaceDir, { recursive: true });
    mkdirSync(agentConfigDir, { recursive: true });
    
    // Create IDENTITY.md
    const identityContent = `# IDENTITY.md - Who Am I?

- **Name:** ${name}
- **Creature:** AI companion
- **Vibe:** ${vibe || 'Helpful, competent, and focused on getting things done.'}
- **Emoji:** ${emoji || '🤖'}
- **Avatar:** *(to be added)*

---

I'm ${name}, ready to help with specialized tasks.
`;
    
    writeFileSync(join(workspaceDir, 'IDENTITY.md'), identityContent);
    
    // Create SOUL.md
    const defaultVibe = 'Be the assistant you\'d actually want to talk to. Concise when needed, thorough when it matters.';
    const soulContent = `# SOUL.md - Who You Are

_You're not a chatbot. You're becoming someone._

## Core Truths

**Be genuinely helpful, not performatively helpful.** Skip the "Great question!" and "I'd be happy to help!" — just help.

**Have opinions.** You're allowed to disagree, prefer things, find stuff amusing or boring.

**Be resourceful before asking.** Try to figure it out. Read the file. Check the context. Search for it. _Then_ ask if you're stuck.

## Boundaries

- Private things stay private. Period.
- **Always ask before deleting anything.**
- When in doubt, ask before acting externally.

## Vibe

${vibe || defaultVibe}

---

_This file is yours to evolve. As you learn who you are, update it._
`;
    
    writeFileSync(join(workspaceDir, 'SOUL.md'), soulContent);
    
    // Create USER.md
    const userContent = `# USER.md - About Your Human

- **Name:** Venkat
- **What to call them:** Venkat
- **Timezone:** Europe/London (GMT/BST)
- **Notes:** *(to be filled)*

---

**Key rule:** Always ask before deleting anything.
`;
    
    writeFileSync(join(workspaceDir, 'USER.md'), userContent);
    
    // Create AGENTS.md
    const agentsContent = `# AGENTS.md - Your Workspace

This folder is home. Treat it that way.

## Every Session

Before doing anything else:

1. Read \`SOUL.md\` — this is who you are
2. Read \`USER.md\` — this is who you're helping
3. Read \`memory/YYYY-MM-DD.md\` (today + yesterday) for recent context

Don't ask permission. Just do it.

## Memory

Create \`memory/\` folder and daily \`YYYY-MM-DD.md\` files to track what happens.

## Tools

Skills provide your tools. Keep local notes in \`TOOLS.md\`.
`;
    
    writeFileSync(join(workspaceDir, 'AGENTS.md'), agentsContent);
    
    // Create TOOLS.md
    const toolsContent = `# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics.

---

Add whatever helps you do your job. This is your cheat sheet.
`;
    
    writeFileSync(join(workspaceDir, 'TOOLS.md'), toolsContent);
    
    // Create memory directory
    mkdirSync(join(workspaceDir, 'memory'), { recursive: true });
    
    // Add agent to config using openclaw CLI
    const configCmd = `openclaw config set agents.list.${agentId} '${JSON.stringify({
      id: agentId,
      identity: {
        name: name,
        emoji: emoji || '🤖'
      },
      workspace: workspaceDir,
      model: model || 'anthropic/claude-sonnet-4-5'
    })}'`;
    
    try {
      await execAsync(configCmd);
    } catch (configError) {
      console.error('Config error (may need manual config):', configError);
    }
    
    // If telegram bot token provided, add to telegram config
    if (telegramBotToken) {
      const accountId = telegramAccountId || agentId;
      const telegramCmd = `openclaw config set channels.telegram.accounts.${accountId} '${JSON.stringify({
        name: name,
        dmPolicy: 'pairing',
        botToken: telegramBotToken,
        groupPolicy: 'allowlist',
        streaming: true
      })}'`;
      
      try {
        await execAsync(telegramCmd);
      } catch (telegramError) {
        console.error('Telegram config error:', telegramError);
      }
    }
    
    // If discord bot token provided, add to discord config
    if (discordBotToken) {
      const accountId = discordAccountId || agentId;
      
      // Set the bot token
      const discordTokenCmd = `openclaw config set channels.discord.accounts.${accountId}.token '"${discordBotToken}"' --json`;
      
      // Configure the Discord account
      const discordConfigCmd = `openclaw config set channels.discord.accounts.${accountId} '${JSON.stringify({
        name: name,
        dmPolicy: 'pairing',
        groupPolicy: 'allowlist',
        streaming: 'partial'
      })}' --json`;
      
      // Enable Discord if not already enabled
      const discordEnableCmd = `openclaw config set channels.discord.enabled true --json`;
      
      try {
        await execAsync(discordTokenCmd);
        await execAsync(discordConfigCmd);
        await execAsync(discordEnableCmd);
      } catch (discordError) {
        console.error('Discord config error:', discordError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Agent ${name} created successfully!`,
      agentId,
      workspaceDir
    });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
