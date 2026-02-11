import { useState } from 'react';
import { getApiKey, setApiKey } from '../lib/openrouter';
import { ModelSelector } from './ModelSelector';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [keyInput, setKeyInput] = useState(getApiKey() ?? '');

  const handleSaveKey = () => {
    setApiKey(keyInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-700"
            >
              Save
            </button>
          </div>
        </div>

        <ModelSelector />
      </div>
    </div>
  );
}
