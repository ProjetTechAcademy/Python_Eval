import React, { useState, useEffect } from 'react';
import { Fiche } from '../types';
import { Volume2, FileText, Layout, Image, Video, ExternalLink, HelpCircle, Eye } from 'lucide-react';

interface IntegratedAudioVisualPlayerProps {
  fiche: Fiche;
  activeZone: 'A' | 'B' | 'C';
  selectedResourceForPreview: {
    title: string;
    resourceName: string;
    url: string;
    type: string;
    ficheId: number;
  };
  previewHeight: 'compact' | 'large';
  onClose: () => void;
  onSetHeight: (height: 'compact' | 'large') => void;
  onSpeechActivate: () => void;
}

function getDriveEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return null;

  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  if (trimmed.includes('docs.google.com')) {
    const docMatch = trimmed.match(/\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch && docMatch[2]) {
      return `https://docs.google.com/${docMatch[1]}/d/${docMatch[2]}/preview`;
    }
  }

  return trimmed;
}

export default function IntegratedAudioVisualPlayer({
  fiche,
  activeZone,
  selectedResourceForPreview,
  previewHeight,
  onClose,
  onSetHeight,
  onSpeechActivate
}: IntegratedAudioVisualPlayerProps) {

  // Retrieve companion files
  const pdfUrl = fiche.coursFileUrl || (fiche.coursFile?.startsWith('http') ? fiche.coursFile : '');
  const pdfName = fiche.coursFile || `Fiche_${fiche.id}_Cours.pdf`;

  const slideUrl = activeZone === 'A' ? fiche.slide1 : activeZone === 'B' ? fiche.slide2 : fiche.slide3;
  const imageUrl = activeZone === 'A' ? fiche.image1 : activeZone === 'B' ? fiche.image2 : fiche.image3;
  const videoUrl = activeZone === 'A' ? fiche.video1 : activeZone === 'B' ? fiche.video2 : fiche.video3;

  // Set default tab selection based on available resources
  const [activeTab, setActiveTab] = useState<'pdf' | 'slide' | 'image' | 'video' | 'none'>(() => {
    if (pdfUrl) return 'pdf';
    if (slideUrl) return 'slide';
    if (imageUrl) return 'image';
    if (videoUrl) return 'video';
    return 'none';
  });

  // Keep height state local or synchronized for viewing ease
  const computedHeight = previewHeight === 'compact' ? 'h-[300px]' : 'h-[550px]';

  const getCompanionUrlAndType = () => {
    switch (activeTab) {
      case 'pdf':
        return { url: pdfUrl, type: 'pdf' };
      case 'slide':
        return { url: slideUrl, type: 'slide' };
      case 'image':
        return { url: imageUrl, type: 'image' };
      case 'video':
        return { url: videoUrl, type: 'video' };
      default:
        return { url: null, type: 'none' };
    }
  };

  const currentCompanion = getCompanionUrlAndType();

  return (
    <div className="w-full mt-4 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 text-slate-100 flex flex-col gap-3.5 animate-slideDown shadow-2xl">
      {/* Dynamic Player Header */}
      <div className="flex items-center justify-between text-white border-b border-white/[0.08] pb-3 text-xs gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase font-black flex items-center gap-1">
            <Volume2 className="w-3 h-3 animate-pulse text-emerald-400" /> ÉCOUTE ACTIVE
          </span>
          <span className="font-extrabold text-slate-200 truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={selectedResourceForPreview.resourceName}>
            {selectedResourceForPreview.resourceName}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSpeechActivate}
            className="p-1 px-2 bg-gradient-to-r from-[#4285F4] to-indigo-650 hover:from-blue-600 hover:to-indigo-750 text-white rounded-lg transition-all text-[10px] flex items-center gap-1 font-bold border border-transparent shadow hover:scale-105 active:scale-95 cursor-pointer select-none"
            title="Ouvrir le liseur vocal pour ce document"
          >
            <Volume2 className="w-3.5 h-3.5" /> Synthèse Vocale 🔊
          </button>
          
          <a
            href={selectedResourceForPreview.url}
            target="_blank"
            referrerPolicy="no-referrer"
            rel="noopener noreferrer"
            className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all text-[10px] flex items-center gap-1 font-bold border border-white/[0.08]"
          >
            Drive d'Origine ↗
          </a>
          
          <button
            onClick={() => onSetHeight(previewHeight === 'compact' ? 'large' : 'compact')}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-[10px] flex items-center gap-1 font-extrabold cursor-pointer border border-slate-705 shadow-sm"
          >
            {previewHeight === 'compact' ? '↕️ Mode Plein Écran' : '↕️ Mode Compact'}
          </button>
          
          <button
            onClick={onClose}
            className="text-white font-black text-[10px] p-1 px-2 bg-red-650 hover:bg-red-700 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* 1. ULTRA-THIN AUDIO DECK (Extrêmement fin et moderne) */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase leading-tight tracking-wider">AUDIO PLAYER DIRECT</p>
            <p className="text-[11px] font-bold text-slate-200 truncate max-w-sm">{selectedResourceForPreview.resourceName}</p>
          </div>
        </div>

        {/* The Audio IFrame or Tag itself (Super Thin layout) */}
        <div className="flex-1 md:max-w-md w-full">
          {getDriveEmbedUrl(selectedResourceForPreview.url) ? (
            <div className="w-full h-[55px] relative rounded-lg overflow-hidden bg-slate-950 border border-slate-850">
              <iframe 
                src={getDriveEmbedUrl(selectedResourceForPreview.url) || undefined} 
                className="w-full h-[150px] border-0 absolute -top-[45px] left-0 scale-95" 
                allow="autoplay; encrypted-media"
                title="In-App Audio Player"
              />
            </div>
          ) : (
            <div className="p-1">
              <audio 
                src={selectedResourceForPreview.url} 
                controls 
                autoPlay
                className="w-full h-8 outline-none bg-slate-950 rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. DYNAMIC COMPANION tabs SELECTION (Élégant, ergonomique, "beau gosse") */}
      <div className="mt-1 flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            👁️ Supports Visuels Disponibles (à regarder pendant l'écoute) :
          </label>
          <div className="flex flex-wrap gap-1.5">
            {/* PDF Support Tab */}
            <button
              onClick={() => setActiveTab('pdf')}
              disabled={!pdfUrl}
              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow shadow-blue-600/30 font-extrabold scale-105'
                  : pdfUrl
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]" title={pdfName}>
                PDF • {pdfName}
              </span>
            </button>

            {/* Slides Presentation Tab */}
            <button
              onClick={() => setActiveTab('slide')}
              disabled={!slideUrl}
              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'slide'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30 font-extrabold scale-105'
                  : slideUrl
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <Layout className="w-3.5 h-3.5 shrink-0" />
              <span>SlidesPrésentation 📝</span>
            </button>

            {/* Infography Image Tab */}
            <button
              onClick={() => setActiveTab('image')}
              disabled={!imageUrl}
              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white border-transparent shadow shadow-blue-500/30 font-extrabold scale-105'
                  : imageUrl
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <Image className="w-3.5 h-3.5 shrink-0" />
              <span>Infographie Schémas 🖼️</span>
            </button>

            {/* Video Companion Tab */}
            <button
              onClick={() => setActiveTab('video')}
              disabled={!videoUrl}
              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-red-600 hover:bg-red-750 text-white border-transparent shadow shadow-red-600/30 font-extrabold scale-105'
                  : videoUrl
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>Vidéo Explicative 🎬</span>
            </button>
          </div>
        </div>

        {/* 3. DYNAMIC CONTENT PREVIEW IFRAME FOR ACTIVE COMPANION */}
        {activeTab !== 'none' && currentCompanion.url ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                VISU EN COURS : <strong className="text-slate-100 uppercase">{activeTab === 'pdf' ? pdfName : `${activeTab} d'étude`}</strong>
              </span>
              <a
                href={currentCompanion.url}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="text-xs text-blue-405 hover:underline flex items-center gap-0.5"
              >
                Plein écran déporté ↗
              </a>
            </div>
            {getDriveEmbedUrl(currentCompanion.url) ? (
              <div className={`w-full relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner transition-all duration-300 ${computedHeight}`}>
                <iframe 
                  src={getDriveEmbedUrl(currentCompanion.url) || undefined} 
                  className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                  allow="autoplay; encrypted-media"
                  title="Companion Visual Document Viewer"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-300 bg-slate-900 rounded-xl border border-slate-850 flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">⚠️</span>
                <h5 className="font-bold text-sm text-slate-100">Intégration directe restreinte</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Le Drive nécessite une authentification ou un accès externe pour ce format.</p>
                <a 
                  href={currentCompanion.url} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer" 
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow cursor-pointer shadow-blue-600/25"
                >
                  Ouvrir le support dans un onglet <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
            <HelpCircle className="w-7 h-7 text-slate-600 mb-1.5" />
            <h5 className="font-bold text-xs text-slate-300">Aucun document visuel d'accompagnement</h5>
            <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs">Aucun PDF de cours, présentation ou infographics n'a été spécifié pour ce module.</p>
          </div>
        )}
      </div>

      {/* Info Notice footer inside reader */}
      <div className="text-[10px] text-slate-550 border-t border-white/[0.04] pt-2 flex items-center justify-between flex-wrap gap-2 italic">
        <span>💡 Vous pouvez changer d'onglet visuel sans arrêter ou perturber la lecture audio en cours.</span>
        <span>M-Motors Sync &bull; Mode d'apprentissage actif</span>
      </div>
    </div>
  );
}
