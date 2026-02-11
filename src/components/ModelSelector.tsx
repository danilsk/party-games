import { useState } from 'react';
import { getModel, setModel } from '../lib/openrouter';

export function ModelSelector() {
  const [value, setValue] = useState(getModel());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setModel(e.target.value);
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">Model override</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="openai/gpt-oss-120b:nitro"
        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
      />
    </div>
  );
}
