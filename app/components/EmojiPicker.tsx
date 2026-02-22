"use client";

import { useState } from 'react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  'Robots & AI': ['🤖', '🦾', '🦿', '👾', '🛸', '⚙️', '🔧', '💻', '⚡', '🔮'],
  'Animals': ['🐺', '🦅', '🐉', '🦁', '🐯', '🦊', '🐻', '🦈', '🐙', '🦋'],
  'People': ['👨🔬', '👩💼', '👨💻', '👩🎓', '👨🏫', '👩🔬', '👨💼', '👩🏫', '🧑‍💻', '🧑‍🔬'],
  'Sports': ['🏋️', '⚽', '🏀', '🎯', '🏆', '🥇', '⛷️', '🏃', '🚴', '⛹️'],
  'Nature': ['🌟', '⭐', '💫', '🌙', '☀️', '🔥', '💧', '🌊', '🌲', '🌸'],
  'Objects': ['📊', '📈', '💼', '🎯', '🔔', '📡', '🛡️', '⚔️', '🔑', '💎'],
  'Symbols': ['✨', '💡', '🎨', '🎭', '🎪', '🎬', '🎵', '🎮', '🎲', '🧩']
};

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Robots & AI');

  // Emoji validation - only allow single emoji
  function handleEmojiInput(input: string) {
    // Remove any non-emoji characters and take only the first emoji
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu;
    const emojis = input.match(emojiRegex);
    
    if (emojis && emojis.length > 0) {
      onChange(emojis[0]);
    } else if (input === '') {
      onChange('');
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-12 h-12 bg-[#1a1a1a] border border-[#333] rounded flex items-center justify-center text-2xl hover:bg-[#222] transition-colors"
        >
          {value || '🤖'}
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => handleEmojiInput(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm"
          placeholder="Or type single emoji..."
          maxLength={2}
        />
      </div>

      {showPicker && (
        <div className="absolute top-full mt-2 left-0 bg-[#0a0a0a] border border-[#333] rounded shadow-lg z-50 w-80">
          {/* Category Tabs */}
          <div className="flex gap-1 p-2 border-b border-[#333] flex-wrap">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeCategory === category
                    ? 'bg-orange-500 text-black font-bold'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="p-3 grid grid-cols-10 gap-2 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setShowPicker(false);
                }}
                className="w-8 h-8 flex items-center justify-center text-2xl hover:bg-[#1a1a1a] rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-[#333] flex justify-end">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#222] rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
