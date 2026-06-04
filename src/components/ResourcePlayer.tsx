import React, { useState } from 'react';
import { Play, Pause, ExternalLink, Headphones, FileText, Video, Image, Library, RefreshCw, Volume2, SkipForward, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ResourcePlayerProps {
  ficheId: number;
  ficheTitle: string;
  resourceName: string;
  url?: string;
  type: 'audio' | 'slide' | 'video' | 'image' | 'nblm' | 'studi';
  zone: 'A' | 'B' | 'common';
}

export default function ResourcePlayer({
  ficheId,
  ficheTitle,
  resourceName,
  url,
  type,
  zone
}: ResourcePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!url) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic">
        <span>Non disponible pour cette Zone 💤</span>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'audio':
        return <Headphones className="w-4 h-4 text-emerald-600" />;
      case 'slide':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-600" />;
      case 'nblm':
        return <Library className="w-4 h-4 text-purple-600" />;
      default:
        return <Library className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getZoneLabel = () => {
    if (zone === 'A') return { text: 'Zone A (Moi)', bg: 'bg-[#4285F4]/10 text-[#4285F4] border-[#4285F4]/20' };
    if (zone === 'B') return { text: 'Zone B (Jury)', bg: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/20' };
    return { text: 'Commun 🤝', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const zoneBadge = getZoneLabel();

  // Handle a simulation player for Audio
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-400 transition-all duration-200 relative">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            {getTypeIcon()}
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span>Card #{ficheId}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-sans border ${zoneBadge.bg}`}>
                {zoneBadge.text}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">
              {resourceName}
            </h4>
          </div>
        </div>

        {/* Action Link to the original items */}
        <a
          href={url}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="p-1 px-2.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all text-xs flex items-center gap-1 font-medium border border-slate-200"
          id={`resource-url-link-${ficheId}-${type}`}
        >
          Ouvrir <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Embedded interactive players depending on content block type */}
      {type === 'audio' && (
        <div className="mt-3 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/60">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={togglePlay}
              className={`p-2 rounded-full cursor-pointer transition-all ${
                isPlaying 
                ? 'bg-emerald-600 text-white animate-pulse' 
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            {/* Waveform Animation */}
            <div className="flex-1 flex items-center gap-0.5 h-6">
              {[4, 8, 14, 18, 12, 6, 8, 15, 20, 14, 8, 10, 16, 12, 18, 10, 5, 8, 12, 6].map((h, i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-300 ${
                    isPlaying ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  style={{
                    height: isPlaying 
                      ? `${Math.max(3, Math.sin(Date.now() / 150 + i) * h + h/1.2)}px` 
                      : '4px'
                  }}
                />
              ))}
            </div>

            <div className="text-xs font-mono text-emerald-800 font-medium">
              {isPlaying ? '0:14' : '0:00'} / 3:45
            </div>
          </div>
          
          <div className="mt-2 flex justify-between items-center text-[10px] text-emerald-700/80">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Audio Lecteur Virtuel
            </span>
            <span className="font-mono text-[9px]">Extensions .m4a</span>
          </div>
        </div>
      )}

      {type === 'slide' && (
        <div className="mt-3 bg-amber-50/50 rounded-lg p-3 border border-amber-100/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-amber-100 text-amber-800 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-800">Visualiseur de Diapos/Slides</p>
              <p className="text-[10px] text-amber-700">Explore la structure de la présentation</p>
            </div>
          </div>
          <div className="text-[10px] font-mono font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            PDF
          </div>
        </div>
      )}

      {/* Metadata references */}
      {type === 'nblm' && (
        <div className="mt-3 bg-purple-50/50 rounded-lg p-3 border border-purple-100/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-purple-900">
            <span className="px-1.5 py-0.5 bg-purple-100 font-bold rounded">NotebookLM workspace</span>
            <span className="text-[11px] text-purple-700">Notes d'IA de Référence</span>
          </div>
        </div>
      )}
    </div>
  );
}
