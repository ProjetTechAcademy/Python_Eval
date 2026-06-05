import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Play, 
  Pause, 
  Square, 
  X, 
  Sparkles, 
  Settings, 
  FileText, 
  Copy, 
  Check, 
  Volume1, 
  HelpCircle,
  Share2,
  Trash2
} from 'lucide-react';
import { Fiche } from '../types';

interface SpeechReaderModalProps {
  fiche: Fiche | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SpeechReaderModal({ fiche, isOpen, onClose }: SpeechReaderModalProps) {
  const [textToRead, setTextToRead] = useState('');
  const [isCustomTextMode, setIsCustomTextMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0); // Speed: 0.5 to 2
  const [pitch, setPitch] = useState(1.0); // Pitch: 0.5 to 1.5
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize SpeechSynthesis and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        // Prefer French voices
        const frenchVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('fr'));
        const displayVoices = frenchVoices.length > 0 ? frenchVoices : availableVoices;
        setVoices(displayVoices);

        // Try to pick a high-quality French Google or Microsoft voice by default
        if (displayVoices.length > 0) {
          const defaultVoice = displayVoices.find(v => v.default || v.name.includes('Google') || v.name.includes('Premium')) || displayVoices[0];
          setSelectedVoiceName(defaultVoice.name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      // Cancel speech when modal unmounts
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Set initial text based on the selected Fiche
  useEffect(() => {
    if (fiche) {
      const generatedSummary = `Fiche numéro ${fiche.id} : ${fiche.title}. 
Sujet d'étude : ${fiche.topic}. 
Action immédiate recommandée : ${fiche.action}. 
${fiche.motorsLink ? `Cette fiche est directement liée au devoir M-Motors par les informations suivantes : ${fiche.motorsLink}` : ''}
Bonnes révisions !`;
      
      setTextToRead(generatedSummary);
      setIsCustomTextMode(false);
    } else {
      setTextToRead("");
    }

    // Stop speaking when switching fiches
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [fiche, isOpen]);

  if (!isOpen) return null;

  // Start speaking
  const handlePlay = () => {
    if (!synthRef.current || !textToRead) return;

    // If already paused, resume
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Otherwise, start a fresh reading
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;

    // Apply voice
    if (selectedVoiceName) {
      const selectedVoice = voices.find(v => v.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.lang = 'fr-FR';
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
  };

  // Pause speaking
  const handlePause = () => {
    if (synthRef.current && isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  // Stop speaking
  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Pre-fill text with alternative styles
  const handleResetToFicheSummary = () => {
    if (fiche) {
      const generatedSummary = `Fiche numéro ${fiche.id} : ${fiche.title}. Sujet d'étude : ${fiche.topic}. Action immédiate recommandée : ${fiche.action}. ${fiche.motorsLink ? `Cette fiche est directement liée au devoir M-Motors : ${fiche.motorsLink}` : ''}`;
      setTextToRead(generatedSummary);
      setIsCustomTextMode(false);
      handleStop();
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(textToRead);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-3xl shadow-2xl border-2 border-slate-950 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Multi-color Google Brand Border */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="bg-[#4285F4] flex-1 h-full" />
          <div className="bg-[#EA4335] flex-1 h-full" />
          <div className="bg-[#FBBC05] flex-1 h-full" />
          <div className="bg-[#34A853] flex-1 h-full" />
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-[#4285F4] to-indigo-600 text-white rounded-2xl shadow-md">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#4285F4] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FBBC05] fill-[#FBBC05]" /> Assistant d'Apprentissage Vocal
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Liseur Vocal Intelligent
              </h3>
            </div>
          </div>
          <button 
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer border border-transparent hover:border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable modal content) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Informative banner regarding PDF Text copying */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-150 rounded-2xl text-xs text-indigo-950 flex gap-3 shadow-inner">
            <span className="text-lg shrink-0">💡</span>
            <div>
              <p className="font-extrabold text-indigo-900">Astuce d'étude ultra-pratique :</p>
              <p className="mt-0.5 text-slate-600 leading-relaxed text-[11px]">
                Pour écouter les documents de cours complets, double-cliquez sur le texte de n'importe quel PDF ou site Studi parcoure, faites <b>Copier (Ctrl+C)</b>, puis collez-le dans le cadre ci-dessous !
              </p>
            </div>
          </div>

          {/* Mode Switch tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                handleResetToFicheSummary();
                setIsCustomTextMode(false);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isCustomTextMode 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-[#4285F4]" />
              Résumé de la Fiche #{fiche?.id || ''}
            </button>
            <button
              onClick={() => setIsCustomTextMode(true)}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isCustomTextMode 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>✍️ Coller votre cours</span>
            </button>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-slate-400">
              <span>CONTENU À LIRE À HAUTE VOIX :</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyToClipboard}
                  className="hover:text-slate-700 flex items-center gap-0.5"
                  title="Copier le texte"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 w-3 text-emerald-600" /> Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copier
                    </>
                  )}
                </button>
                {isCustomTextMode && (
                  <button 
                    onClick={() => {
                      setTextToRead('');
                      handleStop();
                    }}
                    className="hover:text-red-500 flex items-center gap-0.5 text-slate-450"
                  >
                    <Trash2 className="w-3 h-3" /> Vider
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={textToRead}
              onChange={(e) => {
                setTextToRead(e.target.value);
                setIsCustomTextMode(true);
              }}
              placeholder="Collez ici n'importe quel texte sélectionné dans vos documents de cours ou écrivez votre propre texte à haute voix..."
              className="w-full h-40 p-4 border-2 border-slate-200 rounded-2xl bg-slate-50/50 text-slate-800 text-sm focus:border-slate-950 focus:bg-white focus:outline-none transition-all shadow-inner leading-relaxed resize-none font-sans"
            />
          </div>

          {/* Settings Section (Sliders & dropdown) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Voice select dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                🗣️ Voix Synthétique ({voices.length} dispos) :
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  handleStop();
                }}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang}) {v.localService ? '• Local' : ''}
                  </option>
                ))}
                {voices.length === 0 && (
                  <option value="">Voix système par défaut (Standard)</option>
                )}
              </select>
            </div>

            {/* Speech controls sliders (Rate & Pitch) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>⚡ Vitesse de lecture : {rate.toFixed(1)}x</span>
                <span className="text-[9px] text-[#4285F4]">
                  {rate < 0.9 ? '🐢 Lent' : rate > 1.2 ? '🐆 Rapide' : '✨ Standard'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => {
                  setRate(parseFloat(e.target.value));
                  // If playing, restart to apply change immediately
                  if (isPlaying) {
                    setTimeout(() => handlePlay(), 100);
                  }
                }}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>🔊 Hauteur de voix (Pitch) : {pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => {
                  setPitch(parseFloat(e.target.value));
                  if (isPlaying) {
                    setTimeout(() => handlePlay(), 100);
                  }
                }}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

          </div>

          {/* Voice Wave Animation EQ - Displays when reading is in progress and not paused */}
          <div className="flex items-center justify-center gap-3 py-3 h-12">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Statut : {isPlaying ? (isPaused ? 'En pause ⏳' : 'Lecture en cours 🔊') : 'Prêt à lire 💤'}
            </span>
            <div className="flex items-end gap-1 h-8 px-2">
              {[...Array(9)].map((_, i) => {
                const isSpeaking = isPlaying && !isPaused;
                // Unique duration and delays for chaotic/organic wave rhythm
                const transitionDuration = isSpeaking ? 0.3 + (i % 3) * 0.1 : 0.2;
                const heightRange = isSpeaking 
                  ? [8, Math.min(32, 12 + (i % 4) * 6), 8] 
                  : [8, 8];
                const bgColors = [
                  'bg-[#4285F4]', 'bg-[#4285F4]', 
                  'bg-[#EA4335]', 'bg-[#EA4335]', 
                  'bg-[#FBBC05]', 'bg-[#FBBC05]', 
                  'bg-[#34A853]', 'bg-[#34A853]', 
                  'bg-indigo-600'
                ];

                return (
                  <motion.div
                    key={i}
                    animate={isSpeaking ? {
                      height: heightRange
                    } : { height: 8 }}
                    transition={isSpeaking ? {
                      repeat: Infinity,
                      duration: transitionDuration,
                      ease: "easeInOut",
                      repeatType: "reverse"
                    } : {}}
                    className={`w-1 rounded-full ${bgColors[i] || 'bg-slate-350'}`}
                  />
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls Bar */}
        <div className="p-5 sm:p-6 bg-slate-900 border-t border-slate-950 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
          
          <div className="text-[10.5px] text-slate-400 font-medium text-center sm:text-left">
            {!isCustomTextMode && fiche ? (
              <>Vous écoutez le résumé de la <b>Fiche #{fiche.id}</b></>
            ) : (
              <>Lecture vocale de votre <b>Contenu personnalisé (Coller)</b></>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
            
            {/* STOP BUTTON */}
            <button
              onClick={handleStop}
              disabled={!isPlaying}
              className={`p-3 px-4 rounded-2xl flex items-center gap-1.5 font-bold uppercase text-xs cursor-pointer select-none border-2 border-slate-950 transition-all ${
                isPlaying 
                  ? 'bg-slate-800 text-red-400 hover:bg-slate-750' 
                  : 'bg-slate-800/40 text-slate-600 border-slate-850 cursor-not-allowed'
              }`}
            >
              <Square className="w-4 h-4" />
              Arrêter
            </button>

            {/* PAUSE BUTTON */}
            {isPlaying && !isPaused ? (
              <button
                onClick={handlePause}
                className="p-3 px-5 bg-amber-500 border-2 border-slate-950 hover:bg-amber-600 text-slate-950 rounded-2xl flex items-center gap-1.5 font-black uppercase text-xs cursor-pointer select-none transition-all shadow-[0_4px_12px_rgba(251,188,5,0.2)]"
              >
                <Pause className="w-4 h-4 shrink-0" />
                Dormir / Pause
              </button>
            ) : (
              /* PLAY OR RESUME BUTTON with Google Primary branding style */
              <button
                onClick={handlePlay}
                disabled={!textToRead}
                className={`p-3 px-6 rounded-2xl flex items-center gap-1.5 font-black uppercase text-xs cursor-pointer select-none transition-all border-2 border-slate-950 shadow-lg ${
                  textToRead 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-[1.03] active:scale-95 shadow-indigo-600/20' 
                    : 'bg-slate-800/40 text-slate-500 border-slate-850 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 shrink-0 fill-current" />
                {isPaused ? 'Reprendre' : 'Écouter maintenant'}
              </button>
            )}

          </div>

        </div>

      </motion.div>
    </div>
  );
}
