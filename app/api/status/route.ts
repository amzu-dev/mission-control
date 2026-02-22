import { NextResponse } from 'next/server';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE = '/Users/venkat/.openclaw/workspace';

export async function GET() {
  try {
    // Read identity with fallback
    let name = 'Sun';
    let emoji = '🤖';
    
    try {
      const identityPath = join(WORKSPACE, 'IDENTITY.md');
      if (existsSync(identityPath)) {
        const identity = readFileSync(identityPath, 'utf-8');
        const nameMatch = identity.match(/\*\*Name:\*\*\s*(.+)/);
        const emojiMatch = identity.match(/\*\*Emoji:\*\*\s*(.+)/);
        name = nameMatch?.[1]?.trim() || name;
        emoji = emojiMatch?.[1]?.trim() || emoji;
      }
    } catch (identityError) {
      console.warn('Could not read IDENTITY.md:', identityError);
    }
    
    // Read recent memory with fallback
    let recentActivity: any[] = [];
    let memoryFileCount = 0;
    
    try {
      const memoryDir = join(WORKSPACE, 'memory');
      if (existsSync(memoryDir)) {
        const memoryFiles = readdirSync(memoryDir)
          .filter(f => f.endsWith('.md'))
          .sort()
          .reverse()
          .slice(0, 5);
        
        memoryFileCount = memoryFiles.length;
        
        recentActivity = memoryFiles.map(file => {
          try {
            const content = readFileSync(join(memoryDir, file), 'utf-8');
            return {
              date: file.replace('.md', ''),
              preview: content.slice(0, 200)
            };
          } catch {
            return {
              date: file.replace('.md', ''),
              preview: 'Could not read file'
            };
          }
        });
      }
    } catch (memoryError) {
      console.warn('Could not read memory directory:', memoryError);
    }
    
    // Get workspace stats with fallback
    let totalFiles = 0;
    try {
      if (existsSync(WORKSPACE)) {
        totalFiles = readdirSync(WORKSPACE).length;
      }
    } catch (statsError) {
      console.warn('Could not read workspace stats:', statsError);
    }
    
    return NextResponse.json({
      name,
      emoji,
      status: 'online',
      uptime: process.uptime(),
      workspace: WORKSPACE,
      stats: {
        totalFiles,
        memoryFiles: memoryFileCount
      },
      recentActivity
    });
  } catch (error: any) {
    console.error('Error reading workspace:', error);
    return NextResponse.json({ 
      error: 'Failed to read workspace',
      name: 'Sun',
      emoji: '🤖',
      status: 'error',
      uptime: process.uptime(),
      workspace: WORKSPACE,
      stats: { totalFiles: 0, memoryFiles: 0 },
      recentActivity: []
    }, { status: 200 });
  }
}
