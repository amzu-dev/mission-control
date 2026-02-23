# Team Hierarchy Feature

## Summary
Enhanced agent hierarchy to show both **configured team members** (from openclaw.json allowAgents) and **active subagent sessions** (spawned tasks).

## Problem
Mission Control was only showing **active subagent sessions** (running tasks), but not the **configured team structure** defined in `openclaw.json`.

For example, `senior-developer` (Alex) has a configured team:
- frontend-dev (Jordan)
- backend-dev (Sam)
- devops-engineer (Riley)
- qa-engineer (Taylor)
- ml-engineer (Morgan)

But this wasn't visible unless those agents were actively spawned.

## Solution

### 1. Read OpenClaw Configuration
**File:** `app/api/agent-hierarchy/route.ts`

Now reads `~/.openclaw/openclaw.json` to extract `subagents.allowAgents` for each agent:

```typescript
{
  "id": "senior-developer",
  "subagents": {
    "allowAgents": [
      "frontend-dev",
      "backend-dev",
      "ml-engineer",
      "devops-engineer",
      "qa-engineer"
    ]
  }
}
```

### 2. Two Types of Relationships

#### Configured Team Members (👥)
- Defined in `openclaw.json` → `subagents.allowAgents`
- Shows who the agent **can delegate to**
- Always visible (not session-dependent)
- Badge: `👥 5` (cyan)

#### Active Subagents (⚡)
- Spawned sessions with `kind: 'subagent'`
- Shows what tasks are **currently running**
- Session-dependent (comes and goes)
- Badge: `⚡ 2` (purple)

### 3. Visual Hierarchy

```
▼ 🏗️ Alex (senior-developer) [👥 5] [⚡ 2]
  
  👥 CONFIGURED TEAM
  ├─ 🎨 Jordan (frontend-dev)
  ├─ ⚙️ Sam (backend-dev)
  ├─ 🧠 Morgan (ml-engineer)
  ├─ 🚀 Riley (devops-engineer)
  └─ 🔍 Taylor (qa-engineer)
  
  ⚡ ACTIVE TASKS
  ├─ mission-control-hierarchy (ACTIVE) - 2K tokens - 2m ago
  └─ api-refactor (ACTIVE) - 1K tokens - 5m ago
```

## Technical Implementation

### API Response Structure
```typescript
{
  id: "senior-developer",
  name: "Alex",
  emoji: "🏗️",
  
  // Configured team members
  teamMembers: [
    { id: "frontend-dev", name: "Jordan", emoji: "🎨", type: "team" },
    { id: "backend-dev", name: "Sam", emoji: "⚙️", type: "team" },
    // ...
  ],
  
  // Active spawned subagents
  subagents: [
    { 
      key: "agent:senior-developer:subagent:abc123",
      displayName: "mission-control-hierarchy",
      status: "active",
      tokens: 2000,
      type: "active"
    }
  ]
}
```

### Component Updates

**AgentHierarchy.tsx:**
- Shows both `teamMembers` and `subagents`
- Different sections with headers
- Team members: Simple list with names
- Active subagents: Full details (status, tokens, time)

## User Benefits

1. **Visibility** - See the full team structure even when no tasks are running
2. **Context** - Understand delegation capabilities at a glance
3. **Monitoring** - Track both configured team and active workload
4. **Planning** - Know which agents can handle tasks before spawning

## Example Usage

**senior-developer (Alex):**
- Team: 5 configured specialists
- Active tasks: 0-5 spawned subagents

**health-coach:**
- Team: 2 configured (nutritionist, researcher)
- Active tasks: Varies based on workload

**trading-wolf:**
- Team: 2 configured (news-hunter, market-scanner)
- Active tasks: Real-time market analysis

## Files Changed

- `app/api/agent-hierarchy/route.ts` - Read openclaw.json, extract allowAgents
- `app/components/AgentHierarchy.tsx` - Display both team and active subagents
- `app/page.tsx` - Updated interface to include teamMembers
- `app/subagents/page.tsx` - Updated interface to include teamMembers

---
**Implemented by:** Tech Lead Alex 🏗️  
**Date:** 2025-02-23  
**Inspiration:** Understanding the configured team structure from openclaw.json
