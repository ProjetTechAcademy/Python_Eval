import React from 'react';
import { ExternalLink, Headphones, FileText, Video, Image, Library, Volume2 } from 'lucide-react';

interface ResourcePlayerProps {
  ficheId: number;
  ficheTitle: string;
  resourceName: string;
  url?: string;
  type: 'audio' | 'slide' | 'video' | 'image' | 'nblm' | 'studi';
  zone: 'A' | 'B' | 'C' | 'common';
  onPreviewInApp?: (resource: { title: string; resourceName: string; url: string; type: string; ficheId: number }) => void;
}

export default function ResourcePlayer({
  ficheId,
  ficheTitle,
  resourceName,
  url,
  type,
  zone,
  onPreviewInApp
}: ResourcePlayerProps) {

  if (!url) {
    return (
      <div className="flex items-center gap-1.5 p-1.5 px-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-405 text-[10px] italic">
        <span>Non disponible pour cette Zone 💤</span>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'audio':
        return <Headphones className="w-3.5 h-3.5 text-emerald-600" />;
      case 'slide':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-red-650" />;
      case 'image':
        return <Image className="w-3.5 h-3.5 text-blue-600" />;
      case 'nblm':
        return <Library className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Library className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const getZoneLabel = () => {
    if (zone === 'A') return { text: 'Moi', bg: 'bg-[#4285F4]/10 text-[#4285F4] border-[#4285F4]/15' };
    if (zone === 'B') return { text: 'Jury', bg: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/15' };
    if (zone === 'C') return { text: 'Neu.', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/15' };
    return { text: 'Studi', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100/50' };
  };

  const getTypeBorders = () => {
    switch (type) {
      case 'audio':
        return 'border-l-[3.5px] border-l-emerald-500 hover:border-l-emerald-600 bg-[#10b981]/[0.03] hover:bg-[#10b981]/[0.07] border-slate-200';
      case 'slide':
        return 'border-l-[3.5px] border-l-amber-500 hover:border-l-amber-600 bg-[#f59e0b]/[0.03] hover:bg-[#f59e0b]/[0.07] border-slate-200';
      case 'video':
        return 'border-l-[3.5px] border-l-red-500 hover:border-l-red-600 bg-[#ef4444]/[0.03] hover:bg-[#ef4444]/[0.07] border-slate-200';
      case 'image':
        return 'border-l-[3.5px] border-l-blue-500 hover:border-l-blue-600 bg-[#3b82f6]/[0.03] hover:bg-[#3b82f6]/[0.07] border-slate-200';
      case 'nblm':
        return 'border-l-[3.5px] border-l-purple-500 hover:border-l-purple-600 bg-[#a855f7]/[0.03] hover:bg-[#a855f7]/[0.07] border-slate-200';
      default:
        return 'border-l-[3.5px] border-l-indigo-500 hover:border-l-indigo-600 bg-[#6366f1]/[0.03] hover:bg-[#6366f1]/[0.07] border-slate-200';
    }
  };

  const zoneBadge = getZoneLabel();
  const borderStyleClasses = getTypeBorders();

  return (
    <div className={`flex items-center justify-between gap-2.5 p-2 hover:shadow-md border rounded-xl transition-all duration-300 transform hover:-translate-y-[1px] ${borderStyleClasses}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="p-1 px-[5px] bg-white rounded-md border border-slate-200 shadow-sm shrink-0">
          {getTypeIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono font-medium text-slate-400">Card #{ficheId}</span>
            <span className={`px-1 rounded text-[8px] font-bold border leading-none scale-90 origin-left ${zoneBadge.bg}`}>
              {zoneBadge.text}
            </span>
          </div>
          <h4 className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1" title={resourceName}>
            {resourceName}
          </h4>
        </div>
      </div>

      {/* Play/Read inline or open external action links */}
      <div className="flex items-center gap-1 shrink-0">
        {onPreviewInApp && (
          <button
            onClick={() => onPreviewInApp({ title: ficheTitle, resourceName, url, type, ficheId })}
            className="py-1 px-2 pb-[5px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-[10px] flex items-center gap-1 font-extrabold cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            {type === 'audio' ? '🔊 Écouter' : '👁️ Lire'}
          </button>
        )}
        <a
          href={url}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="p-1 px-1.5 bg-white hover:bg-slate-50 text-slate-650 rounded-lg transition-all text-[10px] flex items-center gap-0.5 font-bold border border-slate-200"
        >
          <span>Ouvrir</span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
        </a>
      </div>
    </div>
  );
}
