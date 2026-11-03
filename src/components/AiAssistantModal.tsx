import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { OpticalPrescription } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomerRx?: OpticalPrescription;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeCustomerRx,
}) => {
  const [prompt, setPrompt] = useState('');
  const [faceShape, setFaceShape] = useState('Oval');
  const [usage, setUsage] = useState('Computer & Screen Work');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.askAiAssistant({
        prompt: prompt.trim() || undefined,
        customerRx: activeCustomerRx,
        faceShape,
        usage,
      });
      setResponse(res.recommendation);
      setSource(res.source);
    } catch {
      setResponse(
        'Recommended Solution:\n• Recommend Blue-Cut 420nm filter lenses to combat digital eye strain.\n• Lightweight TR90 frame with soft silicone pads.\n• Regular 20-20-20 screen breaks.'
      );
      setSource('built-in rules');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Best lenses for heavy night driving glare',
    'High minus power lens thinning recommendation',
    'Customer complains of headache while looking at laptop',
    'Progressive lens adaptation advice',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl my-2 sm:my-8 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base">
                Optical AI Dispensing Assistant
              </h2>
              <p className="text-[11px] text-slate-400">
                Powered by Gemini & Optical Dispensing Engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Face Shape</label>
              <select
                value={faceShape}
                onChange={(e) => setFaceShape(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="Oval">Oval Face</option>
                <option value="Round">Round Face</option>
                <option value="Square">Square Face</option>
                <option value="Heart">Heart / Triangle Face</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Usage</label>
              <select
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="Computer & Screen Work">Computer & Screen Work</option>
                <option value="Night & Highway Driving">Night & Highway Driving</option>
                <option value="Daily Reading & Office">Daily Reading & Office</option>
                <option value="Outdoor & Sports (UV/Sun)">Outdoor & Sports (UV/Sun)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ask Optical Question or Customer Concern
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="e.g. Which frame suits -4.50 D with high cylinder?"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={() => handleAsk()}
                disabled={loading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Ask
              </button>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => {
                  setPrompt(qp);
                }}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-left"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Response Box */}
          {loading && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-600 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Analyzing optical prescription & parameters...</span>
            </div>
          )}

          {response && !loading && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-600" />
                  <span>Optical Guidance Recommendation</span>
                </div>
                {source && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 rounded text-amber-800">
                    {source}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {response}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

