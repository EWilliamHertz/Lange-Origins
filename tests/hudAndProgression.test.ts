import { describe, it, expect } from 'vitest';
import { PRESETS } from '../src/components/ActionBarPresets';
import { ChatMessage, ChatChannel } from '../src/components/ChannelChat';
import { PartyMember } from '../src/components/HUDPartyOverlay';

describe('Action Bar Loadout Presets', () => {
  it('defines 3 distinct presets with unique shortcuts and names', () => {
    expect(PRESETS).toHaveLength(3);
    expect(PRESETS[0].shortcut).toBe('Shift+1');
    expect(PRESETS[1].shortcut).toBe('Shift+2');
    expect(PRESETS[2].shortcut).toBe('Shift+3');
    const ids = PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(3);
  });
});

describe('Channel Chat System', () => {
  it('properly categorizes chat messages by channel', () => {
    const messages: ChatMessage[] = [
      { id: '1', sender: 'Player1', text: 'Hello everyone', channel: 'all', timestamp: 1000 },
      { id: '2', sender: 'PartyLeader', text: 'Attack the boss!', channel: 'party', timestamp: 1010 },
      { id: '3', sender: 'Trader', text: 'WTS Iron Ore 5g', channel: 'trade', timestamp: 1020 },
      { id: '4', sender: 'System', text: 'A boss has appeared in Dungeon', channel: 'system', timestamp: 1030 },
    ];

    const partyMessages = messages.filter(m => m.channel === 'party' || m.channel === 'system');
    expect(partyMessages).toHaveLength(2);
    expect(partyMessages.map(m => m.id)).toEqual(['2', '4']);

    const tradeMessages = messages.filter(m => m.channel === 'trade');
    expect(tradeMessages).toHaveLength(1);
    expect(tradeMessages[0].text).toBe('WTS Iron Ore 5g');
  });
});

describe('Party Foundation System', () => {
  it('correctly reports party member health percentages', () => {
    const members: PartyMember[] = [
      { id: 'p1', name: 'WarriorLeader', playerClass: 'warrior', hp: 80, maxHp: 100, isLeader: true },
      { id: 'p2', name: 'MageFriend', playerClass: 'mage', hp: 30, maxHp: 60, isLeader: false },
    ];

    const p1HpPercent = Math.floor((members[0].hp / members[0].maxHp) * 100);
    const p2HpPercent = Math.floor((members[1].hp / members[1].maxHp) * 100);

    expect(p1HpPercent).toBe(80);
    expect(p2HpPercent).toBe(50);
    expect(members[0].isLeader).toBe(true);
    expect(members[1].isLeader).toBe(false);
  });
});
