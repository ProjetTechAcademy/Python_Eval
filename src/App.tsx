import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initialFiches, EVAL_FICHES_IDS } from './data/initialData';
import { Fiche, FicheStatus, ScheduledDate, Reminder } from './types';
import ThreeDBox from './components/ThreeDBox';
import ResourcePlayer from './components/ResourcePlayer';
import IntegratedAudioVisualPlayer from './components/IntegratedAudioVisualPlayer';
import CsvLoader, { getBasePubUrl, parseSingleTextToSheet, mergeSheets } from './components/CsvLoader';
import SpeechReaderModal from './components/SpeechReaderModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  RotateCcw,
  Check,
  Calendar,
  Volume2,
  Lock,
  Compass,
  Download,
  Flame,
  User,
  Heart,
  ExternalLink,
  Layers,
  Grid,
  ArrowUp,
  ArrowDown,
  Trash2,
  Bell
} from 'lucide-react';

function getDriveEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return null;

  // Google Drive files (view/edit/share links)
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  // Google Docs, Presentations (Slides), and Sheets
  if (trimmed.includes('docs.google.com')) {
    const docMatch = trimmed.match(/\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch && docMatch[2]) {
      return `https://docs.google.com/${docMatch[1]}/d/${docMatch[2]}/preview`;
    }
  }

  return trimmed;
}

function isDirectVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  const l = url.toLowerCase();
  return l.endsWith('.mp4') || 
         l.endsWith('.webm') || 
         l.endsWith('.mov') || 
         l.endsWith('.ogg') ||
         l.includes('.mp4?') ||
         l.includes('.webm?') ||
         l.includes('/video/');
}

function getYoutubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }
  return null;
}

function getTopicBadgeStyle(topic: string) {
  switch (topic) {
    case 'HTML & CSS':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    case 'Bootstrap':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'Bases de Données':
      return 'bg-blue-500/10 text-[#4285F4] border-[#4285F4]/20';
    case 'Python Backend':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'Python Quality & Flask':
      return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
    case 'APIs, Git & Sécurité':
      return 'bg-cyan-500/10 text-cyan-750 border-cyan-500/20';
    default:
      return 'bg-slate-100/80 text-slate-700 border-slate-205';
  }
}

function getTopicLeftBorder(topic: string) {
  switch (topic) {
    case 'HTML & CSS':
      return 'border-l-[6px] border-l-amber-500';
    case 'Bootstrap':
      return 'border-l-[6px] border-l-purple-500';
    case 'Bases de Données':
      return 'border-l-[6px] border-l-[#4285F4]';
    case 'Python Backend':
      return 'border-l-[6px] border-l-emerald-500';
    case 'Python Quality & Flask':
      return 'border-l-[6px] border-l-rose-500';
    case 'APIs, Git & Sécurité':
      return 'border-l-[6px] border-l-cyan-500';
    default:
      return 'border-l-[6px] border-l-slate-400';
  }
}

export default function App() {
  const [fiches, setFiches] = useState<Fiche[]>(() => {
    const local = localStorage.getItem('m-motors-fiches');
    let list = initialFiches;
    if (local) {
      try {
        list = JSON.parse(local);
      } catch (e) {
        list = initialFiches;
      }
    }
    return list.map(f => {
      const isEvalFiche = EVAL_FICHES_IDS.has(f.id);
      return {
        ...f,
        status3: f.status3 || 'A faire',
        inZoneA: isEvalFiche ? (f.inZoneA !== undefined ? f.inZoneA : true) : false,
        inZoneB: isEvalFiche ? (f.inZoneB !== undefined ? f.inZoneB : true) : false,
        inZoneC: f.inZoneC !== undefined ? f.inZoneC : true,
      };
    });
  });

  const [activeZone, setActiveZone] = useState<'A' | 'B' | 'C'>('A'); // Zone A: Personal, Zone B: Jury, Zone C: Common
  const [urlFicheId, setUrlFicheId] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const idStr = params.get('ficheId') || params.get('fiche');
    return idStr ? parseInt(idStr, 10) : null;
  });

  const immersiveFiche = useMemo(() => {
    if (urlFicheId === null) return null;
    return fiches.find(f => f.id === urlFicheId) || null;
  }, [urlFicheId, fiches]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const idStr = params.get('ficheId') || params.get('fiche');
      setUrlFicheId(idStr ? parseInt(idStr, 10) : null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  
  // Custom display option: show all 154 fiches in Zone A & B, or restrict to 45 eval fiches
  const [showAllUnderZones, setShowAllUnderZones] = useState<boolean>(() => {
    const saved = localStorage.getItem('m-motors-show-all-under-zones');
    return saved === 'true'; // Default to false (only 45 evaluation fiches shown)
  });

  useEffect(() => {
    localStorage.setItem('m-motors-show-all-under-zones', showAllUnderZones ? 'true' : 'false');
  }, [showAllUnderZones]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [selectedResourceForPreview, setSelectedResourceForPreview] = useState<{
    title: string;
    resourceName: string;
    url: string;
    type: string;
    ficheId: number;
    resourceKey?: string;
  } | null>(null);

  interface ResourceInfo {
    key: string;
    type: string;
    name: string;
    url: string;
    zone: 'A' | 'B' | 'C' | 'common';
  }

  const getFicheResources = (f: Fiche): ResourceInfo[] => {
    const list: ResourceInfo[] = [];
    if (f.coursFile) {
      list.push({
        key: 'coursFile',
        type: 'slide',
        name: f.coursFile,
        url: f.coursFileUrl || (f.coursFile.startsWith('http') ? f.coursFile : ''),
        zone: 'common'
      });
    }
    if (f.audio1) list.push({ key: 'audio1', type: 'audio', name: "Vocal d'évaluation (.m4a)", url: f.audio1, zone: 'A' });
    if (f.slide1) list.push({ key: 'slide1', type: 'slide', name: "Slides Présentation", url: f.slide1, zone: 'A' });
    if (f.video1) list.push({ key: 'video1', type: 'video', name: "Vidéo Explicative", url: f.video1, zone: 'A' });
    if (f.image1) list.push({ key: 'image1', type: 'image', name: "Schémas d'Appuis", url: f.image1, zone: 'A' });
    if (f.nblm1) list.push({ key: 'nblm1', type: 'nblm', name: "NotebookLM d'Appuis IA", url: f.nblm1, zone: 'A' });

    if (f.audio2) list.push({ key: 'audio2', type: 'audio', name: "Vocal Soutenance (.m4a)", url: f.audio2, zone: 'B' });
    if (f.slide2) list.push({ key: 'slide2', type: 'slide', name: "Slides Réponses Jury", url: f.slide2, zone: 'B' });
    if (f.video2) list.push({ key: 'video2', type: 'video', name: "Vidéo Démonstration Jury", url: f.video2, zone: 'B' });
    if (f.image2) list.push({ key: 'image2', type: 'image', name: "Preuves & Graphiques d'Appui", url: f.image2, zone: 'B' });
    if (f.nblm2) list.push({ key: 'nblm2', type: 'nblm', name: "NotebookLM Réponses Jury", url: f.nblm2, zone: 'B' });

    if (f.audio3) list.push({ key: 'audio3', type: 'audio', name: "Vocal Commun (.m4a)", url: f.audio3, zone: 'C' });
    if (f.slide3) list.push({ key: 'slide3', type: 'slide', name: "Slides Base Commune", url: f.slide3, zone: 'C' });
    if (f.video3) list.push({ key: 'video3', type: 'video', name: "Vidéo Explicative Commune", url: f.video3, zone: 'C' });
    if (f.image3) list.push({ key: 'image3', type: 'image', name: "Iconographies Communes", url: f.image3, zone: 'C' });
    if (f.nblm3) list.push({ key: 'nblm3', type: 'nblm', name: "NotebookLM Références Communes", url: f.nblm3, zone: 'C' });

    return list.filter(r => r.url && r.url !== '');
  };

  const [seenResources, setSeenResources] = useState<Record<number, Record<string, string>>>(() => {
    const local = localStorage.getItem('m-motors-seen-resources2');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const handleToggleResourceSeen = (ficheId: number, resourceKey: string) => {
    setSeenResources(prev => {
      const next = { ...prev };
      if (!next[ficheId]) {
        next[ficheId] = {};
      }
      if (next[ficheId][resourceKey]) {
        delete next[ficheId][resourceKey];
        if (Object.keys(next[ficheId]).length === 0) {
          delete next[ficheId];
        }
        triggerToast("Document marqué comme non lu/vu ⭕", "info");
      } else {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        next[ficheId][resourceKey] = formattedDate;
        triggerToast("Document marqué comme assimilé ! ✔", "success");
      }
      localStorage.setItem('m-motors-seen-resources2', JSON.stringify(next));
      return next;
    });
  };

  const [previewHeight, setPreviewHeight] = useState<'compact' | 'large'>('compact'); // Default to compact (thinner) view as feedback requested
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [elevatorExpanded, setElevatorExpanded] = useState(false); // Starts collapsed for maximum uncluttered space
  const [guideOpen, setGuideOpen] = useState<boolean>(true); // Guide panel visibility toggle

  // Sticky Notes State with helpful default study tips (Sherwood note deleted permanently as requested)
  const [stickyNotes, setStickyNotes] = useState<{ id: string; text: string; color: 'green' | 'yellow' | 'blue' | 'pink' }[]>(() => {
    const saved = localStorage.getItem('m-motors-sticky-notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently filter out the irrelevant Sherwood note from local storage storage cache
          return parsed.filter(n => n.id !== 'sherwood' && !n.text.includes("Sherwood") && !n.text.includes("Clarendon"));
        }
      } catch (e) {
        // Fallback
      }
    }
    return [
      { id: 'note-default', text: "Suivi des validations : Marquer 'Fait' pour synchroniser l'avancement de votre apprentissage.", color: 'green' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('m-motors-sticky-notes', JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<'green' | 'yellow' | 'blue' | 'pink'>('green');

  const addStickyNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: { id: string; text: string; color: 'green' | 'yellow' | 'blue' | 'pink' } = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      color: newNoteColor
    };
    setStickyNotes(prev => [...prev, newNote]);
    setNewNoteText('');
    triggerToast("Note mémo épinglée ! 📌");
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
    triggerToast("Note mémo retirée 🗑️", "info");
  };

  const [editingPdfFicheId, setEditingPdfFicheId] = useState<number | null>(null);
  const [selectedSpeechFiche, setSelectedSpeechFiche] = useState<Fiche | null>(null);

  // New features for Blocks and Modules isolation & navigation
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [selectedModule, setSelectedModule] = useState<string>('All');

  // Background Auto-sync on mount
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  useEffect(() => {
    const autoSyncSpreadsheet = async () => {
      setIsAutoSyncing(true);
      try {
        const spreadsheetUrl = localStorage.getItem('m-motors-spreadsheet-url') || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9upnowMIAhXQO5l7H-m9dfBtytEEugAA_ChZthJRiKILpUNJgrCSHHvQXRt_0QNF-2Sb8ie7gfi0L/pub?output=csv';
        const base = getBasePubUrl(spreadsheetUrl);
        const isDefaultUrl = spreadsheetUrl.includes("2PACX-1vS9upnowMIAhXQO5l7H-m9dfBtytEEugAA_ChZthJRiKILpUNJgrCSHHvQXRt_0QNF-2Sb8ie7gfi0L");

        const fetchText = async (urlStr: string) => {
          const res = await fetch(urlStr + (urlStr.includes('?') ? '&' : '?') + 't=' + Date.now());
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        };

        if (base && isDefaultUrl) {
          const [textC, textA, textB] = await Promise.all([
            fetchText(`${base}?output=csv&gid=1056100740`),
            fetchText(`${base}?output=csv&gid=0`),
            fetchText(`${base}?output=csv&gid=531214884`)
          ]);

          const sheetC = parseSingleTextToSheet(textC);
          const sheetA = parseSingleTextToSheet(textA);
          const sheetB = parseSingleTextToSheet(textB);

          setFiches(current => {
            const merged = mergeSheets([sheetC, sheetA, sheetB], current);
            localStorage.setItem('m-motors-fiches', JSON.stringify(merged));
            return merged;
          });
        } else {
          // Custom URL - fetch direct single sheet without default GIDs
          const text = await fetchText(spreadsheetUrl);
          const single = parseSingleTextToSheet(text);
          setFiches(current => {
            const merged = mergeSheets([single], current);
            localStorage.setItem('m-motors-fiches', JSON.stringify(merged));
            return merged;
          });
        }
        triggerToast("🚀 Synchro auto : Toutes vos fiches à jour en direct depuis Google Sheets !", "success");
      } catch (error) {
        console.warn("Background auto-sync failed, running off cached offline fiches", error);
      } finally {
        setIsAutoSyncing(false);
      }
    };

    autoSyncSpreadsheet();
  }, []);

  const [viewMode, setViewMode] = useState<'continue' | 'segmented' | 'planning'>(() => {
    const localMode = localStorage.getItem('m-motors-view-mode');
    return (localMode as 'continue' | 'segmented' | 'planning') || 'segmented'; // Default to organized segmented view for easy navigation
  });

  const [planningSubView, setPlanningSubView] = useState<'calendar' | 'history'>('calendar');
  const [planningHistorySearch, setPlanningHistorySearch] = useState<string>('');
  const [planningHistoryZone, setPlanningHistoryZone] = useState<'all' | 'A' | 'B' | 'C'>('all');

  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
    'B0': true,
    'B1': true,
    'B2': true,
    'B3': true,
    'B4': true,
    'B5': true,
  });

  const toggleBlockExpanded = (blockCode: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockCode]: !prev[blockCode]
    }));
  };

  // Keep view preference
  useEffect(() => {
    localStorage.setItem('m-motors-view-mode', viewMode);
  }, [viewMode]);

  // PLANNING & REMINDERS STATE
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const local = localStorage.getItem('m-motors-reminders');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('m-motors-reminders', JSON.stringify(reminders));
  }, [reminders]);

  const [ficheForReminderModal, setFicheForReminderModal] = useState<Fiche | null>(null);
  const [reminderType, setReminderType] = useState<'spaced' | 'custom'>('spaced');
  const [customDateValue, setCustomDateValue] = useState<string>('');

  // PLANNING CALENDAR STATE
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date(2026, 5, 1)); // Displays June 2026 by default as it is the current timeline!
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>("2026-06-06"); // Set default selected day to today

  // SOUND SCAPES AMBIENT MEDIA CONTROLLER WITH STABLE RAW GITHUB ASSETS
  const [ambientSounds, setAmbientSounds] = useState<Record<string, { playing: boolean; volume: number }>>({
    rain: { playing: false, volume: 0.5 },
    waves: { playing: false, volume: 0.4 },
    birds: { playing: false, volume: 0.4 },
    fire: { playing: false, volume: 0.5 }
  });

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({
    rain: null,
    waves: null,
    birds: null,
    fire: null,
  });

  // User-activation thread play command to strictly satisfy autoplay policies
  const handleToggleAmbientSound = (soundKey: string) => {
    const sources: Record<string, string> = {
      rain: 'https://raw.githubusercontent.com/alexandrius/ambient-sounds-player/master/audio/rain.mp3',
      waves: 'https://raw.githubusercontent.com/alexandrius/ambient-sounds-player/master/audio/ocean.mp3',
      birds: 'https://raw.githubusercontent.com/alexandrius/ambient-sounds-player/master/audio/birds.mp3',
      fire: 'https://raw.githubusercontent.com/alexandrius/ambient-sounds-player/master/audio/campfire.mp3'
    };

    // Synchronously determine the target state
    const currentStatus = ambientSounds[soundKey];
    const isNextPlaying = !currentStatus.playing;

    try {
      if (!audioRefs.current[soundKey]) {
        const audio = new Audio(sources[soundKey]);
        audio.loop = true;
        audio.volume = currentStatus.volume;
        audioRefs.current[soundKey] = audio;
      }

      const audio = audioRefs.current[soundKey]!;
      audio.volume = currentStatus.volume;

      if (isNextPlaying) {
        // Trigger play synchronously inside user event callstack
        audio.play().catch(e => {
          console.warn("Direct synchronous ambient play failed: ", e);
          // Retry briefly if blocked
          setTimeout(() => {
            audio.play().catch(err => console.error("Secondary ambient autoplay attempt failed:", err));
          }, 100);
        });
      } else {
        audio.pause();
      }
    } catch (err) {
      console.error("Critical synchronous audio trigger failed:", err);
    }

    setAmbientSounds(prev => ({
      ...prev,
      [soundKey]: { ...prev[soundKey], playing: isNextPlaying }
    }));
  };

  useEffect(() => {
    // Keep volume levels in sync
    Object.keys(ambientSounds).forEach((key) => {
      const audio = audioRefs.current[key];
      if (audio) {
        audio.volume = ambientSounds[key].volume;
      }
    });
  }, [ambientSounds]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      Object.keys(audioRefs.current).forEach(key => {
        if (audioRefs.current[key]) {
          try {
            audioRefs.current[key]?.pause();
          } catch (e) {}
        }
      });
    };
  }, []);

  // Calendar Event Builders
  const getCalendarLinks = (title: string, dateStr: string) => {
    const parts = dateStr.split(' ');
    const dParts = parts[0].split('-');
    const tParts = (parts[1] || '09:00').split(':');
    
    const year = dParts[0];
    const month = dParts[1];
    const day = dParts[2];
    const hour = tParts[0];
    const minute = tParts[1];
    
    const dObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const startIso = `${dObj.getUTCFullYear()}${pad(dObj.getUTCMonth()+1)}${pad(dObj.getUTCDate())}T${pad(dObj.getUTCHours())}${pad(dObj.getUTCMinutes())}00Z`;
    const endObj = new Date(dObj.getTime() + 45 * 60 * 1000);
    const endIso = `${endObj.getUTCFullYear()}${pad(endObj.getUTCMonth()+1)}${pad(endObj.getUTCDate())}T${pad(endObj.getUTCHours())}${pad(endObj.getUTCMinutes())}00Z`;
    
    const textEncoded = encodeURIComponent(`Révision M-Motors : ${title} 📚`);
    const detailsEncoded = encodeURIComponent(`Rappel automatique de révision espacée pour le cours M-Motors Python & Flask : "${title}". Ne lâche rien ! 💪`);
    
    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textEncoded}&dates=${startIso}/${endIso}&details=${detailsEncoded}`;
    const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${textEncoded}&startdt=${dObj.toISOString()}&enddt=${endObj.toISOString()}&body=${detailsEncoded}`;
    
    return { google, outlook };
  };

  const downloadIcsFile = (title: string, occurrences: { label: string; date: string }[]) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Mathilde Study Planner//M-Motors//FR\r\nCALSCALE:GREGORIAN\r\n";
    
    occurrences.forEach((occ, idx) => {
      const parts = occ.date.split(' ');
      const dParts = parts[0].split('-');
      const tParts = (parts[1] || '09:00').split(':');
      
      const year = parseInt(dParts[0]);
      const month = parseInt(dParts[1]) - 1;
      const day = parseInt(dParts[2]);
      const hour = parseInt(tParts[0]);
      const minute = parseInt(tParts[1]);
      
      const dObj = new Date(year, month, day, hour, minute);
      const endObj = new Date(dObj.getTime() + 45 * 60 * 1000);
      
      const startIso = `${dObj.getUTCFullYear()}${pad(dObj.getUTCMonth()+1)}${pad(dObj.getUTCDate())}T${pad(dObj.getUTCHours())}${pad(dObj.getUTCMinutes())}00Z`;
      const endIso = `${endObj.getUTCFullYear()}${pad(endObj.getUTCMonth()+1)}${pad(endObj.getUTCDate())}T${pad(endObj.getUTCHours())}${pad(endObj.getUTCMinutes())}00Z`;
      const dtStamp = startIso;
      
      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `UID:${Date.now()}-${idx}@m-motors-study\r\n`;
      icsContent += `DTSTAMP:${dtStamp}\r\n`;
      icsContent += `DTSTART:${startIso}\r\n`;
      icsContent += `DTEND:${endIso}\r\n`;
      icsContent += `SUMMARY:Révision M-Motors : ${occ.label} - ${title.replace(/[,;]/g, '')}\r\n`;
      icsContent += `DESCRIPTION:Rappel de révision espacée (${occ.label}) pour le cours: "${title.replace(/[,;]/g, '')}".\\n🎯 M-Motors Sync.\\r\n`;
      icsContent += "END:VEVENT\r\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rappel-etude-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFriendlyDate = (dStr: string) => {
    const parts = dStr.split(' ');
    const dateParts = parts[0].split('-');
    const timeStr = parts[1] || '';
    
    const months = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    const monthIdx = parseInt(dateParts[1]) - 1;
    const monthName = months[monthIdx] || dateParts[1];
    
    return `${dateParts[2]} ${monthName} ${dateParts[0]} à ${timeStr}`;
  };

  const handleAssignPdfUrl = (id: number, url: string) => {
    setFiches(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, coursFileUrl: url };
      }
      return f;
    }));
    setEditingPdfFicheId(null);
    triggerToast(`Lien Google Drive du PDF associé avec succès pour la fiche #${id} ! 📄`);
  };

  // Auto-save changes
  useEffect(() => {
    localStorage.setItem('m-motors-fiches', JSON.stringify(fiches));
  }, [fiches]);

  // Toast handler
  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Reset progress to original state
  const resetAllProgress = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toute votre progression aux valeurs d'origine ?")) {
      setFiches(initialFiches);
      triggerToast("Progression réinitialisée avec succès ! 🔄", "info");
    }
  };

  // Status toggle handler
  const handleStatusChange = (id: number, zone: 'A' | 'B' | 'C', newStatus: FicheStatus) => {
    setFiches(prev => prev.map(f => {
      if (f.id === id) {
        if (zone === 'A') {
          return { ...f, status1: newStatus, date1: newStatus === 'Fait' ? new Date().toLocaleDateString('fr-FR') : f.date1 };
        } else if (zone === 'B') {
          return { ...f, status2: newStatus, date2: newStatus === 'Fait' ? new Date().toLocaleDateString('fr-FR') : f.date2 };
        } else {
          return { ...f, status3: newStatus, date3: newStatus === 'Fait' ? new Date().toLocaleDateString('fr-FR') : f.date3 };
        }
      }
      return f;
    }));
    triggerToast(`Fiche #${id} mise à jour en "[${newStatus}]" ! ⚡`);
  };

  // Bulk update all displayed items to 'Fait'
  const markFilteredAsCompleted = (matchingFiches: Fiche[]) => {
    if (window.confirm(`Voulez-vous marquer les ${matchingFiches.length} fiches sélectionnées comme "Fait" dans la Zone ${activeZone} ?`)) {
      setFiches(prev => prev.map(f => {
        const matches = matchingFiches.some(m => m.id === f.id);
        if (matches) {
          if (activeZone === 'A') {
            return { ...f, status1: 'Fait', date1: new Date().toLocaleDateString('fr-FR') };
          } else if (activeZone === 'B') {
            return { ...f, status2: 'Fait', date2: new Date().toLocaleDateString('fr-FR') };
          } else {
            return { ...f, status3: 'Fait', date3: new Date().toLocaleDateString('fr-FR') };
          }
        }
        return f;
      }));
      triggerToast(`${matchingFiches.length} fiches marquées accomplies ! 🎉`);
    }
  };

  // Calculate live stats
  const totalFichesCount = fiches.length;

  const fichesInZoneA = useMemo(() => {
    if (showAllUnderZones) return fiches;
    return fiches.filter(f => f.inZoneA === true);
  }, [fiches, showAllUnderZones]);

  const fichesInZoneB = useMemo(() => {
    if (showAllUnderZones) return fiches;
    return fiches.filter(f => f.inZoneB === true);
  }, [fiches, showAllUnderZones]);

  const fichesInZoneC = useMemo(() => fiches.filter(f => f.inZoneC === true), [fiches]);

  const stats1 = useMemo(() => {
    const totalA = fichesInZoneA.length;
    const fait = fichesInZoneA.filter(f => f.status1 === 'Fait').length;
    const cours = fichesInZoneA.filter(f => f.status1 === 'En cours').length;
    const faire = fichesInZoneA.filter(f => f.status1 === 'A faire').length;
    return {
      fait,
      cours,
      faire,
      pct: totalA > 0 ? Math.round((fait / totalA) * 100) : 0
    };
  }, [fichesInZoneA]);

  const stats2 = useMemo(() => {
    const totalB = fichesInZoneB.length;
    const fait = fichesInZoneB.filter(f => f.status2 === 'Fait').length;
    const cours = fichesInZoneB.filter(f => f.status2 === 'En cours').length;
    const faire = fichesInZoneB.filter(f => f.status2 === 'A faire').length;
    return {
      fait,
      cours,
      faire,
      pct: totalB > 0 ? Math.round((fait / totalB) * 100) : 0
    };
  }, [fichesInZoneB]);

  const stats3 = useMemo(() => {
    const totalC = fichesInZoneC.length;
    const fait = fichesInZoneC.filter(f => (f.status3 || 'A faire') === 'Fait').length;
    const cours = fichesInZoneC.filter(f => (f.status3 || 'A faire') === 'En cours').length;
    const faire = fichesInZoneC.filter(f => (f.status3 || 'A faire') === 'A faire').length;
    return {
      fait,
      cours,
      faire,
      pct: totalC > 0 ? Math.round((fait / totalC) * 100) : 0
    };
  }, [fichesInZoneC]);

  const currentStats = activeZone === 'A' ? stats1 : activeZone === 'B' ? stats2 : stats3;

  const fichesFilteredByZone = useMemo(() => {
    if (activeZone === 'A') return fichesInZoneA;
    if (activeZone === 'B') return fichesInZoneB;
    return fichesInZoneC;
  }, [activeZone, fichesInZoneA, fichesInZoneB, fichesInZoneC]);

  // Domain Category listing
  const topics = ['All', 'HTML & CSS', 'Bootstrap', 'Bases de Données', 'Python Backend', 'Python Quality & Flask', 'APIs, Git & Sécurité'];

  // Calculate detailed progress for documents that have been marked as seen
  const resourceProgressStats = useMemo(() => {
    const stats = {
      byTopic: {} as Record<string, { total: number; seen: number; pct: number }>,
      byBlock: {} as Record<string, { total: number; seen: number; pct: number }>,
      byModule: {} as Record<string, { total: number; seen: number; pct: number }>,
      global: { total: 0, seen: 0, pct: 0 }
    };

    topics.forEach(t => {
      if (t !== 'All') {
        stats.byTopic[t] = { total: 0, seen: 0, pct: 0 };
      }
    });

    fiches.forEach(f => {
      const title = f.title || '';
      const bMatch = title.match(/(?:_|\b)B(\d+)(?:_|\b)/i);
      const mMatch = title.match(/(?:_|\b)M(\d+)(?:_|\b)/i);
      const blockCode = bMatch ? `B${bMatch[1]}` : 'Autre';
      const moduleCode = mMatch ? `M${mMatch[1]}` : 'Autre';

      if (!stats.byBlock[blockCode]) {
        stats.byBlock[blockCode] = { total: 0, seen: 0, pct: 0 };
      }
      if (!stats.byModule[moduleCode]) {
        stats.byModule[moduleCode] = { total: 0, seen: 0, pct: 0 };
      }

      const resources = getFicheResources(f);
      const seenMap = seenResources[f.id] || {};

      resources.forEach(r => {
        const isSeen = !!seenMap[r.key];
        
        if (stats.byTopic[f.topic]) {
          stats.byTopic[f.topic].total++;
          if (isSeen) stats.byTopic[f.topic].seen++;
        }

        stats.byBlock[blockCode].total++;
        if (isSeen) stats.byBlock[blockCode].seen++;

        stats.byModule[moduleCode].total++;
        if (isSeen) stats.byModule[moduleCode].seen++;

        stats.global.total++;
        if (isSeen) stats.global.seen++;
      });
    });

    const calcPct = (item: { total: number; seen: number; pct: number }) => {
      item.pct = item.total > 0 ? Math.round((item.seen / item.total) * 100) : 0;
    };

    Object.values(stats.byTopic).forEach(calcPct);
    Object.values(stats.byBlock).forEach(calcPct);
    Object.values(stats.byModule).forEach(calcPct);
    calcPct(stats.global);

    return stats;
  }, [fiches, seenResources]);

  // Fiches that are filtered ONLY by block and module (not topic, search or status)
  const fichesFilteredOnlyByBlockAndModule = useMemo(() => {
    return fichesFilteredByZone.filter(f => {
      const title = f.title || '';
      const bMatch = title.match(/(?:_|\b)B(\d+)(?:_|\b)/i);
      const mMatch = title.match(/(?:_|\b)M(\d+)(?:_|\b)/i);
      const blockCode = bMatch ? `B${bMatch[1]}` : 'Autre';
      const moduleCode = mMatch ? `M${mMatch[1]}` : 'Autre';

      const matchesBlock = selectedBlock === 'All' || blockCode === selectedBlock;
      const matchesModule = selectedModule === 'All' || moduleCode === selectedModule;

      return matchesBlock && matchesModule;
    });
  }, [fichesFilteredByZone, selectedBlock, selectedModule]);

  // Dynamically extract all available Blocks & Modules from fiches, contextualized by selected block
  const { blocksList, modulesList, availableTopics } = useMemo(() => {
    const blocks = new Set<string>();
    const modules = new Set<string>();
    const topicsSet = new Set<string>();

    fichesFilteredByZone.forEach(f => {
      const title = f.title || '';
      const bMatch = title.match(/(?:_|\b)B(\d+)(?:_|\b)/i);
      const mMatch = title.match(/(?:_|\b)M(\d+)(?:_|\b)/i);
      
      const bCode = bMatch ? `B${bMatch[1]}` : 'Autre';
      const mCode = mMatch ? `M${mMatch[1]}` : 'Autre';

      blocks.add(bCode);

      if (selectedBlock === 'All' || bCode === selectedBlock) {
        if (mMatch) modules.add(mCode);
        if (f.topic) topicsSet.add(f.topic);
      }
    });

    const sortedBlocks = Array.from(blocks).filter(b => b !== 'Autre').sort((a, b) => {
      const numA = parseInt(a.slice(1), 10);
      const numB = parseInt(b.slice(1), 10);
      return numA - numB;
    });

    const sortedModules = Array.from(modules).filter(m => m !== 'Autre').sort((a, b) => {
      const numA = parseInt(a.slice(1), 10);
      const numB = parseInt(b.slice(1), 10);
      return numA - numB;
    });

    return {
      blocksList: ['All', ...sortedBlocks],
      modulesList: ['All', ...sortedModules],
      availableTopics: ['All', ...Array.from(topicsSet)]
    };
  }, [fichesFilteredByZone, selectedBlock]);

  // Handle auto-resetting module filter if it doesn't exist in newly filtered modules list
  useEffect(() => {
    if (selectedBlock !== 'All' && selectedModule !== 'All') {
      if (!modulesList.includes(selectedModule)) {
        setSelectedModule('All');
      }
    }
  }, [selectedBlock, modulesList, selectedModule]);

  // Sub-filter core
  const filteredFiches = useMemo(() => {
    return fichesFilteredByZone.filter(f => {
      const matchesTopic = selectedTopic === 'All' || f.topic === selectedTopic;
      const fStatus = activeZone === 'A' ? f.status1 : activeZone === 'B' ? f.status2 : (f.status3 || 'A faire');
      const matchesStatus = selectedStatus === 'All' || fStatus === selectedStatus;
      
      const title = f.title || '';
      const bMatch = title.match(/(?:_|\b)B(\d+)(?:_|\b)/i);
      const mMatch = title.match(/(?:_|\b)M(\d+)(?:_|\b)/i);
      const blockCode = bMatch ? `B${bMatch[1]}` : 'Autre';
      const moduleCode = mMatch ? `M${mMatch[1]}` : 'Autre';

      const matchesBlock = selectedBlock === 'All' || blockCode === selectedBlock;
      const matchesModule = selectedModule === 'All' || moduleCode === selectedModule;

      const query = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        f.id.toString().includes(query) ||
        f.title.toLowerCase().includes(query) ||
        f.action.toLowerCase().includes(query) ||
        f.motorsLink.toLowerCase().includes(query);

      return matchesTopic && matchesStatus && matchesSearch && matchesBlock && matchesModule;
    });
  }, [fichesFilteredByZone, activeZone, selectedTopic, selectedStatus, searchQuery, selectedBlock, selectedModule]);

  // Highly optimized grouping by Block and Module for nested view
  const fichesGroupedByBlockAndModule = useMemo(() => {
    const map: Record<string, Record<string, Fiche[]>> = {};

    filteredFiches.forEach(f => {
      const title = f.title || '';
      const bMatch = title.match(/(?:_|\b)B(\d+)(?:_|\b)/i);
      const mMatch = title.match(/(?:_|\b)M(\d+)(?:_|\b)/i);
      const blockCode = bMatch ? `B${bMatch[1]}` : 'Autre';
      const moduleCode = mMatch ? `M${mMatch[1]}` : 'Autre';

      if (!map[blockCode]) {
        map[blockCode] = {};
      }
      if (!map[blockCode][moduleCode]) {
        map[blockCode][moduleCode] = [];
      }
      map[blockCode][moduleCode].push(f);
    });

    // Sort blocks. Format: "B3" or "Autre"
    return Object.keys(map).sort((a, b) => {
      if (a === 'Autre') return 1;
      if (b === 'Autre') return -1;
      const numA = parseInt(a.slice(1), 10);
      const numB = parseInt(b.slice(1), 10);
      return numA - numB;
    }).map(blockCode => {
      const moduleMap = map[blockCode];
      const modules = Object.keys(moduleMap).sort((a, b) => {
        if (a === 'Autre') return 1;
        if (b === 'Autre') return -1;
        const numA = parseInt(a.slice(1), 10);
        const numB = parseInt(b.slice(1), 10);
        return numA - numB;
      }).map(moduleCode => ({
        moduleCode,
        fiches: moduleMap[moduleCode]
      }));

      return {
        blockCode,
        modules
      };
    });
  }, [filteredFiches]);

  // Recharts trend visualizer comparing Zone A, Zone B and Zone C metrics by category
  const comparisonChartData = useMemo(() => {
    return topics.filter(t => t !== 'All').map(topic => {
      const subset1 = fiches.filter(f => f.topic === topic && f.status1 === 'Fait').length;
      const subset2 = fiches.filter(f => f.topic === topic && f.status2 === 'Fait').length;
      const subset3 = fiches.filter(f => f.topic === topic && (f.status3 || 'A faire') === 'Fait').length;
      const total = fiches.filter(f => f.topic === topic).length;
      return {
        name: topic,
        'Zone A - Ma Progression (%)': total > 0 ? Math.round((subset1 / total) * 100) : 0,
        'Zone B - Réponses Jury (%)': total > 0 ? Math.round((subset2 / total) * 100) : 0,
        'Zone C - Commun (%)': total > 0 ? Math.round((subset3 / total) * 100) : 0,
      };
    });
  }, [fiches]);

  // Timeline progress simulation data over 6 stages
  const progressTimelineData = [
    { name: 'Étape 1: Bases', 'Ma Réponse': 15, 'Retour Jury': 5, 'Zone C': 10 },
    { name: 'Étape 2: Bootstrap', 'Ma Réponse': 35, 'Retour Jury': 15, 'Zone C': 25 },
    { name: 'Étape 3: Bases de Données', 'Ma Réponse': 55, 'Retour Jury': 28, 'Zone C': 42 },
    { name: 'Étape 4: Python Backend', 'Ma Réponse': 72, 'Retour Jury': 40, 'Zone C': 58 },
    { name: 'Étape 5: Flask & Dev', 'Ma Réponse': 88, 'Retour Jury': 65, 'Zone C': 75 },
    { name: 'Étape 6: Projet Final', 'Ma Réponse': stats1.pct, 'Retour Jury': stats2.pct, 'Zone C (Commun)': stats3.pct },
  ];

  const renderFicheCard = (fiche: Fiche) => {
    const currentStatus = activeZone === 'A' ? fiche.status1 : activeZone === 'B' ? fiche.status2 : (fiche.status3 || 'A faire');
    const completedDate = activeZone === 'A' ? fiche.date1 : activeZone === 'B' ? fiche.date2 : fiche.date3;
    const isCompleted = currentStatus === 'Fait';
    const isEnCours = currentStatus === 'En cours';

    // Calculate individual fiche resources progress dynamically
    const ficheResources = getFicheResources(fiche);
    // Explicitly add "studi" to computed resources if it's set
    if (fiche.studi && fiche.studi.trim() !== '') {
      if (!ficheResources.some(r => r.key === 'studi')) {
        ficheResources.push({
          key: 'studi',
          type: 'studi',
          name: "Plateforme d'études Studi",
          url: fiche.studi,
          zone: 'common'
        });
      }
    }
    const totalResources = ficheResources.length;
    const seenResourcesForFiche = seenResources[fiche.id] || {};
    const seenCount = ficheResources.filter(r => !!seenResourcesForFiche[r.key]).length;
    const progressPct = totalResources > 0 ? Math.round((seenCount / totalResources) * 100) : 0;

    return (
      <div 
        key={fiche.id}
        className={`bg-white rounded-2xl border-2 shadow-sm p-4 lg:p-5 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-300 ring-2 hover:scale-[1.005] hover:shadow-md ${getTopicLeftBorder(fiche.topic)} ${
          isCompleted
            ? 'border-[#34A853] bg-[#34A853]/[0.015] ring-[#34A853]/10 shadow-[0_4px_15px_-3px_rgba(52,168,83,0.15)]' 
            : isEnCours
              ? 'border-[#FBBC05] bg-[#FBBC05]/[0.01] ring-[#FBBC05]/10 shadow-[0_4px_12px_-3px_rgba(251,188,5,0.1)]'
              : (activeZone === 'A' ? 'border-blue-500/40 hover:border-blue-500 ring-slate-100/50' : activeZone === 'B' ? 'border-red-500/40 hover:border-red-500 ring-slate-100/20' : 'border-emerald-500/40 hover:border-emerald-500 ring-slate-100/10')
        }`}
      >
        {/* Top multi-color strip for Google Brand aesthetic */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex">
          <div className="flex-1 h-full bg-[#4285F4]" />
          <div className="flex-1 h-full bg-[#EA4335]" />
          <div className="flex-1 h-full bg-[#FBBC05]" />
          <div className="flex-1 h-full bg-[#34A853]" />
        </div>

        {/* Main Grid Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
          
          {/* LEFT SECTION (Title + Actions + Status) - Spans lg:col-span-7 */}
          <div className="lg:col-span-7 flex flex-col justify-start gap-4">
            
            {/* Metadata badge and descriptive title */}
            <div>
              {/* Topic identifier header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap pb-1 md:pb-0">
                  <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wide transition-all duration-300 ${getTopicBadgeStyle(fiche.topic)}`}>
                    {fiche.topic}
                  </span>
                  {isCompleted && (
                    <span className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> VALIDÉ
                    </span>
                  )}
                  {/* Codified Badge indicators */}
                  {(() => {
                    const blockMatch = (fiche.title || '').match(/(?:_|\b)B(\d+)(?:_|\b)/i);
                    const moduleMatch = (fiche.title || '').match(/(?:_|\b)M(\d+)(?:_|\b)/i);
                    return (
                      <>
                        {blockMatch && (
                          <span className="text-[9.5px] font-black tracking-wider text-blue-700 bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded-full uppercase">
                            BLOC {blockMatch[1]}
                          </span>
                        )}
                        {moduleMatch && (
                          <span className="text-[9.5px] font-black tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2.5 py-0.5 rounded-full uppercase">
                            MOD {moduleMatch[1]}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedSpeechFiche(fiche)}
                    className="px-2 py-0.5 bg-gradient-to-r from-[#4285F4] to-indigo-600 hover:from-blue-600 hover:to-indigo-750 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
                    title="Écouter le résumé de la fiche à haute voix"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Écouter 🔊
                  </button>
                  <button
                    onClick={() => setFicheForReminderModal(fiche)}
                    className="px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:scale-105 active:scale-[0.98] transition-all shadow-sm cursor-pointer select-none"
                    title="Planifier des rappels de révision espacée"
                  >
                    <Calendar className="w-3 h-3 text-white" /> Rappels 📅
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?ficheId=${fiche.id}`;
                      window.open(url, '_blank');
                    }}
                    className="px-2 py-0.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
                    title="Ouvrir l'univers d'apprentissage dédié à ce sujet dans un nouvel onglet"
                  >
                    🌌 Univers 🚀
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                    N° {fiche.id}
                  </span>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-snug mt-1 text-balance">
                {fiche.title}
              </h3>

              {/* Progress bar of seen resources for this specific card */}
              {totalResources > 0 ? (
                <div id={`fiche-progress-container-${fiche.id}`} className="mt-3.5 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-2 px-3.5 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-1.1 text-[10.5px] font-extrabold text-slate-500 shrink-0 uppercase tracking-widest">
                    <span className="text-[11px] mr-1">📊</span>Supports vus :
                  </div>
                  <div id={`fiche-progress-track-${fiche.id}`} className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden shadow-inner relative">
                    <div 
                      id={`fiche-progress-bar-${fiche.id}`}
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                        progressPct === 100 
                          ? 'from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                          : progressPct >= 50 
                            ? 'from-indigo-500 to-blue-600' 
                            : 'from-blue-500 to-cyan-500'
                      }`} 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span id={`fiche-progress-badge-${fiche.id}`} className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono shrink-0 whitespace-nowrap transition-colors duration-300 ${
                      progressPct === 100 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                        : 'text-indigo-750 bg-indigo-50 border border-indigo-150'
                    }`}>
                      👁️ {seenCount}/{totalResources} ({progressPct}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div id={`fiche-progress-empty-${fiche.id}`} className="mt-3.5 text-[10px] text-slate-400 font-extrabold italic bg-slate-50/50 p-2 px-3 rounded-xl border border-dashed border-slate-200/55 flex items-center gap-1.5">
                  📁 Aucun support requis de validation
                </div>
              )}
            </div>

            {/* Textual Actions (Immediate Action & Motors connection) placed SIDE-BY-SIDE to eliminate wasted space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Action Block */}
              <div className="p-3 bg-amber-500/[0.02] border border-slate-200 border-l-[3.5px] border-l-amber-500 rounded-xl hover:bg-amber-500/[0.05] transition-all flex flex-col justify-between shadow-sm">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 flex items-center gap-1 border-b border-amber-100 pb-1 mb-1.5">
                  ⚡ Action immédiate (Zéro BlaBla)
                </p>
                <p className="text-xs text-slate-800 font-medium leading-relaxed flex-1">
                  {fiche.action}
                </p>
              </div>

              {/* M-Motors project connection link */}
              <div className="p-3 bg-indigo-500/[0.02] border border-indigo-150 border-l-[3.5px] border-l-indigo-500 rounded-xl hover:bg-indigo-500/[0.05] transition-all flex flex-col justify-between shadow-sm">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-750 flex items-center gap-1 border-b border-indigo-150 pb-1 mb-1.5">
                  🎯 Devoir M-Motors
                </p>
                <p className="text-xs text-slate-650 italic leading-relaxed font-mono flex-1 text-balance overflow-x-auto word-break">
                  {fiche.motorsLink}
                </p>
              </div>
            </div>

            {/* Interactive Status Selector Bar */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  🟢 Statut de validation ({activeZone === 'A' ? 'Zone A - Vous' : activeZone === 'B' ? 'Zone B - Jury' : 'Zone C - Commun'}):
                </span>
                {completedDate && (
                  <span className="text-[9px] text-[#34A853] font-black flex items-center gap-1 bg-emerald-55 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-sm">
                    <Calendar className="w-2.5 h-2.5 text-[#34A853]" /> Validé le {completedDate}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100/85 p-1 rounded-xl">
                {(['A faire', 'En cours', 'Fait'] as FicheStatus[]).map(status => {
                  const isActive = currentStatus === status;
                  const getStatusStyle = () => {
                    if (!isActive) {
                      if (status === 'Fait') return 'text-[#34A853]/90 bg-white/40 hover:bg-[#34A853]/15 hover:text-[#34A853]';
                      if (status === 'En cours') return 'text-[#b7791f] bg-white/40 hover:bg-[#FBBC05]/20 hover:text-[#b7791f]';
                      return 'text-[#EA4335]/90 bg-white/40 hover:bg-[#EA4335]/15 hover:text-[#EA4335]';
                    }
                    if (status === 'Fait') return 'bg-[#34A853] text-white font-black shadow-md scale-[1.04] ring-2 ring-[#34A853]/20';
                    if (status === 'En cours') return 'bg-[#FBBC05] text-slate-900 font-black shadow-md scale-[1.04] ring-2 ring-[#FBBC05]/25';
                    return 'bg-[#EA4335] text-white font-black shadow-md scale-[1.04] ring-2 ring-[#EA4335]/20';
                  };

                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(fiche.id, activeZone, status)}
                      className={`py-1.5 rounded-lg text-[10.5px] text-center select-none cursor-pointer tracking-tight transition-all duration-350 font-bold hover:scale-[1.02] border border-transparent ${
                        isActive ? 'border-slate-950/5' : 'border-slate-202/40'
                      } ${getStatusStyle()}`}
                    >
                      {status === 'Fait' ? 'Fait ✔' : status === 'En cours' ? 'En cours ⏳' : 'À faire 💤'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Resources Grid - Spans lg:col-span-5 */}
          <div className="w-full lg:col-span-5 lg:border-l border-slate-205/60 pt-4 lg:pt-0 lg:pl-4 flex flex-col justify-start gap-2.5 flex-wrap">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                📦 Supports & Ressources (Zone {activeZone}) :
              </p>
              
              {/* Common File (PDF) with edit / custom link options */}
              {fiche.coursFile && (() => {
                const isSeen = !!(seenResources[fiche.id]?.coursFile);
                const seenAt = seenResources[fiche.id]?.coursFile;
                return (
                  <div className={`p-2.5 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] border border-slate-200 border-l-[3.5px] border-l-[#4285F4] rounded-xl flex flex-col gap-1.5 transition-all mb-2 shadow-sm transform hover:-translate-y-[1px] ${isSeen ? 'bg-emerald-500/[0.04] border-emerald-200' : ''}`}>
                    <div className="flex items-start justify-between text-[10px] gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleResourceSeen(fiche.id, 'coursFile');
                          }}
                          className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 ${
                            isSeen 
                              ? 'bg-[#34A853] border-[#34A853] text-white hover:bg-emerald-600 shadow-sm' 
                              : 'border-slate-300 hover:border-[#34A853] hover:bg-emerald-50 text-transparent'
                          }`}
                          title={isSeen ? `Pris connaissance le ${seenAt}. Cliquer pour marquer comme non lu.` : "Marquer ce document PDF comme lu"}
                        >
                          <Check className="w-3 h-3 stroke-[3.5]" />
                        </button>
                        <span className="font-bold text-slate-800 flex flex-col gap-0.5 whitespace-normal break-all max-w-full leading-normal" title={fiche.coursFile}>
                          <span className="font-mono text-[10px] text-slate-705">📂 {fiche.coursFile}</span>
                          {isSeen && seenAt && (
                            <span className="text-[8.5px] font-sans font-extrabold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 flex items-center gap-0.5 mt-0.5 w-fit select-none font-sans">
                              👁️ Lu le {seenAt}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {fiche.coursFileUrl || fiche.coursFile.startsWith('http') ? (
                        <button
                          onClick={() => setSelectedResourceForPreview({
                            title: fiche.title,
                            resourceName: fiche.coursFile || "Document PDF de Support d'Étude",
                            url: fiche.coursFileUrl || fiche.coursFile,
                            type: 'slide',
                            ficheId: fiche.id,
                            resourceKey: 'coursFile'
                          })}
                          className="p-0.5 px-2.5 bg-[#4285F4] hover:bg-blue-600 text-white rounded-md transition-all text-[10px] flex items-center gap-1 font-bold cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <span>👁️ Lire Support</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 italic">Lien non configuré</span>
                      )}

                      <button
                        onClick={() => setEditingPdfFicheId(editingPdfFicheId === fiche.id ? null : fiche.id)}
                        className="text-[8px] text-blue-600 hover:text-blue-755 font-extrabold hover:underline transition-all"
                      >
                        {fiche.coursFileUrl || fiche.coursFile.startsWith('http') ? '✏️ Modifier' : '🔗 Lier un PDF'}
                      </button>
                    </div>

                    {/* Quick inline URL associator */}
                    {editingPdfFicheId === fiche.id && (
                      <div className="pt-2 border-t border-slate-200 text-[10px] flex flex-col gap-1 bento-pop bg-slate-50 p-2 rounded-xl border">
                        <p className="font-semibold text-slate-700">Lien Google Drive du PDF :</p>
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            placeholder="https://drive.google.com/..." 
                            id={`input-pdf-link-${fiche.id}`}
                            defaultValue={fiche.coursFileUrl || (fiche.coursFile.startsWith('http') ? fiche.coursFile : '')}
                            className="flex-1 p-1 px-2 text-[10px] bg-white border border-slate-250 rounded-md focus:border-blue-500 focus:outline-none text-slate-800"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = e.currentTarget.value;
                                if (val) handleAssignPdfUrl(fiche.id, val);
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              const el = document.getElementById(`input-pdf-link-${fiche.id}`) as HTMLInputElement;
                              if (el && el.value) handleAssignPdfUrl(fiche.id, el.value);
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Display ONLY activeZone resource block */}
              <div>
                {activeZone === 'A' && (
                  /* Zone A Resource block */
                  (fiche.audio1 || fiche.slide1 || fiche.video1 || fiche.image1 || fiche.nblm1) && (
                    <div className="bg-blue-50/10 border border-blue-150/40 rounded-xl p-2 animate-fadeIn">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Zone A • Évaluations (Moi)</span>
                        <span className="bg-blue-100 text-blue-700 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-tight">Zone A</span>
                      </p>
                      <div className="space-y-1">
                        {fiche.audio1 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Vocal d'évaluation (.m4a)" 
                            url={fiche.audio1} 
                            type="audio" 
                            zone="A" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="audio1"
                            isSeen={!!(seenResources[fiche.id]?.audio1)}
                            seenAt={seenResources[fiche.id]?.audio1}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.slide1 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Slides Présentation" 
                            url={fiche.slide1} 
                            type="slide" 
                            zone="A" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="slide1"
                            isSeen={!!(seenResources[fiche.id]?.slide1)}
                            seenAt={seenResources[fiche.id]?.slide1}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.video1 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Vidéo Explicative" 
                            url={fiche.video1} 
                            type="video" 
                            zone="A" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="video1"
                            isSeen={!!(seenResources[fiche.id]?.video1)}
                            seenAt={seenResources[fiche.id]?.video1}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.image1 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Schémas d'Appuis" 
                            url={fiche.image1} 
                            type="image" 
                            zone="A" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="image1"
                            isSeen={!!(seenResources[fiche.id]?.image1)}
                            seenAt={seenResources[fiche.id]?.image1}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.nblm1 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="NotebookLM d'Appuis IA" 
                            url={fiche.nblm1} 
                            type="nblm" 
                            zone="A" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="nblm1"
                            isSeen={!!(seenResources[fiche.id]?.nblm1)}
                            seenAt={seenResources[fiche.id]?.nblm1}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                      </div>
                    </div>
                  )
                )}

                {activeZone === 'B' && (
                  /* Zone B Resource block */
                  (fiche.audio2 || fiche.slide2 || fiche.video2 || fiche.image2 || fiche.nblm2) && (
                    <div className="bg-red-50/10 border border-red-150/40 rounded-xl p-2 animate-fadeIn">
                      <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Zone B • Retour Jury</span>
                        <span className="bg-red-100 text-red-700 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-tight">Zone B</span>
                      </p>
                      <div className="space-y-1">
                        {fiche.audio2 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Vocal Soutenance (.m4a)" 
                            url={fiche.audio2} 
                            type="audio" 
                            zone="B" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="audio2"
                            isSeen={!!(seenResources[fiche.id]?.audio2)}
                            seenAt={seenResources[fiche.id]?.audio2}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.slide2 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Slides Réponses Jury" 
                            url={fiche.slide2} 
                            type="slide" 
                            zone="B" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="slide2"
                            isSeen={!!(seenResources[fiche.id]?.slide2)}
                            seenAt={seenResources[fiche.id]?.slide2}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.video2 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Vidéo Démonstration Jury" 
                            url={fiche.video2} 
                            type="video" 
                            zone="B" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="video2"
                            isSeen={!!(seenResources[fiche.id]?.video2)}
                            seenAt={seenResources[fiche.id]?.video2}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.image2 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Preuves & Graphiques d'Appui" 
                            url={fiche.image2} 
                            type="image" 
                            zone="B" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="image2"
                            isSeen={!!(seenResources[fiche.id]?.image2)}
                            seenAt={seenResources[fiche.id]?.image2}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.nblm2 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="NotebookLM Réponses Jury" 
                            url={fiche.nblm2} 
                            type="nblm" 
                            zone="B" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="nblm2"
                            isSeen={!!(seenResources[fiche.id]?.nblm2)}
                            seenAt={seenResources[fiche.id]?.nblm2}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                      </div>
                    </div>
                  )
                )}

                {activeZone === 'C' && (
                  /* Zone C Resource block */
                  (fiche.audio3 || fiche.slide3 || fiche.video3 || fiche.image3 || fiche.nblm3) && (
                    <div className="bg-emerald-50/10 border border-emerald-150/40 rounded-xl p-2 animate-fadeIn">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Zone C • Tracés Communs</span>
                        <span className="bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-tight">Zone C</span>
                      </p>
                      <div className="space-y-1">
                        {fiche.audio3 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Vocal Commun (.m4a)" 
                            url={fiche.audio3} 
                            type="audio" 
                            zone="C" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="audio3"
                            isSeen={!!(seenResources[fiche.id]?.audio3)}
                            seenAt={seenResources[fiche.id]?.audio3}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.slide3 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Slides Base Commune" 
                            url={fiche.slide3} 
                            type="slide" 
                            zone="C" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="slide3"
                            isSeen={!!(seenResources[fiche.id]?.slide3)}
                            seenAt={seenResources[fiche.id]?.slide3}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.video3 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Vidéo Explicative Commune" 
                            url={fiche.video3} 
                            type="video" 
                            zone="C" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="video3"
                            isSeen={!!(seenResources[fiche.id]?.video3)}
                            seenAt={seenResources[fiche.id]?.video3}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.image3 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Iconographies Communes" 
                            url={fiche.image3} 
                            type="image" 
                            zone="C" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="image3"
                            isSeen={!!(seenResources[fiche.id]?.image3)}
                            seenAt={seenResources[fiche.id]?.image3}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                        {fiche.nblm3 && (
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="NotebookLM Références Communes" 
                            url={fiche.nblm3} 
                            type="nblm" 
                            zone="C" 
                            onPreviewInApp={setSelectedResourceForPreview}
                            resourceKey="nblm3"
                            isSeen={!!(seenResources[fiche.id]?.nblm3)}
                            seenAt={seenResources[fiche.id]?.nblm3}
                            onToggleSeen={handleToggleResourceSeen}
                          />
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Default studi module support */}
            {fiche.studi && (
              <div className="mt-1">
                <ResourcePlayer 
                  ficheId={fiche.id} 
                  ficheTitle={fiche.title} 
                  resourceName="Plateforme d'études Studi" 
                  url={fiche.studi} 
                  type="studi" 
                  zone="common" 
                  onPreviewInApp={setSelectedResourceForPreview}
                  resourceKey="studi"
                  isSeen={!!(seenResources[fiche.id]?.studi)}
                  seenAt={seenResources[fiche.id]?.studi}
                  onToggleSeen={handleToggleResourceSeen}
                />
              </div>
            )}
          </div>

        </div>

        {/* COLLAPSIBLE INTEGRATED IN-APP PREVIEW PLAYER (ZERO WASTED SPACE, 100% RESPONSIVE WIDTH) */}
        {selectedResourceForPreview && selectedResourceForPreview.ficheId === fiche.id && (
          selectedResourceForPreview.type === 'audio' ? (
            <IntegratedAudioVisualPlayer
              fiche={fiche}
              activeZone={activeZone}
              selectedResourceForPreview={selectedResourceForPreview}
              previewHeight={previewHeight}
              onClose={() => setSelectedResourceForPreview(null)}
              onSetHeight={setPreviewHeight}
              onSpeechActivate={() => setSelectedSpeechFiche(fiche)}
            />
          ) : (
            <div className="w-full mt-4 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 text-slate-100 flex flex-col gap-3.5 animate-slideDown shadow-2xl">
              {/* Direct Player Header */}
              <div className="flex items-center justify-between text-white border-b border-white/[0.08] pb-3 text-xs gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-blue-405 font-mono text-[9px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                    LECTEUR DIRECT 📄
                  </span>
                  <span className="font-extrabold text-slate-200 text-xs md:text-sm line-clamp-2 max-w-[180px] sm:max-w-xs md:max-w-md break-words whitespace-normal leading-tight block">
                    {selectedResourceForPreview.resourceName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedResourceForPreview.resourceKey && (() => {
                    const rKey = selectedResourceForPreview.resourceKey;
                    const isSeen = !!(seenResources[fiche.id]?.[rKey]);
                    const seenAt = seenResources[fiche.id]?.[rKey];
                    return (
                      <button
                        onClick={() => handleToggleResourceSeen(fiche.id, rKey)}
                        className={`p-1 px-2.5 rounded-lg transition-all text-[10px] flex items-center gap-1 font-bold border cursor-pointer select-none ${
                          isSeen
                            ? 'bg-[#34A853] text-white border-[#34A853] hover:bg-emerald-600'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/[0.08]'
                        }`}
                        title={isSeen ? `Vu le ${seenAt}. Cliquer pour enlever.` : "Marquer ce document comme lu/vu"}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSeen ? `✓ Vu le ${seenAt}` : "Marquer comme VU / LU 👁️"}</span>
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => setSelectedSpeechFiche(fiche)}
                    className="p-1 px-2.5 bg-gradient-to-r from-[#4285F4] to-indigo-650 hover:from-blue-600 hover:to-indigo-750 text-white rounded-lg transition-all text-[10px] flex items-center gap-1 font-bold border border-transparent shadow hover:scale-105 active:scale-95 cursor-pointer select-none"
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
                    Ouvrir externe ↗
                  </a>
                  <button
                    onClick={() => setPreviewHeight(prev => prev === 'compact' ? 'large' : 'compact')}
                    className="p-1 px-2.5 bg-slate-850 hover:bg-slate-700 text-slate-350 rounded-lg transition-all text-[10px] flex items-center gap-1 font-bold cursor-pointer border border-slate-700 shadow-sm"
                    title="Alterner la hauteur de la vue intégrée"
                  >
                    {previewHeight === 'compact' ? '↕️ Agrandir' : '↕️ Réduire'}
                  </button>
                  <button
                    onClick={() => {
                      setIsFullscreenPreview(true);
                      triggerToast("🖥️ Mode Concentration Plein Écran Activé", "success");
                    }}
                    className="p-1 px-2.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-800 text-white rounded-lg transition-all text-[10px] flex items-center gap-1.5 font-extrabold cursor-pointer shadow border border-transparent hover:scale-105 active:scale-95"
                    title="Masquer le tableau de bord pour une concentration totale"
                  >
                    🖥️ Plein Écran (Focus)
                  </button>
                  <button
                    onClick={() => setSelectedResourceForPreview(null)}
                    className="text-white font-black text-[10px] p-1 px-2 bg-red-650 hover:bg-red-700 rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    ✕ Fermer
                  </button>
                </div>
              </div>

              {/* Content preview direct frame */}
              {(() => {
                const url = selectedResourceForPreview.url;
                const ytEmbed = getYoutubeEmbedUrl(url);
                const isDirectVideo = isDirectVideoUrl(url) || selectedResourceForPreview.type === 'video';
                const driveEmbed = getDriveEmbedUrl(url);

                const containerHeight = previewHeight === 'compact' ? 'h-[280px]' : 'h-[550px]';

                if (isDirectVideo) {
                  return (
                    <div className={`w-full relative rounded-xl overflow-hidden bg-black border border-slate-800 transition-all duration-300 ${containerHeight}`}>
                      <video 
                        src={url} 
                        className="w-full h-full max-h-full rounded-xl bg-black object-contain" 
                        controls 
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                        autoPlay 
                        playsInline
                      />
                    </div>
                  );
                }

                if (ytEmbed) {
                  return (
                    <div className={`w-full relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all duration-300 ${containerHeight}`}>
                      <iframe 
                        src={ytEmbed} 
                        className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title="YouTube Video Preview"
                      />
                    </div>
                  );
                }

                if (driveEmbed) {
                  return (
                    <div className={`w-full relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all duration-300 ${containerHeight}`}>
                      <iframe 
                        src={driveEmbed} 
                        className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                        allow="autoplay; encrypted-media"
                        title="In-App Preview"
                      />
                    </div>
                  );
                }

                return (
                  <div className="p-8 text-center text-slate-305 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">⚠️</span>
                    <h5 className="font-bold text-sm text-slate-100">Intégration directe non supportée</h5>
                    <p className="text-xs text-slate-450 mt-1 max-w-sm">Ce fichier requiert une authentification externe ou une extension de sécurité.</p>
                    <a 
                      href={url} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      rel="noopener noreferrer" 
                      className="mt-4 px-4 py-2 bg-[#4285F4] hover:bg-blue-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow"
                    >
                      Ouvrir externe <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })()}

              <div className="text-[10px] text-slate-400 italic">
                💡 Lecture sécurisée dans l'application &bull; Prévient les redirections externes
              </div>
            </div>
          )
        )}

      </div>
    );
  };

  const renderPlanningView = () => {
    // Helper to parse localized French dates to standard ISO strings
    const convertFrDateToIso = (frDate: string | undefined): string => {
      if (!frDate) return '';
      const parts = frDate.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return frDate;
    };

    // Calculate completed learning logs on a specific day
    const getCompletedHistory = () => {
      const history: {
        ficheId: number;
        title: string;
        topic: string;
        block: string;
        completedDate: string; // YYYY-MM-DD for matching
        originalDateStr: string;
        zone: 'Zone A' | 'Zone B' | 'Zone C';
      }[] = [];

      fiches.forEach(f => {
        if (f.status1 === 'Fait' && f.date1) {
          history.push({
            ficheId: f.id,
            title: f.title,
            topic: f.topic,
            block: f.block,
            completedDate: convertFrDateToIso(f.date1),
            originalDateStr: f.date1,
            zone: 'Zone A'
          });
        }
        if (f.status2 === 'Fait' && f.date2) {
          history.push({
            ficheId: f.id,
            title: f.title,
            topic: f.topic,
            block: f.block,
            completedDate: convertFrDateToIso(f.date2),
            originalDateStr: f.date2,
            zone: 'Zone B'
          });
        }
        if ((f.status3 || 'A faire') === 'Fait' && f.date3) {
          history.push({
            ficheId: f.id,
            title: f.title,
            topic: f.topic,
            block: f.block,
            completedDate: convertFrDateToIso(f.date3),
            originalDateStr: f.date3,
            zone: 'Zone C'
          });
        }
      });

      return history;
    };

    const completedHistory = getCompletedHistory();

    // Collect all scheduled occurrences across all reminders
    const allOccurrences: {
      id: string; 
      ficheId: number;
      ficheTitle: string;
      topic: string;
      label: string; // J+3, J+7, etc.
      dateStr: string; // YYYY-MM-DD HH:MM
      completed: boolean;
      type: 'spaced' | 'custom';
    }[] = [];

    reminders.forEach(r => {
      r.scheduledDates.forEach(occ => {
        allOccurrences.push({
          id: r.id,
          ficheId: r.ficheId,
          ficheTitle: r.ficheTitle,
          topic: r.topic,
          label: occ.label,
          dateStr: occ.date,
          completed: occ.completed,
          type: r.type
        });
      });
    });

    // Sort chronologically
    allOccurrences.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    const todayStrRaw = new Date();
    const todayStr = `${todayStrRaw.getFullYear()}-${String(todayStrRaw.getMonth() + 1).padStart(2, '0')}-${String(todayStrRaw.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
    
    const dueToday = allOccurrences.filter(occ => !occ.completed && occ.dateStr.startsWith(todayStr));
    const upcoming = allOccurrences.filter(occ => occ.dateStr > todayStr || (!occ.completed && occ.dateStr < todayStr && !occ.dateStr.startsWith(todayStr)));

    const toggleOccCompleted = (reminderId: string, label: string) => {
      setReminders(prev => prev.map(r => {
        if (r.id === reminderId) {
          return {
            ...r,
            scheduledDates: r.scheduledDates.map(occ => {
              if (occ.label === label) {
                const newStatus = !occ.completed;
                if (newStatus) {
                  triggerToast("Félicitations Mathilde ! Rappel validé et appris ✨", "success");
                }
                return { ...occ, completed: newStatus };
              }
              return occ;
            })
          };
        }
        return r;
      }));
    };

    const deleteReminderGroup = (reminderId: string) => {
      if (window.confirm("Voulez-vous vraiment supprimer tous les rappels de ce cours ?")) {
        setReminders(prev => prev.filter(r => r.id !== reminderId));
        triggerToast("Rappels supprimés avec succès 🗑️", "info");
      }
    };

    // Calendar Calculations
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNamesFr = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndexRaw = new Date(year, month, 1).getDay();
    const indent = firstDayIndexRaw === 0 ? 6 : firstDayIndexRaw - 1; // Align to Monday as 0
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Preceding grayed days
    for (let i = indent - 1; i >= 0; i--) {
      const prevDayNum = prevMonthTotalDays - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDayNum).padStart(2, '0')}`;
      cells.push({
        dayNum: prevDayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Active month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Trailing days
    const remainingSlots = 42 - cells.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Mathilde selected day details
    const selectedDayOccurrences = allOccurrences.filter(occ => occ.dateStr.startsWith(selectedCalendarDay));
    const selectedDayCompletions = completedHistory.filter(h => h.completedDate === selectedCalendarDay);

    const formatDayLabelFr = (isoDateStr: string) => {
      const parts = isoDateStr.split('-');
      if (parts.length === 3) {
        const dayNum = parseInt(parts[2]);
        const mIdx = parseInt(parts[1]) - 1;
        const yearNum = parts[0];
        const monthName = [
          "janvier", "février", "mars", "avril", "mai", "juin", 
          "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ][mIdx] || parts[1];
        return `${dayNum} ${monthName} ${yearNum}`;
      }
      return isoDateStr;
    };

    // Filter completions history list
    const filteredHistory = completedHistory.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(planningHistorySearch.toLowerCase()) || 
                            item.topic.toLowerCase().includes(planningHistorySearch.toLowerCase()) || 
                            item.block.toLowerCase().includes(planningHistorySearch.toLowerCase());
      const matchesZone = planningHistoryZone === 'all' || item.zone.endsWith(planningHistoryZone);
      return matchesSearch && matchesZone;
    });

    const previousMonth = () => {
      setCalendarDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
      setCalendarDate(new Date(year, month + 1, 1));
    };

    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto px-1 animate-fadeIn">
        
        {/* Fuchsia-Orange Spaced Repetitions Concept Explanation Card */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-pink-400/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full filter blur-2xl pointer-events-none -mr-12 -mt-12"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
            <div className="flex items-start gap-3">
              <span className="text-3xl bg-white/20 p-2.5 rounded-2xl shrink-0">🎓</span>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-1.5 leading-tight">
                  Espace Planning & Méthode des J • Mathilde Élite Club ⚡
                </h3>
                <p className="text-xs text-white/95 mt-1 max-w-3xl leading-relaxed">
                  Consultez votre <strong>calendrier d'échéance des rappels</strong> et visualisez l'historique de vos réussites par date. En validant vos fiches, vous ancrez l'information de manière définitive dans votre mémoire à long terme.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/15 p-2 rounded-2xl border border-white/10 text-xs text-white/90 font-bold self-start md:self-auto uppercase tracking-wider shrink-0">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>{completedHistory.length} Fiches Validées</span>
            </div>
          </div>
        </div>

        {/* SUBVIEW SWITCHER TABS CONTAINER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPlanningSubView('calendar')}
              className={`flex-1 sm:flex-none p-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                planningSubView === 'calendar'
                  ? 'bg-gradient-to-r from-pink-550 to-orange-500 text-white shadow-md shadow-pink-500/10'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendrier Global des Rappels
            </button>
            <button
              onClick={() => setPlanningSubView('history')}
              className={`flex-1 sm:flex-none p-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                planningSubView === 'history'
                  ? 'bg-gradient-to-r from-pink-550 to-orange-500 text-white shadow-md shadow-pink-500/10'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">📜</span>
              Historique Complet d'Étude ({completedHistory.length})
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-mono font-bold uppercase select-none hidden md:block">
            📅 Agenda & Chronologie en temps réel
          </p>
        </div>

        {/* TODAY'S ALERTS BAR */}
        {dueToday.length > 0 && planningSubView === 'calendar' && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 p-5 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/[0.02] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-pink-600 rounded-full animate-ping shrink-0"></span>
              <h4 className="font-black text-pink-700 uppercase tracking-widest text-xs sm:text-sm">
                🚨 EXERCICES À REVOIR AUJOURD'HUI ({dueToday.length}) :
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {dueToday.map((occ, idx) => {
                const associatedFiche = fiches.find(f => f.id === occ.ficheId);
                return (
                  <div 
                    key={`${occ.id}-${occ.label}-${idx}`}
                    className="bg-white p-3.5 rounded-2xl border border-pink-100 shadow-sm flex items-center justify-between gap-3 hover:border-pink-300 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-pink-100 text-pink-700 font-black text-[9px] rounded border border-pink-200 uppercase tracking-widest leading-none">
                          {occ.label}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">Fiche #{occ.ficheId}</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm truncate mt-1 leading-snug">
                        {occ.ficheTitle}
                      </p>
                      <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">
                        Date de relance : {formatFriendlyDate(occ.dateStr)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {associatedFiche && (
                        <button
                          onClick={() => {
                            const audioUrl = activeZone === 'A' ? associatedFiche.audio1 : activeZone === 'B' ? associatedFiche.audio2 : associatedFiche.audio3;
                            if (audioUrl) {
                              setSelectedResourceForPreview({
                                title: associatedFiche.title,
                                resourceName: `Audio d’Étude #${associatedFiche.id}`,
                                url: audioUrl,
                                type: 'audio',
                                ficheId: associatedFiche.id
                              });
                            } else if (associatedFiche.coursFile) {
                              setSelectedResourceForPreview({
                                title: associatedFiche.title,
                                resourceName: associatedFiche.coursFile,
                                url: associatedFiche.coursFileUrl || associatedFiche.coursFile,
                                type: 'slide',
                                ficheId: associatedFiche.id
                              });
                            }
                            triggerToast("Lancement du support de révision !", "info");
                          }}
                          className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black transition-all shadow-sm"
                        >
                          👁️ Étudier
                        </button>
                      )}
                      <button
                        onClick={() => toggleOccCompleted(occ.id, occ.label)}
                        className="p-1.5 bg-pink-100 hover:bg-pink-600 text-pink-700 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-pink-200 shadow-sm flex items-center gap-0.5 cursor-pointer"
                      >
                        ✔ Fait
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW 1: DETAILED INTERACTIVE CALENDAR VIEW */}
        {planningSubView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Interactive Monthly Grid */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
              
              {/* Header Controller */}
              <div className="flex items-center justify-between mb-5 select-none">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-pink-500 uppercase font-mono tracking-widest">
                    Consultation des Échéances
                  </span>
                  <h4 className="text-lg font-black text-slate-900 mt-0.5">
                    {monthNamesFr[month]} {year}
                  </h4>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={previousMonth}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                    title="Mois Précédent"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date(2026, 5, 1))}
                    className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-white rounded-lg hover:text-slate-800 transition-all cursor-pointer font-mono"
                  >
                    Reset
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                    title="Mois Suivant"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Weekdays row */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(dayName => (
                  <div key={dayName} className="py-1">{dayName}</div>
                ))}
              </div>

              {/* 42-cell matrix rows */}
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, idx) => {
                  const hasDueReminders = allOccurrences.filter(occ => !occ.completed && occ.dateStr.startsWith(cell.dateStr));
                  const hasDoneOccurrences = allOccurrences.filter(occ => occ.completed && occ.dateStr.startsWith(cell.dateStr));
                  const hasCompletions = completedHistory.filter(h => h.completedDate === cell.dateStr);

                  const isSelected = selectedCalendarDay === cell.dateStr;

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      onClick={() => setSelectedCalendarDay(cell.dateStr)}
                      className={`min-h-[72px] p-1.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative select-none ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/50 border-slate-100 text-slate-350 opacity-40'
                          : cell.isToday
                          ? 'bg-blue-50/30 border-blue-200 text-slate-900 shadow-sm shadow-blue-500/5'
                          : isSelected
                          ? 'bg-pink-50 border-pink-400 text-pink-905 ring-2 ring-pink-500/15'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      {/* Day Number and current markers */}
                      <div className="flex items-center justify-between gap-0.5">
                        <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full leading-none transition-all ${
                          cell.isToday
                            ? 'bg-blue-600 text-white font-extrabold'
                            : isSelected
                            ? 'bg-pink-600 text-white font-extrabold'
                            : 'text-slate-800'
                        }`}>
                          {cell.dayNum}
                        </span>

                        {/* Quick Dot Indicator */}
                        {cell.isToday && !isSelected && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        )}
                      </div>

                      {/* Micro visual bullets list of contents inside the cell */}
                      <div className="mt-1 flex flex-col gap-0.5 max-h-[44px] overflow-hidden leading-none">
                        
                        {/* Due Reminders bar */}
                        {hasDueReminders.length > 0 && (
                          <div className="px-1 py-0.5 bg-orange-100 text-orange-850 text-[8px] font-black rounded border border-orange-200 shrink-0 flex items-center justify-between">
                            <span>⏳ Due</span>
                            <span className="bg-orange-600 text-white w-3 h-3 flex items-center justify-center rounded-full text-[7.5px] scale-90">{hasDueReminders.length}</span>
                          </div>
                        )}

                        {/* Completely Learned / Completed items marker */}
                        {hasCompletions.length > 0 && (
                          <div className="px-1 py-0.5 bg-emerald-100 text-emerald-850 text-[8px] font-black rounded border border-emerald-250 shrink-0 flex items-center justify-center gap-0.5">
                            <span className="text-[7.5px]">✔</span>
                            <span>{hasCompletions.length} Fait</span>
                          </div>
                        )}

                        {/* Done Reminders */}
                        {hasDueReminders.length === 0 && hasDoneOccurrences.length > 0 && (
                          <div className="text-[7px] text-slate-400 font-mono text-center flex items-center justify-center py-0.5 gap-0.5 bg-slate-100 rounded border border-slate-200 uppercase tracking-widest font-bold">
                            <span>✔ Rép</span>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legends Row */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center flex-wrap gap-4 text-[10px] text-slate-500 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                  <span>Aujourd'hui</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-5 rounded border border-pink-400 bg-pink-50"></span>
                  <span>Sélectionné</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="p-0.5 px-1 bg-orange-100 text-orange-700 border border-orange-200 rounded text-[7.5px] font-bold">⏳ Due</span>
                  <span>Rappel de fiche imminent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="p-0.5 px-1 bg-emerald-100 text-emerald-700 border border-emerald-255 rounded text-[7.5px] font-bold">✔ OK</span>
                  <span>Fiche validée ("Fait")</span>
                </div>
              </div>

            </div>

            {/* Date Detail Panel */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <span className="text-[9.5px] font-extrabold text-pink-500 uppercase font-mono tracking-wider">
                      Événements du Jour Sélectionné
                    </span>
                    <h5 className="text-sm font-extrabold text-slate-900 mt-1 capitalize">
                      📍 {formatDayLabelFr(selectedCalendarDay)}
                    </h5>
                  </div>

                  {/* Scheduled Reminders list */}
                  <div className="space-y-4">
                    <div>
                      <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                        ⏰ Rappels Programmés ({selectedDayOccurrences.length})
                      </h6>
                      
                      {selectedDayOccurrences.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-150">
                          Aucune séance de révision planifiée pour ce jour.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {selectedDayOccurrences.map((occ, oIdx) => {
                            const associatedFiche = fiches.find(f => f.id === occ.ficheId);
                            return (
                              <div key={`${occ.id}-${oIdx}`} className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-slate-350 transition-all">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1 py-0.5 font-extrabold text-[8px] rounded uppercase tracking-wider leading-none ${
                                      occ.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-700'
                                    }`}>
                                      {occ.label} {occ.completed ? '✔' : ''}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-400 font-mono">Fiche #{occ.ficheId}</span>
                                  </div>
                                  <p className="text-xs font-extrabold text-slate-900 mt-1 truncate">
                                    {occ.ficheTitle}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    {occ.topic}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {associatedFiche && (
                                    <button
                                      onClick={() => {
                                        const audioUrl = activeZone === 'A' ? associatedFiche.audio1 : activeZone === 'B' ? associatedFiche.audio2 : associatedFiche.audio3;
                                        if (audioUrl) {
                                          setSelectedResourceForPreview({
                                            title: associatedFiche.title,
                                            resourceName: `Audio d’Étude #${associatedFiche.id}`,
                                            url: audioUrl,
                                            type: 'audio',
                                            ficheId: associatedFiche.id
                                          });
                                        } else if (associatedFiche.coursFile) {
                                          setSelectedResourceForPreview({
                                            title: associatedFiche.title,
                                            resourceName: associatedFiche.coursFile,
                                            url: associatedFiche.coursFileUrl || associatedFiche.coursFile,
                                            type: 'slide',
                                            ficheId: associatedFiche.id
                                          });
                                        }
                                        triggerToast("Lancement de l'étude !", "info");
                                      }}
                                      className="p-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[8.5px] font-black transition-all"
                                      title="Lancer le support"
                                    >
                                      👁️
                                    </button>
                                  )}
                                  <button
                                    onClick={() => toggleOccCompleted(occ.id, occ.label)}
                                    className={`p-1 px-1.5 rounded text-[8.5px] font-extrabold cursor-pointer transition-all border ${
                                      occ.completed
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-250 hover:bg-emerald-200'
                                        : 'bg-white text-slate-500 border-slate-300 hover:bg-pink-600 hover:text-white hover:border-transparent font-black'
                                    }`}
                                    title={occ.completed ? "Remarquer comme non-fait" : "Marquer comme révisé pour ce J"}
                                  >
                                    ✔
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Studied History of that day list */}
                    <div>
                      <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                        🏆 Cours Validés à cette Date ({selectedDayCompletions.length})
                      </h6>
                      
                      {selectedDayCompletions.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-150">
                          Aucun cours validé ce jour-là.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {selectedDayCompletions.map((comp, idx) => (
                            <div key={`${comp.ficheId}-${idx}`} className="p-2.5 bg-emerald-500/[0.02] border border-emerald-500/15 rounded-xl flex items-center justify-between gap-1.5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`px-1 py-0.5 text-[7.5px] font-black rounded-md uppercase tracking-wider ${
                                    comp.zone === 'Zone A' ? 'bg-blue-100 text-blue-700' : comp.zone === 'Zone B' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {comp.zone}
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-400 font-bold">Fiche #{comp.ficheId}</span>
                                </div>
                                <p className="text-[11.5px] font-extrabold text-slate-800 mt-1 truncate">
                                  {comp.title}
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  const associated = fiches.find(f => f.id === comp.ficheId);
                                  if (associated) {
                                    const audioUrl = comp.zone === 'Zone A' ? associated.audio1 : comp.zone === 'Zone B' ? associated.audio2 : associated.audio3;
                                    if (audioUrl) {
                                      setSelectedResourceForPreview({
                                        title: associated.title,
                                        resourceName: `Support #${associated.id}`,
                                        url: audioUrl,
                                        type: 'audio',
                                        ficheId: associated.id
                                      });
                                    } else if (associated.coursFile) {
                                      setSelectedResourceForPreview({
                                        title: associated.title,
                                        resourceName: associated.coursFile,
                                        url: associated.coursFileUrl || associated.coursFile,
                                        type: 'slide',
                                        ficheId: associated.id
                                      });
                                    }
                                    triggerToast("Relance du support d'étude !", "info");
                                  }
                                }}
                                className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[8px] font-extrabold transition-all shrink-0"
                              >
                                Écouter 🔊
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 text-slate-400 text-[10px] leading-relaxed italic text-center">
                  💡 Cliquez sur n'importe quel jour du calendrier pour consulter en direct toutes ses échéances.
                </div>
              </div>

              {/* Progress summary block */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
                <span className="text-[9px] text-pink-500 font-black uppercase tracking-widest font-mono">
                  SÉANCES D’ÉVALUATIONS EN COURS
                </span>
                <h5 className="text-[13px] font-extrabold text-slate-250 mt-1 leading-snug">
                  Total des Fiches Programmées : {reminders.length} Modules
                </h5>

                <div className="mt-4 space-y-3">
                  {reminders.slice(0, 3).map((r, rIdx) => {
                    const dones = r.scheduledDates.filter(o => o.completed).length;
                    const totalD = r.scheduledDates.length;
                    const percent = Math.round((dones / totalD) * 100) || 0;

                    return (
                      <div key={r.id + rIdx} className="bg-white/5 p-2 rounded-xl border border-white/10 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="truncate text-[11px] text-slate-205">{r.ficheTitle}</span>
                          <span className="text-pink-400 text-[10.5px] shrink-0 font-mono">{dones}/{totalD}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5">
                          <div className="bg-gradient-to-r from-pink-500 to-orange-550 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {reminders.length > 3 && (
                    <p className="text-[9px] text-slate-450 italic text-center text-slate-400 pt-1">
                      + {reminders.length - 3} autres cours en répétition active...
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUBVIEW 2: FULL STUDY AND COMPLETIONS TIMELINE */}
        {planningSubView === 'history' && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm animate-fadeIn">
            
            {/* Filtering Control Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
              <div className="flex-1 max-w-sm">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Rechercher un cours validé:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer par titre, bloc ou sujet..."
                    value={planningHistorySearch}
                    onChange={(e) => setPlanningHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Zone selectors */}
              <div className="flex flex-col gap-1 shrink-0">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Filtrer par Zone d'Étude:
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['all', 'A', 'B', 'C'] as const).map(zoneKey => (
                    <button
                      key={zoneKey}
                      onClick={() => setPlanningHistoryZone(zoneKey)}
                      className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition-all cursor-pointer uppercase ${
                        planningHistoryZone === zoneKey
                          ? zoneKey === 'A'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : zoneKey === 'B'
                            ? 'bg-red-500 text-white shadow-sm'
                            : zoneKey === 'C'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-white hover:text-slate-800'
                      }`}
                    >
                      {zoneKey === 'all' ? 'Toutes' : `Zone ${zoneKey}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Results List */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <span className="text-3xl block">📋</span>
                <p className="text-xs font-black text-slate-600 mt-2">Aucun historique correspondant à vos critères.</p>
                <p className="text-[11px] text-slate-450 mt-1">Validez des cours dans la Zone A, B ou C pour alimenter ce rapport d'évènements.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-4 py-2">
                {filteredHistory.map((item, idx) => {
                  const associated = fiches.find(f => f.id === item.ficheId);
                  return (
                    <div key={`${item.ficheId}-${item.zone}-${idx}`} className="relative group animate-fadeIn">
                      
                      {/* Interactive visual bullet node */}
                      <span className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white transition-transform group-hover:scale-120 ${
                        item.zone === 'Zone A' ? 'bg-blue-600' : item.zone === 'Zone B' ? 'bg-red-500' : 'bg-emerald-600'
                      }`}></span>

                      <div className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-slate-350">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[10px] text-slate-500">
                              📅 {item.originalDateStr}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${
                              item.zone === 'Zone A' 
                                ? 'bg-blue-105 text-blue-700' 
                                : item.zone === 'Zone B' 
                                ? 'bg-red-105 text-red-700' 
                                : 'bg-emerald-105 text-emerald-700'
                            }`}>
                              {item.zone === 'Zone A' ? 'Zone A • Évaluation' : item.zone === 'Zone B' ? 'Zone B • Jury' : 'Zone C • Commun'}
                            </span>
                            <span className="text-[8.5px] font-bold text-slate-400 font-mono">
                              {item.block} • Fiche #{item.ficheId}
                            </span>
                          </div>

                          <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-1 group-hover:text-pink-600 transition-colors">
                            {item.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Thème du cours : {item.topic}
                          </p>
                        </div>

                        {associated && (
                          <button
                            onClick={() => {
                              const audioUrl = item.zone === 'Zone A' ? associated.audio1 : item.zone === 'Zone B' ? associated.audio2 : associated.audio3;
                              if (audioUrl) {
                                setSelectedResourceForPreview({
                                  title: associated.title,
                                  resourceName: `Support #${associated.id}`,
                                  url: audioUrl,
                                  type: 'audio',
                                  ficheId: associated.id
                                });
                              } else if (associated.coursFile) {
                                setSelectedResourceForPreview({
                                  title: associated.title,
                                  resourceName: associated.coursFile,
                                  url: associated.coursFileUrl || associated.coursFile,
                                  type: 'slide',
                                  ficheId: associated.id
                                });
                              }
                              triggerToast("Lancement de l'étude !", "info");
                            }}
                            className="self-start sm:self-auto p-1.5 px-3.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-xl text-[10px] font-extrabold transition-all shadow-sm flex items-center gap-1 shrink-0"
                          >
                            <span>👁️ Revisiter</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl text-center text-[10px] text-slate-400 mt-5 border border-slate-100 select-none">
              ⏳ Les dates d'enregistrement correspondent à l'heure à laquelle vous basculez l'état d'avancement d'un cours en "Fait" dans les zones respectives.
            </div>

          </div>
        )}

      </div>
    );
  };

  const renderReminderModal = () => {
    if (!ficheForReminderModal) return null;

    const nowLocal = new Date();
    const j0 = new Date(nowLocal);
    j0.setMinutes(0, 0, 0);
    j0.setHours(j0.getHours() + 1);

    const intervals = [3, 7, 14, 30, 60, 90];
    const generatedDates = intervals.map(days => {
      const d = new Date(j0);
      d.setDate(d.getDate() + days);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = '00';
      return {
        label: `J+${days}`,
        dateStr: `${year}-${month}-${day} ${hours}:${minutes}`,
        dateObj: d
      };
    });

    const j0Str = `${j0.getFullYear()}-${String(j0.getMonth() + 1).padStart(2, '0')}-${String(j0.getDate()).padStart(2, '0')} ${String(j0.getHours()).padStart(2, '0')}:00`;

    const saveAndExport = (platform: 'google' | 'ics' | 'outlook' | 'apple') => {
      const scheduledDatesList: { label: string; date: string; completed: boolean }[] = [];

      if (reminderType === 'spaced') {
        scheduledDatesList.push({ label: 'J0', date: j0Str, completed: false });
        generatedDates.forEach(it => {
          scheduledDatesList.push({ label: it.label, date: it.dateStr, completed: false });
        });
      } else {
        const customDate = customDateValue || new Date(Date.now() + 86450000).toISOString().substring(0, 16);
        const [dVal, tVal] = customDate.replace('T', ' ').split(' ');
        scheduledDatesList.push({ label: 'Perso', date: `${dVal} ${tVal || '09:00'}`, completed: false });
      }

      const newReminder: Reminder = {
        id: Date.now().toString(),
        ficheId: ficheForReminderModal.id,
        ficheTitle: ficheForReminderModal.title,
        topic: ficheForReminderModal.topic,
        type: reminderType,
        baseDate: j0Str,
        scheduledDates: scheduledDatesList
      };

      setReminders(prev => [newReminder, ...prev.filter(r => r.ficheId !== ficheForReminderModal.id)]);

      if (platform === 'ics') {
        downloadIcsFile(ficheForReminderModal.title, scheduledDatesList);
        triggerToast("Fichier iCal (.ics) téléchargé pour votre calendrier !", "success");
      } else if (platform === 'google') {
        const targetOcc = scheduledDatesList[0];
        const { google } = getCalendarLinks(ficheForReminderModal.title, targetOcc.date);
        window.open(google, '_blank');
        triggerToast("Redirection Google Agenda activée !", "success");
      } else if (platform === 'outlook') {
        const targetOcc = scheduledDatesList[0];
        const { outlook } = getCalendarLinks(ficheForReminderModal.title, targetOcc.date);
        window.open(outlook, '_blank');
        triggerToast("Redirection Outlook activée !", "success");
      } else if (platform === 'apple') {
        downloadIcsFile(ficheForReminderModal.title, scheduledDatesList);
        triggerToast("Fichier .ics disponible !", "success");
      }

      setFicheForReminderModal(null);
    };

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 text-slate-800 animate-slideDown max-h-[90vh] flex flex-col">
          
          <div className="bg-gradient-to-r from-pink-600 to-orange-500 text-white p-5 pr-12 relative shrink-0">
            <h3 className="font-extrabold text-base md:text-lg flex items-center gap-1.5">
              📅 Planifier des Rappels de Révision
            </h3>
            <p className="text-xs text-pink-50 leading-relaxed mt-1">
              Cours : <strong className="text-white">"{ficheForReminderModal.title}"</strong>
            </p>
            <button
              onClick={() => setFicheForReminderModal(null)}
              className="absolute top-4 right-4 text-white hover:text-pink-100 font-extrabold text-lg"
            >
              ✕
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
            
            <div className="p-3 bg-pink-50 border border-pink-100 rounded-2xl text-[11px] text-pink-850 space-y-1">
              <span className="font-black text-pink-700 uppercase block tracking-wider">💡 BIENVENUE MATHILDE :</span>
              <p className="leading-relaxed">
                Le système arrondit votre cours à l'heure supérieure. Ex : Vous étudiez à <strong>08h20</strong> &rarr; début théorique (J0) planifié à <strong>09h00</strong>.
              </p>
            </div>

            <div className="flex gap-2.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setReminderType('spaced')}
                className={`flex-1 py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  reminderType === 'spaced' 
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔄 Repétition Espacée J+3...90
              </button>
              <button
                type="button"
                onClick={() => {
                  setReminderType('custom');
                  if (!customDateValue) {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    tom.setMinutes(0,0,0);
                    tom.setHours(9);
                    setCustomDateValue(tom.toISOString().substring(0, 16));
                  }
                }}
                className={`flex-1 py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                  reminderType === 'custom' 
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Rappel Unique
              </button>
            </div>

            {reminderType === 'spaced' ? (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-[10.5px]">
                <span className="text-[10px] font-extrabold text-[#EA4335] uppercase tracking-widest block border-b border-slate-150 pb-1">
                  CALCUL DES PROCHAINES RÉVISIONS (MÉTHODE DES J) :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-1.5 px-2 bg-pink-50 rounded-md border border-pink-150 text-pink-800 font-bold">
                    <span>J0 (Aujourd'hui) :</span>
                    <span>{j0Str.split(' ')[1]}</span>
                  </div>
                  {generatedDates.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-1.5 px-2 bg-slate-100 rounded-md border border-slate-150">
                      <span className="font-bold">{item.label} :</span>
                      <span className="font-mono text-slate-550">{item.dateStr.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
                  Date et heure :
                </label>
                <input
                  type="datetime-local"
                  value={customDateValue}
                  onChange={(e) => setCustomDateValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800"
                />
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-[10px] uppercase font-black tracking-widest text-pink-650 block">
                Intégration instantanée dans votre calendrier habituel :
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => saveAndExport('google')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-101"
                >
                  🌐 Google Cal.
                </button>
                <button
                  type="button"
                  onClick={() => saveAndExport('ics')}
                  className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-101 shadow-sm"
                >
                  🍏 Apple / macOS
                </button>
                <button
                  type="button"
                  onClick={() => saveAndExport('outlook')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-101"
                >
                  💻 MS Outlook
                </button>
                <button
                  type="button"
                  onClick={() => saveAndExport('ics')}
                  className="p-3 bg-slate-900 border border-slate-950 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-101"
                >
                  🤖 Android .ics
                </button>
              </div>
            </div>

          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center shrink-0">
            <button
              onClick={() => saveAndExport('ics')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-md"
            >
              Enregistrer hors-ligne & Télécharger iCal (.ics) 💾
            </button>
          </div>

        </div>
      </div>
    );
  };

  if (immersiveFiche) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden md:text-sm">
        {/* Toast popup */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white p-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-slideUp font-medium">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Google Colors strip */}
        <div className="w-full h-1.5 flex shrink-0">
          <div className="w-1/4 h-full bg-[#4285F4]" />
          <div className="w-1/4 h-full bg-[#EA4335]" />
          <div className="w-1/4 h-full bg-[#FBBC05]" />
          <div className="w-1/4 h-full bg-[#34A853]" />
        </div>

        {/* Universe Header Bar */}
        <header className="bg-slate-900 p-4 px-6 md:px-8 flex items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setUrlFicheId(null);
              }}
              className="p-2 border border-slate-700 bg-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Retourner au tableau de bord général"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap pb-0.5">
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#4285F4] bg-[#4285F4]/10 px-2 py-0.5 rounded border border-[#4285F4]/20 shrink-0">
                  🌌 UNIVERS IMMERSIF — SUJET {immersiveFiche.id}
                </span>
                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wide ${getTopicBadgeStyle(immersiveFiche.topic)}`}>
                  {immersiveFiche.topic}
                </span>
              </div>
              <h1 className="text-sm md:text-base lg:text-lg font-black text-white truncate max-w-lg mt-0.5" title={immersiveFiche.title}>
                {immersiveFiche.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setUrlFicheId(null);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow hover:scale-101 active:scale-99 transition-all cursor-pointer"
            >
              🏠 Dashboard
            </button>
          </div>
        </header>

        {/* Three-Column Workspace Layout */}
        <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch overflow-y-auto">
          
          {/* Left Column (Subject Metadata & Planning) - Spans 4 columns */}
          <section className="xl:col-span-4 flex flex-col gap-6">
            
            {/* Card A: Quick Info & Status Synchronizer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="text-xl">📋</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Statuts de validation</h3>
              </div>

              {/* Status Zone indicators for Space A, B, C */}
              <div className="grid grid-cols-1 gap-3.5">
                {/* Zone A */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-black tracking-wider text-[#4285F4] uppercase">Zone A — Auto-Évaluation</span>
                  <div className="flex items-center gap-2 mt-1 justify-between">
                    <select
                      value={immersiveFiche.status1}
                      onChange={(e) => {
                        const val = e.target.value as FicheStatus;
                        setFiches(prev => prev.map(f => f.id === immersiveFiche.id ? { ...f, status1: val } : f));
                      }}
                      className={`text-xs font-bold rounded-lg p-1.5 px-3 border outline-none bg-slate-900 text-slate-100 cursor-pointer ${
                        immersiveFiche.status1 === 'Fait' ? 'border-emerald-500 text-emerald-400' : immersiveFiche.status1 === 'En cours' ? 'border-yellow-500 text-yellow-400' : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <option value="A faire">⭕ A faire</option>
                      <option value="En cours">⏳ En cours</option>
                      <option value="Fait">✔ Fait</option>
                    </select>
                    <span className="text-[10px] font-mono text-slate-400">{immersiveFiche.date1 || "Date non définie"}</span>
                  </div>
                </div>

                {/* Zone B */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-black tracking-wider text-[#EA4335] uppercase">Zone B — Réponses Client & Jury</span>
                  <div className="flex items-center gap-2 mt-1 justify-between">
                    <select
                      value={immersiveFiche.status2}
                      onChange={(e) => {
                        const val = e.target.value as FicheStatus;
                        setFiches(prev => prev.map(f => f.id === immersiveFiche.id ? { ...f, status2: val } : f));
                      }}
                      className={`text-xs font-bold rounded-lg p-1.5 px-3 border outline-none bg-slate-900 text-slate-100 cursor-pointer ${
                        immersiveFiche.status2 === 'Fait' ? 'border-emerald-500 text-emerald-400' : immersiveFiche.status2 === 'En cours' ? 'border-yellow-500 text-yellow-400' : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <option value="A faire">⭕ A faire</option>
                      <option value="En cours">⏳ En cours</option>
                      <option value="Fait">✔ Fait</option>
                    </select>
                    <span className="text-[10px] font-mono text-slate-400">{immersiveFiche.date2 || "Date non définie"}</span>
                  </div>
                </div>

                {/* Zone C */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-black tracking-wider text-[#34A853] uppercase">Zone C — Compétences Communes</span>
                  <div className="flex items-center gap-2 mt-1 justify-between">
                    <select
                      value={immersiveFiche.status3 || 'A faire'}
                      onChange={(e) => {
                        const val = e.target.value as FicheStatus;
                        setFiches(prev => prev.map(f => f.id === immersiveFiche.id ? { ...f, status3: val } : f));
                      }}
                      className={`text-xs font-bold rounded-lg p-1.5 px-3 border outline-none bg-slate-900 text-slate-100 cursor-pointer ${
                        (immersiveFiche.status3 || 'A faire') === 'Fait' ? 'border-emerald-500 text-emerald-400' : (immersiveFiche.status3 || 'A faire') === 'En cours' ? 'border-yellow-500 text-yellow-400' : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <option value="A faire">⭕ A faire</option>
                      <option value="En cours">⏳ En cours</option>
                      <option value="Fait">✔ Fait</option>
                    </select>
                    <span className="text-[10px] font-mono text-slate-400">{immersiveFiche.date3 || "Date non définie"}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Card B: Action immédiate */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="text-xl">⚡</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Action immédiate</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-850 p-3 rounded-xl font-medium">
                {immersiveFiche.action}
              </p>
              {immersiveFiche.motorsLink && (
                <a
                  href={immersiveFiche.motorsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 py-2.5 bg-gradient-to-r from-teal-500 to-[#34A853] hover:from-teal-600 hover:to-[#2d934b] text-white font-black text-xs text-center rounded-xl uppercase tracking-widest transition-transform hover:scale-101 shadow-sm shrink-0"
                >
                  🚀 Lancer l'Action M-Motors
                </a>
              )}
            </div>

            {/* Card C: Planificateur Spaced Repetitions (Specific to this card) */}
            {(() => {
              const ficheReminder = reminders.find(r => r.ficheId === immersiveFiche.id);
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Rappels de Révision</h3>
                    </div>
                    {!ficheReminder && (
                      <button
                        onClick={() => setFicheForReminderModal(immersiveFiche)}
                        className="px-2 py-1 bg-blue-605 hover:bg-blue-700 text-white rounded-lg text-[9.5px] font-extrabold uppercase tracking-widest cursor-pointer shadow-md select-none shrink-0"
                      >
                        Programmer
                      </button>
                    )}
                  </div>

                  {ficheReminder ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-black text-slate-400 uppercase font-mono bg-slate-950/40 p-1.5 px-3 rounded-lg border border-slate-850">
                        <span>Base: {ficheReminder.baseDate}</span>
                        <button
                          onClick={() => {
                            setReminders(prev => prev.filter(r => r.id !== ficheReminder.id));
                            triggerToast("Rappels supprimés pour cette fiche ♻️", "info");
                          }}
                          className="text-red-400 hover:text-red-500 text-[9px] uppercase cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1 border-0">
                        {ficheReminder.scheduledDates.map((d, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setReminders(prev => prev.map(rem => {
                                if (rem.id === ficheReminder.id) {
                                  const updatedDates = [...rem.scheduledDates];
                                  updatedDates[index] = { ...updatedDates[index], completed: !updatedDates[index].completed };
                                  return { ...rem, scheduledDates: updatedDates };
                                }
                                return rem;
                              }));
                              triggerToast(d.completed ? "Rappel marqué non-vu" : "Point d'étape révisé ! 🎉");
                            }}
                            className={`p-2.5 rounded-xl border text-[10.5px] text-left transition-all relative flex flex-col gap-0.5 cursor-pointer leading-tight ${
                              d.completed 
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                                : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:bg-slate-950/50 hover:border-slate-700'
                            }`}
                          >
                            <span className="font-extrabold text-[9px] tracking-wider uppercase opacity-65">{d.label}</span>
                            <span className="font-mono text-[10.5px]">{d.date}</span>
                            <span className="absolute bottom-1.5 right-2 text-xs">{d.completed ? '🟢' : '⚪'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl text-xs text-slate-400 italic">
                      Aucun rappel de révision programmé. Améliorez votre rétention grâce à l'algorithme des paliers de mémoire !
                    </div>
                  )}
                </div>
              );
            })()}

          </section>

          {/* Middle Column (Interactive Resource Hub + Player) - Spans 5 columns */}
          <section className="xl:col-span-5 flex flex-col gap-6">
            
            {/* Media Hub Player & Tab Controller */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl flex-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Ressources & Supports</h3>
                </div>
                {/* Dynamic Progress Badge */}
                {(() => {
                  const rList = getFicheResources(immersiveFiche);
                  const totalR = rList.length;
                  const rSeen = rList.filter(r => !!seenResources[immersiveFiche.id]?.[r.key]).length;
                  const seenPct = totalR > 0 ? Math.round((rSeen / totalR) * 100) : 0;
                  return (
                    <span className="text-[10px] font-black tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase font-mono">
                      Supports vus: {rSeen}/{totalR} ({seenPct}%)
                    </span>
                  );
                })()}
              </div>

              {/* List of active resource links */}
              <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {(() => {
                  const rList = getFicheResources(immersiveFiche);
                  if (immersiveFiche.studi && immersiveFiche.studi.trim() !== '') {
                    if (!rList.some(r => r.key === 'studi')) {
                      rList.push({
                        key: 'studi',
                        type: 'studi',
                        name: "Plateforme d'études Studi",
                        url: immersiveFiche.studi,
                        zone: 'C'
                      });
                    }
                  }

                  if (rList.length === 0) {
                    return (
                      <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-950/30 rounded-xl border border-dashed border-slate-850">
                        Aucun document ou fichier de support pour ce sujet.
                      </div>
                    );
                  }

                  return rList.map((r, rIdx) => {
                    const isSeen = !!seenResources[immersiveFiche.id]?.[r.key];
                    const seenAt = seenResources[immersiveFiche.id]?.[r.key];
                    const isSelected = selectedResourceForPreview && selectedResourceForPreview.ficheId === immersiveFiche.id && selectedResourceForPreview.resourceKey === r.key;

                    return (
                      <div
                        key={rIdx}
                        className={`p-3 rounded-xl border transition-all flex flex-col gap-3 ${
                          isSelected 
                            ? 'bg-blue-950/30 border-blue-500/55' 
                            : 'bg-slate-950/45 border-slate-850 hover:border-slate-700 hover:bg-slate-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setSelectedResourceForPreview({
                                title: immersiveFiche.title,
                                resourceName: r.name,
                                url: r.url,
                                type: r.type,
                                ficheId: immersiveFiche.id,
                                resourceKey: r.key
                              });
                            }}
                            className="flex-1 text-left flex items-start gap-2 cursor-pointer group select-none min-w-0"
                          >
                            <span className="text-sm pt-0.5">
                              {r.type === 'audio' ? '🔊' : r.type === 'video' ? '📺' : r.type === 'slide' ? '📊' : r.type === 'image' ? '🖼️' : r.type === 'studi' ? '🎓' : r.type === 'nblm' ? '📓' : '📝'}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                                {r.name}
                              </span>
                              <span className={`text-[8.5px] uppercase font-mono font-black mt-0.5 tracking-wider px-1.5 py-0.25 rounded border self-start ${
                                r.zone === 'A' ? 'text-[#4285F4] bg-[#4285F4]/10 border-[#4285F4]/15' : r.zone === 'B' ? 'text-[#EA4335] bg-[#EA4335]/10 border-[#EA4335]/15' : 'text-[#34A853] bg-[#34A853]/10 border-[#34A853]/15'
                              }`}>
                                Zone {r.zone === 'common' ? 'Commune' : r.zone}
                              </span>
                            </div>
                          </button>

                          <button
                            onClick={() => handleToggleResourceSeen(immersiveFiche.id, r.key)}
                            className={`p-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border cursor-pointer select-none shrink-0 ${
                              isSeen ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400 border-slate-800'
                            }`}
                            title={isSeen ? `Assimilé le ${seenAt}` : "Marquer comme vu"}
                          >
                            {isSeen ? '✔ VU' : '✓ Marquer vu'}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Player Frame Container */}
              <div className="flex-1 mt-2.5 flex flex-col gap-2 min-h-[300px]">
                {selectedResourceForPreview && selectedResourceForPreview.ficheId === immersiveFiche.id ? (
                  <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-850 flex flex-col gap-2 relative">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2 text-[10.5px] font-black text-slate-400 uppercase font-mono">
                      <span className="truncate max-w-[250px]">{selectedResourceForPreview.resourceName}</span>
                      <button
                        onClick={() => setSelectedResourceForPreview(null)}
                        className="text-red-400 hover:text-red-500 uppercase text-[9px] cursor-pointer font-extrabold"
                      >
                        ✕ Fermer
                      </button>
                    </div>

                    {/* Display player content */}
                    <div className="flex-1 w-full bg-black rounded-lg overflow-hidden relative flex flex-col items-center justify-center min-h-[220px]">
                      {(() => {
                        const url = selectedResourceForPreview.url;
                        const ytEmbed = getYoutubeEmbedUrl(url);
                        const isDirectVideo = isDirectVideoUrl(url) || selectedResourceForPreview.type === 'video';
                        const driveEmbed = getDriveEmbedUrl(url);

                        if (isDirectVideo) {
                          return (
                            <video 
                              src={url} 
                              className="w-full h-full max-h-[320px] bg-black object-contain" 
                              controls 
                              controlsList="nodownload"
                              onContextMenu={(e) => e.preventDefault()}
                              autoPlay 
                              playsInline
                            />
                          );
                        }

                        if (ytEmbed) {
                          return (
                            <iframe 
                              src={ytEmbed} 
                              className="w-full h-full absolute top-0 left-0 border-0 bg-slate-900" 
                              allow="autoplay; encrypted-media; picture-in-picture"
                              allowFullScreen
                              title="YouTube Live Player"
                            />
                          );
                        }

                        if (driveEmbed) {
                          return (
                            <iframe 
                              src={driveEmbed} 
                              className="w-full h-full absolute top-0 left-0 border-0 bg-slate-900" 
                              allow="autoplay; encrypted-media"
                              title="Drive Document Viewer"
                            />
                          );
                        }

                        if (selectedResourceForPreview.type === 'audio') {
                          return (
                            <div className="p-5 flex flex-col items-center justify-center gap-4 w-full h-full text-center">
                              <span className="text-4xl animate-bounce">🎵</span>
                              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Écoute active du support</h4>
                              <audio 
                                src={url} 
                                controls 
                                className="w-full max-w-sm mt-1 focus:outline-none" 
                                autoPlay
                              />
                            </div>
                          );
                        }

                        return (
                          <div className="p-6 text-center text-slate-400">
                            <span className="text-3xl block mb-2">⚠️</span>
                            <h5 className="font-bold text-xs text-slate-100 uppercase tracking-wider">Aperçu en iFrame non disponible</h5>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10.5px] uppercase tracking-wider shadow"
                            >
                              Ouvrir le document externe ↗
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-950/30 rounded-xl border border-dashed border-slate-850 flex flex-col items-center justify-center text-center p-6 text-slate-450">
                    <span className="text-4xl mb-2">📁</span>
                    <p className="text-xs max-w-sm font-medium">Sélectionnez un document, une vidéo, ou un fichier audio de support ci-dessus pour charger l'Aperçu Interactif.</p>
                  </div>
                )}
              </div>

            </div>
            
          </section>

          {/* Right Column (Study Atmosphere & Audio TTS Reader) - Spans 3 columns */}
          <section className="xl:col-span-3 flex flex-col gap-6">
            
            {/* Card D: Soundscapes Focus Atmosphere */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 text-lg">🔊</span>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Atmosphère d'Étude</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { key: 'rain', name: 'Pluie relaxante 🌧️' },
                  { key: 'waves', name: 'Brise marine 🌊' },
                  { key: 'birds', name: 'Fascinants oiseaux 🕊️' },
                  { key: 'fire', name: 'Feu crépitant 🔥' }
                ].map(sound => {
                  const state = ambientSounds[sound.key];
                  return (
                    <div key={sound.key} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex flex-col gap-2 hover:bg-slate-950 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-widest">{sound.name}</span>
                        <button
                          onClick={() => handleToggleAmbientSound(sound.key)}
                          className={`p-1 px-2.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider cursor-pointer ${
                            state?.playing 
                              ? 'bg-[#34A853]/20 border border-[#34A853]/30 text-emerald-400 ring-2 ring-emerald-500/20' 
                              : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-750'
                          }`}
                        >
                          {state?.playing ? 'ACTIF ON' : 'ACTIVER'}
                        </button>
                      </div>
                      {state?.playing && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-400 uppercase font-mono">Vol</span>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={state.volume}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setAmbientSounds(prev => {
                                const nextState = {
                                  ...prev,
                                  [sound.key]: { ...prev[sound.key], volume: val }
                                };
                                if (audioRefs.current[sound.key]) {
                                  audioRefs.current[sound.key]!.volume = val;
                                }
                                return nextState;
                              });
                            }}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <span className="text-[9px] font-mono text-slate-300 w-6 text-right">{Math.round(state.volume * 100)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card E: Synthesis Text-To-Speech Reader built directly inside column */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl col-span-1">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="text-xl">🗣️</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Lecture Synthèse Vocale</h3>
              </div>
              
              <p className="text-[10.5px] text-slate-400 leading-normal italic">
                Vous pouvez générer et écouter le cours synthétique M-Motors de cette fiche à voix haute grâce à notre assistant de lecture intégré. 
              </p>

              <button
                onClick={() => setSelectedSpeechFiche(immersiveFiche)}
                className="mt-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-705 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5 transition-transform hover:scale-101 shrink-0"
              >
                <Volume2 className="w-4 h-4" /> Activer Synthesiser 🔊
              </button>
            </div>

          </section>
          
        </main>
        
        {/* Footer of Immersive Space */}
        <footer className="p-3.5 bg-slate-950 border-t border-slate-850 text-center text-[10px] text-slate-500 font-mono tracking-wide mt-auto shrink-0">
          © 2026 M-Motors Study Space • Tous vos progrès sont synchronisés en temps réel dans votre navigateur.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 pb-16 font-sans">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white p-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-slideUp font-medium">
          <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* FULLSCREEN FOCUS READER (QUI MASQUE TOTALEMENT LE TABLEAU DE BORD POUR CONCENTRATION ABSOLUE) */}
      {isFullscreenPreview && selectedResourceForPreview && (
        <div className="fixed inset-0 z-50 bg-[#090d16] flex flex-col w-screen h-screen overflow-hidden animate-fadeIn select-none">
          {/* Top Control Bar with minimal futuristic branding for extreme focus */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-white/[0.05] text-white shrink-0 gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#4285F4] bg-[#4285F4]/10 px-2 py-0.5 rounded border border-[#4285F4]/15 shrink-0">
                🖥️ MODE CONCENTRATION TOTALE (PLEIN ÉCRAN)
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
              <h2 className="text-xs md:text-sm font-extrabold text-slate-100 truncate max-w-xs sm:max-w-md lg:max-w-2xl" title={selectedResourceForPreview.resourceName}>
                {selectedResourceForPreview.resourceName}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Seen Toggle */}
              {selectedResourceForPreview.resourceKey && (() => {
                const rKey = selectedResourceForPreview.resourceKey;
                const isSeen = !!(seenResources[selectedResourceForPreview.ficheId]?.[rKey]);
                const seenAt = seenResources[selectedResourceForPreview.ficheId]?.[rKey];
                return (
                  <button
                    onClick={() => handleToggleResourceSeen(selectedResourceForPreview.ficheId, rKey)}
                    className={`p-1.5 px-3 rounded-lg transition-all text-[11px] flex items-center gap-1.5 font-bold border cursor-pointer select-none shadow-sm ${
                      isSeen
                        ? 'bg-[#34A853] text-white border-[#34A853] hover:bg-emerald-600'
                        : 'bg-white/5 hover:bg-white/10 text-slate-350 border-white/[0.08]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isSeen ? `✓ Vu le ${seenAt}` : "Marquer comme VU / LU 👁️"}</span>
                  </button>
                );
              })()}

              <button
                onClick={() => {
                  setIsFullscreenPreview(false);
                  triggerToast("🗂️ Retour au Tableau de Bord de l'App", "info");
                }}
                className="p-1.5 px-4 bg-red-650 hover:bg-red-750 text-white rounded-lg transition-all text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5"
                title="Quitter le mode plein écran pour retrouver le tableau de bord"
              >
                <span>✕ Quitter le Plein Écran</span>
              </button>
            </div>
          </div>

          {/* Core Content Viewer (Stretching fully and fluidly to utilize 100% of the screen space) */}
          <div className="flex-1 w-full bg-black p-2 sm:p-4 flex items-center justify-center overflow-hidden">
            {(() => {
              const url = selectedResourceForPreview.url;
              const ytEmbed = getYoutubeEmbedUrl(url);
              const isDirectVideo = isDirectVideoUrl(url) || selectedResourceForPreview.type === 'video';
              const driveEmbed = getDriveEmbedUrl(url);

              if (isDirectVideo) {
                return (
                  <video 
                    src={url} 
                    className="w-full h-full max-h-full bg-black object-contain focus:outline-none rounded-xl border border-white/[0.05]" 
                    controls 
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    autoPlay 
                    playsInline
                  />
                );
              }

              if (ytEmbed) {
                return (
                  <iframe 
                    src={ytEmbed} 
                    className="w-full h-full border-0 bg-slate-950 rounded-xl" 
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="YouTube Fullscreen Preview"
                  />
                );
              }

              if (driveEmbed) {
                return (
                  <iframe 
                    src={driveEmbed} 
                    className="w-full h-full border-0 bg-slate-950 rounded-xl" 
                    allow="autoplay; encrypted-media"
                    title="Google Drive Document Fullscreen Preview"
                  />
                );
              }

              return (
                <div className="p-8 text-center text-slate-300 bg-slate-900 rounded-3xl border border-white/[0.05] flex flex-col items-center justify-center max-w-md shadow-2xl">
                  <span className="text-4xl mb-3">⚠️</span>
                  <h5 className="font-bold text-base text-slate-100">Intégration directe non supportée</h5>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">Ce fichier externe requiert une authentification dans votre navigateur ou ne permet pas l'inclusion en iFrame.</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer" 
                    className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    Ouvrir dans un nouvel onglet <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Styled Top Branding Google colors bar */}
      <div className="w-full h-2 flex">
        <div className="w-1/4 h-full bg-[#4285F4]" />
        <div className="w-1/4 h-full bg-[#EA4335]" />
        <div className="w-1/4 h-full bg-[#FBBC05]" />
        <div className="w-1/4 h-full bg-[#34A853]" />
      </div>

      {/* Hero Banner Header - Perfect Bento Grid block with three dots controller */}
      <header className="bg-white rounded-3xl p-6 mt-6 max-w-7xl mx-auto shadow-sm border-b-4 border-blue-500 relative overflow-hidden px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Bento dynamic three circle markers */}
          <div className="flex items-center gap-1.5 mb-3.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="https://projettechacademy.github.io/Projet_Python/Asset/2127845D-F95D-49C0-A22B-88C07817841B.png" 
                alt="Logo PAIA Header" 
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-150 shadow-sm shrink-0 hidden sm:block hover:scale-105 transition-all duration-300" 
              />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-[#4285F4]/10 text-[#4285F4] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-[#4285F4]/20 animate-pulse">
                    <Flame className="w-3.5 h-3.5" /> Dossier M-Motors
                  </span>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Python B3 Module</span>
                </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Suivi de Progression : Zone Évaluation vs Jury 🎓🏁
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Comparez, révisez et gérez vos fiches de cours à double objectifs: 
                <span className="font-semibold text-blue-600"> Zone A (Vos progrès)</span> et 
                <span className="font-semibold text-red-650"> Zone B (Avis & Réponses Jury)</span> sur le même tableau.
              </p>
            </div>
          </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowSyncPanel(!showSyncPanel)}
                className={`p-3 px-5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2 border ${
                  showSyncPanel 
                    ? 'bg-slate-900 text-white border-slate-950' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:shadow'
                }`}
              >
                <Download className="w-4 h-4 shrink-0 text-[#FBBC05]" />
                {showSyncPanel ? 'Fermer Panel Synth' : 'Importer de Google Sheets 🔄'}
              </button>

              <button
                onClick={resetAllProgress}
                title="Remettre à zéro"
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition-all border border-slate-200 hover:shadow"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Dynamic Sync Input Frame if enabled */}
        {showSyncPanel && (
          <div className="mb-8">
            <CsvLoader 
              onDataLoaded={(fetched) => {
                setFiches(fetched);
                setShowSyncPanel(false);
              }} 
              currentCount={fiches.length} 
              currentList={fiches}
            />
          </div>
        )}

        {/* INTERACTIVE COMPANION & DISPLAY TOGGLE */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 mb-8 shadow-xl border border-indigo-500/30 overflow-hidden relative animate-fadeIn">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20 anim-pulse"></div>
          
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  Guide d'Études & Mode d'Affichage Interactif
                </h4>
                <p className="text-[10px] sm:text-xs text-indigo-200">
                  Comprendre les Zones d'évaluation, le programme des fiches et basculer à la volée !
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuideOpen(!guideOpen)}
                className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white/95 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-white/10 active:scale-95"
              >
                {guideOpen ? "Masquer le guide ⬆️" : "Afficher le guide ⬇️"}
              </button>
            </div>
          </div>

          {guideOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300 leading-relaxed mb-4">
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/20 rounded-2xl">
                <p className="font-extrabold text-blue-400 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="text-sm">🎯</span> Zone A: Moi (Vos Progrès)
                </p>
                <p className="text-[11px] text-slate-350">
                  Fiches associées à votre progression personnelle. {showAllUnderZones ? "Actuellement configuré pour afficher" : "Filtré pour n'afficher que"} les <strong>{showAllUnderZones ? "154" : "45"}</strong> cours et livrables d'examen requis.
                </p>
              </div>
              
              <div className="p-3.5 bg-red-950/45 border border-red-500/20 rounded-2xl">
                <p className="font-extrabold text-red-400 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="text-sm">⚖️</span> Zone B: Jury (Réponses Jury)
                </p>
                <p className="text-[11px] text-slate-350">
                  Fiches représentant les livrables que le jury va évaluer. Corrèle directement avec les critères d'examen du dossier de soutenance.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl">
                <p className="font-extrabold text-emerald-400 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="text-sm">🌐</span> Zone C: Commune (154 cours)
                </p>
                <p className="text-[11px] text-slate-350">
                  Tracé transversal neutre complet. Contient l'intégralité absolue du cours Flask, Python et bases de données pour M-Motors.
                </p>
              </div>
            </div>
          )}

          {/* CHANGER LE MODE D'AFFICHAGE EN DIRECT */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.04] p-4 rounded-2xl border border-white/5 mt-2">
            <div className="flex flex-col gap-0.5 max-w-lg">
              <p className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                ⚙️ Ajustement dynamique du filtre de Zone A & B :
              </p>
              <p className="text-[11px] text-slate-300">
                Préférez-vous n'afficher que les <strong>45 fiches livrables prioritaires d'examen</strong> ou voir <strong>l'intégralité du programme (154 fiches)</strong> dans vos zones d'évaluation ? (Sélectionnez votre choix ci-contre)
              </p>
            </div>
            
            <div className="flex gap-2 shrink-0 bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
              <button
                onClick={() => {
                  setShowAllUnderZones(false);
                  triggerToast("Filtre activé : 45 fiches prioritaires d'examen uniquement ! 📝", "success");
                }}
                className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  !showAllUnderZones
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow font-black scale-102"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📝 Évaluations (45)
              </button>
              <button
                onClick={() => {
                  setShowAllUnderZones(true);
                  triggerToast("Filtre désactivé : Toutes les 154 fiches affichées partout ! 📂", "success");
                }}
                className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  showAllUnderZones
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow font-black scale-102"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📂 Tout afficher (154)
              </button>
            </div>
          </div>
        </div>

        {/* 1. OVERALL STATS BENTO BOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 col-spa-3">
          
          {/* Card 1: Main Metric Selector - Zone A Progress */}
          <ThreeDBox themeColor="blue" className="flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-600 font-mono">
                  Zone A • Mes Évaluations
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  Ma Réponse aux Besoins 📝
                </h4>
              </div>
              <Compass className="w-7 h-7 text-blue-500" />
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-950">{stats1.pct}%</span>
                <span className="text-xs text-slate-500">de fiches validées</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3 border border-slate-200">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats1.pct}%` }}
                />
              </div>
              <div className="mt-2.5">
                {stats1.pct === 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    👑 Perfection Absolue !
                  </span>
                ) : stats1.pct >= 75 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-indigo-700 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    ✨ Excellent travail, presque au bout !
                  </span>
                ) : stats1.pct >= 40 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    ⚡ Bonne dynamique, continuez !
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-slate-600 bg-slate-500/10 px-2.5 py-1 rounded-lg border border-slate-500/20">
                    🌱 Échauffement, lancez les fiches !
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400">Terminées ✔</p>
                <p className="text-sm font-extrabold text-[#34A853]">{stats1.fait} fiches</p>
              </div>
              <div>
                <p className="text-slate-400">Reste 💤</p>
                <p className="text-sm font-extrabold text-[#EA4335]">{stats1.faire} fiches</p>
              </div>
              <div>
                <p className="text-slate-400">Travail ⏳</p>
                <p className="text-sm font-extrabold text-[#FBBC05]">{stats1.cours} fiches</p>
              </div>
            </div>
          </ThreeDBox>

          {/* Card 2: Main Metric Selector - Zone B Progress */}
          <ThreeDBox themeColor="red" className="flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-red-600 font-mono">
                  Zone B • Réponses Soutenance
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  Exigences du Jury ⚖️
                </h4>
              </div>
              <GraduationCap className="w-7 h-7 text-red-500" />
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-950">{stats2.pct}%</span>
                <span className="text-xs text-slate-500">conformes aux avis</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3 border border-slate-200">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats2.pct}%` }}
                />
              </div>
              <div className="mt-2.5">
                {stats2.pct === 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    👑 Conformité jury à 100% !
                  </span>
                ) : stats2.pct >= 75 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-[#EA4335] bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                    🎖️ Excellente préparation jury !
                  </span>
                ) : stats2.pct >= 40 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    ⚡ Intégration jury en cours !
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-slate-600 bg-slate-500/10 px-2.5 py-1 rounded-lg border border-slate-500/20">
                    📖 En attente d'audit pour le Jury !
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400">Audités ✔</p>
                <p className="text-sm font-extrabold text-[#34A853]">{stats2.fait} fiches</p>
              </div>
              <div>
                <p className="text-slate-400">À faire 💤</p>
                <p className="text-sm font-extrabold text-[#EA4335]">{stats2.faire} fiches</p>
              </div>
              <div>
                <p className="text-slate-400">En cours ⏳</p>
                <p className="text-sm font-extrabold text-[#FBBC05]">{stats2.cours} fiches</p>
              </div>
            </div>
          </ThreeDBox>

          {/* Card 3: Main Metric Selector - Zone C Progress */}
          <ThreeDBox themeColor="green" className="flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-600 font-mono">
                  Zone C • Tout le monde
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  Zone Commune 🌐
                </h4>
              </div>
              <BookOpen className="w-7 h-7 text-emerald-500" />
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-950">{stats3.pct}%</span>
                <span className="text-xs text-slate-500">de fiches validées</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3 border border-slate-200">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats3.pct}%` }}
                />
              </div>
              <div className="mt-2.5">
                {stats3.pct === 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    👑 Perfection commune !
                  </span>
                ) : stats3.pct >= 75 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-emerald-700 bg-emerald-505/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    ✨ Excellente synergie collective !
                  </span>
                ) : stats3.pct >= 40 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    ⚡ Progression solide !
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-slate-600 bg-slate-500/10 px-2.5 py-1 rounded-lg border border-slate-500/20">
                    📖 Prêt pour la coopération neutre !
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400">Neutral ✔</p>
                <p className="text-sm font-extrabold text-[#34A853]">{stats3.fait} fiches</p>
              </div>
              <div>
                <p className="text-slate-400">À faire 💤</p>
                <p className="text-sm font-extrabold text-[#EA4335]">{stats3.faire} fiches</p>
              </div>
              <div>
                <p className="text-slate-400">En cours ⏳</p>
                <p className="text-sm font-extrabold text-[#FBBC05]">{stats3.cours} fiches</p>
              </div>
            </div>
          </ThreeDBox>

        </div>

        {/* RESOURCE SEEN PROGRESSION DASHBOARD (MATHILDE'S PERSONAL TRACKER) */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-3xl border border-slate-800 shadow-xl mb-8 flex flex-col gap-5 text-white font-sans animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#4285F4] font-bold block">
                🎯 SUIVI DE PRISE DE CONNAISSANCE DE MATHILDE (VU/LU)
              </span>
              <h3 className="text-lg md:text-xl font-black text-slate-100 mt-1 flex items-center gap-2">
                📂 Progression des Supports par Matière, Bloc & Module
              </h3>
            </div>
            <div className="bg-emerald-500/10 px-4 py-1.5 rounded-2xl border border-emerald-500/20 text-right shrink-0">
              <span className="text-xs text-slate-400 block font-bold">Total Assimilé 👁️</span>
              <span className="text-xl font-black text-[#5fc480]">{resourceProgressStats.global.pct}%</span>
              <span className="text-[10px] text-slate-300 block font-mono">({resourceProgressStats.global.seen} / {resourceProgressStats.global.total} docs)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. PROGRESS BY SUBJECT */}
            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col gap-4">
              <h4 className="font-extrabold text-xs tracking-wider uppercase text-slate-300 flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
                📚 PAR MATIÈRE
              </h4>
              <div className="flex flex-col gap-3.5 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                {(Object.entries(resourceProgressStats.byTopic) as [string, { total: number; seen: number; pct: number }][]).map(([topic, stat]) => (
                  <div key={topic} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="truncate max-w-[150px] sm:max-w-[180px] lg:max-w-[200px]" title={topic}>{topic}</span>
                      <span className="font-mono text-[#4285F4]">{stat.pct}% <span className="text-[10px] text-slate-450 font-normal">({stat.seen}/{stat.total})</span></span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/[0.05]">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          stat.pct === 100 ? 'bg-[#34A853]' : stat.pct >= 50 ? 'bg-[#FBBC05]' : 'bg-[#4285F4]'
                        }`}
                        style={{ width: `${stat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. PROGRESS BY BLOCK */}
            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col gap-4">
              <h4 className="font-extrabold text-xs tracking-wider uppercase text-slate-300 flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
                🧱 PAR BLOC D'ÉTUDE
              </h4>
              <div className="flex flex-col gap-3.5 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                {(Object.entries(resourceProgressStats.byBlock) as [string, { total: number; seen: number; pct: number }][])
                  .sort((a, b) => {
                    if (a[0] === 'Autre') return 1;
                    if (b[0] === 'Autre') return -1;
                    return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
                  })
                  .map(([block, stat]) => (
                    <div key={block} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>{block === 'Autre' ? 'Hors Blocs' : `Bloc ${block.replace('B', '')}`}</span>
                        <span className="font-mono text-[#4285F4]">{stat.pct}% <span className="text-[10px] text-slate-450 font-normal">({stat.seen}/{stat.total})</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/[0.05]">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            stat.pct === 100 ? 'bg-[#34A853]' : stat.pct >= 50 ? 'bg-[#FBBC05]' : 'bg-[#4285F4]'
                          }`}
                          style={{ width: `${stat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 3. PROGRESS BY MODULE */}
            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col gap-4">
              <h4 className="font-extrabold text-xs tracking-wider uppercase text-slate-300 flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
                📦 PAR MODULE
              </h4>
              <div className="flex flex-col gap-3.5 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                {(Object.entries(resourceProgressStats.byModule) as [string, { total: number; seen: number; pct: number }][])
                  .sort((a, b) => {
                    if (a[0] === 'Autre') return 1;
                    if (b[0] === 'Autre') return -1;
                    return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
                  })
                  .map(([mod, stat]) => (
                    <div key={mod} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>{mod === 'Autre' ? 'Autre' : `Module ${mod.replace('M', '')}`}</span>
                        <span className="font-mono text-[#4285F4]">{stat.pct}% <span className="text-[10px] text-slate-450 font-normal">({stat.seen}/{stat.total})</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/[0.05]">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            stat.pct === 105 || stat.pct === 100 ? 'bg-[#34A853]' : stat.pct >= 50 ? 'bg-[#FBBC05]' : 'bg-[#4285F4]'
                          }`}
                          style={{ width: `${stat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>

          <div className="bg-white/[0.03] p-3 text-xs rounded-xl border border-white/[0.05] text-slate-300 flex items-start gap-2 max-w-full leading-normal">
            <span className="text-base select-none shrink-0">💡</span>
            <p>
              <strong>Suivi autonome fusionné</strong> : Cochez l'icône cercle <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border border-slate-300 text-[8px] font-bold">✓</span> à gauche d'un document, ou cliquez sur le bouton de prise de connaissance dans le lisseur. Tout est croisé et calculé en direct, peu importe laquelle des 3 Zones est active !
            </p>
          </div>
        </div>

        {/* 2. DYNAMIC TREND TREND TRACKER CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-md border-b-4 border-[#4285F4] relative overflow-hidden ring-4 ring-[#4285F4]/5 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-4">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Taux de validation par modules (%)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Vue Comparée Zone A vs B</span>
            </div>
            
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value}%`]} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Zone A - Ma Progression (%)" fill="#4285F4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Zone B - Réponses Jury (%)" fill="#EA4335" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Zone C - Commun (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-md border-b-4 border-[#EA4335] relative overflow-hidden ring-4 ring-[#EA4335]/5 flex flex-col justify-between animate-fadeIn">
            <div className="pb-4 border-b border-slate-150">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800">
                🚀 Simulation de Soutenance
              </h3>
              <p className="text-xs text-slate-400 mt-1">Évolution temporelle estimée jusqu'à l'examen</p>
            </div>

            <div className="h-44 sm:h-48 my-3 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressTimelineData}>
                  <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" />
                  <Tooltip formatter={(v) => [`${v}%`]} />
                  <Line type="monotone" dataKey="Ma Réponse" name="Vos Progrès" stroke="#4285F4" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Retour Jury" name="Conformité Jury" stroke="#EA4335" strokeWidth={2.5} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="Zone C (Commun)" name="Tracés Communs" stroke="#10B981" strokeWidth={2.5} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#F0F2F5] rounded-2xl p-3.5 text-xs text-slate-600 border border-slate-200">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                📌 Astuce d'Évaluation :
              </p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Les cours communs sont groupés, les fiches à double extension (Audio 1 / Audio 2) sont séparées selon votre Zone active. Ajustez les statuts à la volée !
              </p>
            </div>
          </div>

        </div>

        {/* 3. SWITCH HUB ZONE: ACTIVATE USER INTERFACES */}
        <div className="w-full flex justify-center mb-8">
          <div className={`p-2 bg-slate-900 border-2 border-slate-950 rounded-full shadow-lg flex gap-2 w-full max-w-lg transition-all duration-300 ring-4 hover:scale-[1.01] ${
            activeZone === 'A' ? 'ring-blue-500/20' : activeZone === 'B' ? 'ring-red-500/20' : 'ring-emerald-500/20'
          }`}>
            <button
               onClick={() => {
                 setActiveZone('A');
                 triggerToast("Zone A activée : Ma Progression Personnelle 🎯", "info");
               }}
               className={`flex-1 py-2.5 px-4 rounded-full text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer transform active:scale-95 ${
                 activeZone === 'A'
                   ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                   : 'text-slate-400 hover:text-slate-200'
               }`}
            >
              <User className="w-4 h-4 shrink-0" />
              Zone A: Moi
            </button>
            <button
               onClick={() => {
                 setActiveZone('B');
                 triggerToast("Zone B activée : Livrables pour le Jury ⚖️", "info");
               }}
               className={`flex-1 py-2.5 px-4 rounded-full text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer transform active:scale-95 ${
                 activeZone === 'B'
                   ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
                   : 'text-slate-400 hover:text-slate-200'
               }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              Zone B: Jury
            </button>
            <button
               onClick={() => {
                 setActiveZone('C');
                 triggerToast("Zone C activée : Zone Commune Neutre 🌐", "info");
               }}
               className={`flex-1 py-2.5 px-4 rounded-full text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer transform active:scale-95 ${
                 activeZone === 'C'
                   ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                   : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              Zone C: Commune
            </button>
          </div>
        </div>

        {/* ESPACE CONCENTRATION ZEN & ÉLITE CLUB - MATHILDE'S PEPS GRADIENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto mb-8">
          
          {/* Card 1: Ambient Sound Instrumental Deck */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-1.5 bg-pink-500/10 text-pink-500 rounded-lg text-xs leading-none">🎧</span>
                  <h4 className="font-black text-xs uppercase text-slate-200 tracking-widest">Espace Concentration & Fond Sonore</h4>
                </div>
                <span className="text-[10px] text-pink-500 font-extrabold uppercase font-mono tracking-wider animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> Live Zen
                </span>
              </div>
              
              <p className="text-[10.5px] text-slate-400 leading-relaxed mb-4 font-medium">
                Écoutez un bruit blanc ou un son de la nature pour vous isoler et optimiser votre attention pendant l'étude. Activer plusieurs sons crée un mixage unique !
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'rain', name: 'Pluie Douce 🌧️' },
                  { key: 'waves', name: 'Vagues de Mer 🌊' },
                  { key: 'birds', name: 'Vent & Oiseaux 🌲' },
                  { key: 'fire', name: 'Feu Cheminée 🔥' }
                ].map(sound => {
                  const state = ambientSounds[sound.key];
                  return (
                    <div key={sound.key} className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col gap-1.5 transition-all hover:bg-white/[0.06]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-200 select-none truncate">
                          {sound.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleAmbientSound(sound.key)}
                          className={`p-1 px-2 text-[9px] font-black rounded-lg transition-all border shrink-0 cursor-pointer uppercase ${
                            state?.playing 
                              ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white border-transparent shadow shadow-pink-600/30' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {state?.playing ? 'ON 🔊' : 'OFF 🔇'}
                        </button>
                      </div>
                      
                      {state?.playing && (
                        <div className="flex items-center gap-1.5 pt-1 animate-fadeIn">
                          <span className="text-[8px] text-slate-505">Vol :</span>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05" 
                            value={state.volume} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setAmbientSounds(prev => ({
                                ...prev,
                                [sound.key]: { ...prev[sound.key], volume: val }
                              }));
                            }}
                            className="w-full h-1 accent-pink-500 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.04] mt-4 flex items-center justify-between text-[9px] text-slate-500">
              <span>💡 Les sons de fond se mélangent avec vos fichiers audio de cours.</span>
              <span>© Mathilde Zen Space</span>
            </div>
          </div>

          {/* Card 2: Community Elite Club Links */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-3xl border border-indigo-500/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs leading-none">💫</span>
                  <h4 className="font-black text-xs uppercase text-slate-200 tracking-widest">Le Club Élite & Divertissement</h4>
                </div>
                <span className="text-[10px] text-pink-400 font-extrabold uppercase font-mono tracking-wider tracking-widest">
                  PEP’S ENERGY ⚡
                </span>
              </div>

              <p className="text-[10.5px] text-slate-350 leading-relaxed mb-4 font-medium">
                Accédez directement aux serveurs communautaires et plateformes de partage pour briser l'isolement et booster votre apprentissage en joie !
              </p>

              <div className="flex flex-col gap-2.5">
                {/* Discord Elite Club Link */}
                <a 
                  href="https://discord.gg/cp3DQPkXdw" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3 bg-gradient-to-r from-indigo-600/60 to-[#5865F2]/80 hover:from-indigo-600 hover:to-[#5865F2] border border-indigo-500/20 text-white rounded-2xl flex items-center justify-between gap-3 shadow-md hover:scale-[1.01] transition-all cursor-pointer select-none group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-indigo-200 font-extrabold block tracking-wider uppercase">GROUPE DISCORD OFFICIEL :</span>
                    <h5 className="font-extrabold text-xs text-white truncate group-hover:underline">
                      La Villa des Codeurs Brisés 💔 🌴 Dev Elite Club
                    </h5>
                  </div>
                  <ExternalLink className="w-4 h-4 text-indigo-200 shrink-0" />
                </a>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Apple music */}
                  <a 
                    href="https://music.apple.com/fr/new" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-gradient-to-r from-pink-650 to-rose-650 text-white rounded-2xl flex items-center justify-between gap-2 shadow hover:opacity-95 transition-all text-[11px] font-black cursor-pointer select-none"
                  >
                    <span>🍎 Apple Music</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/85 shrink-0" />
                  </a>

                  {/* YouTube Playlist */}
                  <a 
                    href="https://www.youtube.com/watch?v=mvbM-LauoqQ&list=PLn-G6Zl1XH-W6JOtQ3YNpgXW2qx7ig_oF" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-gradient-to-r from-red-650 to-orange-655 text-white rounded-2xl flex items-center justify-between gap-2 shadow hover:opacity-95 transition-all text-[11px] font-black cursor-pointer select-none"
                  >
                    <span>📺 Playlist YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/85 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-500 pt-3 border-t border-white/[0.04] mt-4 font-mono">
              ⚡ Rejoignez l'élite des codeurs pour échanger sur le devoir M-Motors.
            </p>
          </div>

        </div>

        {/* INTERACTIVE STICKY MEMO STICKERS BOARD */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 sm:p-6 rounded-3xl border border-slate-205/80 mb-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h4 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
              <span className="text-xl">📌</span> Tableau de Bord des Post-it Mémos
            </h4>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono bg-white px-2 py-0.5 rounded-full border border-slate-150">
              Notes Autocollantes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Note Creator Left section */}
            <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-705">Créer un nouveau Post-it :</p>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Rédigez votre pense-bête, formule, ou rappel d'examen..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 resize-none font-medium"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold">Couleur :</span>
                  <div className="flex items-center gap-1">
                    {(['green', 'yellow', 'blue', 'pink'] as const).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewNoteColor(color)}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                          color === 'green' ? 'bg-emerald-300 border-emerald-400' :
                          color === 'yellow' ? 'bg-amber-200 border-amber-300' :
                          color === 'blue' ? 'bg-sky-200 border-sky-305' :
                          'bg-pink-300 border-pink-400'
                        } ${newNoteColor === color ? 'ring-2 ring-slate-800 scale-110' : 'opacity-80'}`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={addStickyNote}
                  className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105"
                >
                  Épingler 📌
                </button>
              </div>
            </div>

            {/* Sticky Notes Grid Right section */}
            <div className="md:col-span-8 flex flex-wrap gap-4 justify-start items-start">
              {stickyNotes.length === 0 ? (
                <div className="w-full text-center py-10 bg-white/40 border-2 border-dashed border-slate-205 rounded-2xl text-slate-400 text-xs italic">
                  Aucun sticker collé. Épinglez un mémorandum pour commencer !
                </div>
              ) : (
                stickyNotes.map(note => {
                  const getNoteBgColor = () => {
                    switch (note.color) {
                      case 'green':
                        return 'bg-[#E2F7E4] hover:bg-[#D5F3D8] border-[#A8E4B1] text-[#13521E]';
                      case 'yellow':
                        return 'bg-[#FFF9C4] hover:bg-[#FFF59D] border-[#FFF176] text-[#5D4037]';
                      case 'blue':
                        return 'bg-[#E3F2FD] hover:bg-[#BBDEFB] border-[#90CAF9] text-[#0D47A1]';
                      case 'pink':
                        return 'bg-[#FCE4EC] hover:bg-[#F8BBD0] border-[#F48FB1] text-[#880E4F]';
                      default:
                        return 'bg-[#FFF9C4] border-[#FFF176] text-[#5D4037]';
                    }
                  };

                  return (
                    <div
                      key={note.id}
                      className={`w-full sm:w-[220px] p-4 rounded-2xl border-b-4 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md transform rotate-[-0.5deg] hover:rotate-0 flex flex-col justify-between min-h-[110px] ${getNoteBgColor()}`}
                    >
                      {/* Note Header Anchor Pin */}
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/10 rounded-full border border-white/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                      </div>

                      {/* Content */}
                      <p className="text-xs font-extrabold leading-relaxed pt-2 break-words z-10 select-text">
                        {note.text}
                      </p>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-black/5 pt-2 mt-3 z-10 text-[9px] font-mono text-black/50">
                        <span className="font-extrabold">Mémo Perso 📝</span>
                        <button
                          onClick={() => deleteStickyNote(note.id)}
                          className="hover:text-red-750 hover:scale-105 transition-all font-black uppercase cursor-pointer text-slate-505 hover:underline"
                        >
                          Détacher
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. FILTERS AND SEARCH COMPONENT BOARD */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/80 mb-8 flex flex-col gap-4">
          
          {/* Top Row: Search + View Mode Toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            
            {/* Search inputs */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher N°, titre, devoir, action..."
                className="w-full bg-slate-50 border border-slate-250 focus:border-slate-800 rounded-2xl p-3 pl-11 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            {/* View Mode Switcher Selectors / Buttons */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto shadow-inner overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setViewMode('continue');
                  triggerToast("📋 Navigation en liste continue activée", "info");
                }}
                className={`flex-1 md:flex-none py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  viewMode === 'continue'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Liste Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('segmented');
                  triggerToast("🗂️ Navigation par Blocs & Modules activée", "info");
                }}
                className={`flex-1 md:flex-none py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  viewMode === 'segmented'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Par Blocs
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('planning');
                  triggerToast("📅 Planning des Répétitions Espacées & Rappels activé ⏳", "success");
                }}
                className={`flex-1 md:flex-none py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  viewMode === 'planning'
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow'
                    : 'text-slate-600 hover:text-pink-600 hover:bg-pink-100/40'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-current animate-bounce-subtle" />
                Planning & Rappels
              </button>
            </div>
            
          </div>

          {/* Middle Row: Thématique Filtering Slider */}
          <div className="w-full overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Filter className="w-3 h-3 text-indigo-500" /> Thème :</span>
              {topics.filter(t => t === 'All' || availableTopics.includes(t)).map(t => {
                const count = t === 'All' ? fichesFilteredOnlyByBlockAndModule.length : fichesFilteredOnlyByBlockAndModule.filter(f => f.topic === t).length;
                const isSelected = selectedTopic === t;
                
                const getAccentClass = () => {
                  if (!isSelected) return 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:scale-[1.02]';
                  switch (t) {
                    case 'HTML & CSS':
                      return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/10 border border-amber-400 rotate-1';
                    case 'Bootstrap':
                      return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/10 border border-purple-500 -rotate-1';
                    case 'Bases de Données':
                      return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/10 border border-blue-500 rotate-1';
                    case 'Python Backend':
                      return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/10 border border-emerald-505 -rotate-1';
                    case 'Python Quality & Flask':
                      return 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/10 border border-rose-500 rotate-1';
                    case 'APIs, Git & Sécurité':
                      return 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-505 border border-[#22d3ee] -rotate-1';
                    default:
                      return 'bg-slate-900 text-white shadow-md rotate-0';
                  }
                };

                return (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTopic(t);
                      triggerToast(`Thématique filtrée : ${t === 'All' ? 'Tous les cours' : t} 🌟`, "info");
                    }}
                    className={`p-1.5 px-3 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all duration-300 flex items-center gap-1.5 transform active:scale-95 border border-transparent ${getAccentClass()}`}
                  >
                    <span>{t === 'All' ? 'Tous 🗺️' : t}</span>
                    {resourceProgressStats.global && resourceProgressStats.global.total > 0 && t === 'All' && (
                      <span className={`text-[9.5px] font-bold px-1 rounded ${
                        isSelected ? 'bg-black/25 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      }`} title={`${resourceProgressStats.global.seen}/${resourceProgressStats.global.total} documents consultés`}>
                        👁️ {resourceProgressStats.global.pct}%
                      </span>
                    )}
                    {t !== 'All' && resourceProgressStats.byTopic[t] && resourceProgressStats.byTopic[t].total > 0 && (
                      <span className={`text-[9.5px] font-bold px-1 rounded ${
                        isSelected ? 'bg-black/25 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      }`} title={`${resourceProgressStats.byTopic[t].seen}/${resourceProgressStats.byTopic[t].total} documents consultés`}>
                        👁️ {resourceProgressStats.byTopic[t].pct}%
                      </span>
                    )}
                    <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full leading-none flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-205 text-slate-750'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Isolateurs par Blocs et Modules + Statut */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
            
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              
              {/* Block isolator */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-455 uppercase tracking-wide">Filtre Bloc :</span>
                <select
                  value={selectedBlock}
                  onChange={(e) => {
                    setSelectedBlock(e.target.value);
                    triggerToast(`Isolation Bloc: ${e.target.value === 'All' ? 'Tous les blocs' : e.target.value}`, "info");
                  }}
                  className="bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl p-1.5 px-3 text-xs text-slate-700 font-bold pointer focus:outline-none"
                >
                  <option value="All">Tous les blocs 📚</option>
                  {blocksList.filter(b => b !== 'All').map(block => (
                    <option key={block} value={block}>Bloc {block.replace('B', '')}</option>
                  ))}
                  <option value="Autre">Hors Blocs ⚓</option>
                </select>
              </div>

              {/* Module isolator */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-455 uppercase tracking-wide">Filtre Module :</span>
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    triggerToast(`Isolation Module: ${e.target.value === 'All' ? 'Tous les modules' : e.target.value}`, "info");
                  }}
                  className="bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl p-1.5 px-3 text-xs text-slate-700 font-bold pointer focus:outline-none"
                >
                  <option value="All">Tous les modules 🔖</option>
                  {modulesList.filter(m => m !== 'All').map(mod => (
                    <option key={mod} value={mod}>Module {mod.replace('M', '')}</option>
                  ))}
                  <option value="Autre">Hors Modules ⚓</option>
                </select>
              </div>

            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
              
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-455 uppercase tracking-wide">Statut :</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-202 focus:border-slate-800 rounded-xl p-1.5 px-3 text-xs text-slate-750 font-bold pointer focus:outline-none"
                >
                  <option value="All">Tout afficher 📊</option>
                  <option value="Fait">Fait ✔</option>
                  <option value="En cours">En cours ⏳</option>
                  <option value="A faire">À faire 💤</option>
                </select>
              </div>

              {/* Bulk actions check button */}
              {filteredFiches.length > 0 && (
                <button
                  onClick={() => markFilteredAsCompleted(filteredFiches)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1 pointer active:scale-95 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Tout cocher ({filteredFiches.length})
                </button>
              )}

            </div>

          </div>

        </div>

        {/* 5. MAIN CHECKLIST GRID SYSTEM */}
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 max-w-7xl px-2 gap-2">
          <span>{filteredFiches.length} fiches d'études correspondent aux filtres</span>
          <span>Affichage: <strong className="text-slate-800 font-extrabold uppercase">{viewMode === 'continue' ? 'Liste Continue 📋' : 'Par Blocs & Modules 🗂️'}</strong></span>
          <span>Zone active: <strong className={activeZone === 'A' ? 'text-[#4285F4]' : activeZone === 'B' ? 'text-[#EA4335]' : 'text-emerald-500 font-bold'}>{activeZone === 'A' ? 'Moi (Évaluation)' : activeZone === 'B' ? 'Exigences Jury' : 'Zone Commune Neutre'}</strong></span>
        </div>

        {filteredFiches.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-slate-300">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-750">Aucun cours trouvé</h4>
            <p className="text-xs text-slate-500 mt-1">Ajustez les termes de recherche, le filtre de Bloc, de Module ou le Thème de cours.</p>
          </div>
        ) : viewMode === 'planning' ? (
          renderPlanningView()
        ) : viewMode === 'continue' ? (
          <div className="flex flex-col gap-4">
            {filteredFiches.map(fiche => renderFicheCard(fiche))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {fichesGroupedByBlockAndModule.map(group => {
              const isCollapsed = !expandedBlocks[group.blockCode];
              const totalCountInBlock = group.modules.reduce((acc, m) => acc + m.fiches.length, 0);

              return (
                <div 
                  key={group.blockCode} 
                  id={`scroll-block-${group.blockCode}`}
                  className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm transition-all animate-fadeIn"
                >
                  {/* Block Header Card with toggle expand/collapse button */}
                  <div 
                    onClick={() => toggleBlockExpanded(group.blockCode)}
                    className="flex items-center justify-between cursor-pointer select-none pb-3 border-b border-slate-200 mb-4 hover:opacity-90"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow">
                        <Grid className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          {group.blockCode === 'Autre' ? 'Cours hors Blocs d\'Études' : `Bloc ${group.blockCode.replace('B', '')}`}
                          <span className="text-xs font-bold text-slate-400 font-mono">({group.blockCode})</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          {totalCountInBlock} {totalCountInBlock > 1 ? 'fiches d\'études' : 'fiche d\'étude'} sous ce bloc
                        </p>
                        
                        {/* Elegant Progress bar for block-level seen documents */}
                        {resourceProgressStats.byBlock[group.blockCode] && resourceProgressStats.byBlock[group.blockCode].total > 0 && (
                          <div className="mt-2 flex items-center gap-3 w-64 sm:w-80">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                                style={{ width: `${resourceProgressStats.byBlock[group.blockCode].pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-500/10 font-mono">
                              👁️ {resourceProgressStats.byBlock[group.blockCode].seen}/{resourceProgressStats.byBlock[group.blockCode].total} documents ({resourceProgressStats.byBlock[group.blockCode].pct}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#4285F4] bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full shadow-sm">
                        {group.blockCode === 'Autre' ? 'Autre' : `Bloc ${group.blockCode.replace('B', '')}`}
                      </span>
                      <button className="p-1 px-2.5 hover:bg-slate-200 rounded-xl transition-colors text-slate-500">
                        {isCollapsed ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronUp className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {!isCollapsed ? (
                    <div className="space-y-6 pt-2">
                      {group.modules.map(mod => {
                        return (
                          <div key={mod.moduleCode} className="border-l-[3px] border-l-[#4285F4] pl-4 sm:pl-5 space-y-3 relative">
                            {/* Module Label Sub-Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs w-full">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                                <h5 className="font-extrabold text-[#1a56bc] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                  {mod.moduleCode === 'Autre' ? 'Sujets Isolés' : `Module ${mod.moduleCode.replace('M', '')}`}
                                  <span className="text-[10px] font-mono text-slate-400 normal-case font-bold">({mod.moduleCode})</span>
                                </h5>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Module Seen documents progress bar */}
                                {(() => {
                                  const mStat = resourceProgressStats.byModule[mod.moduleCode];
                                  if (mStat && mStat.total > 0) {
                                    return (
                                      <div className="flex items-center gap-2 w-44 sm:w-56 bg-white/90 border border-slate-200/55 p-1 px-2.5 rounded-full shadow-xs">
                                        <span className="text-[8.5px] font-bold text-slate-500 font-mono whitespace-nowrap shrink-0">
                                          Vu : {mStat.seen}/{mStat.total}
                                        </span>
                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${mStat.pct}%` }}
                                          />
                                        </div>
                                        <span className="text-[9px] font-black text-emerald-600 font-mono text-right shrink-0">
                                          {mStat.pct}%
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                <span className="text-[10.5px] font-bold text-slate-400 bg-slate-100 px-2 rounded-lg border border-slate-150">
                                  {mod.fiches.length} {mod.fiches.length > 1 ? 'cours groupés' : 'cours unique'}
                                </span>
                              </div>
                            </div>

                            {/* Fiches Cards Grid inside Module */}
                            <div className="flex flex-col gap-4">
                              {mod.fiches.map(fiche => renderFicheCard(fiche))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-1 bg-white/50 rounded-xl text-slate-400 text-xs italic">
                      Bloc masqué &bull; Déroulez pour afficher les {totalCountInBlock} cours associés
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* 6. FLOATING ELEVATOR NAVIGATION CONTROL DECK */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 shrink-0 select-none max-w-[160px] md:max-w-xs animate-slideUp">
        {elevatorExpanded ? (
          /* Expanded Navigation Deck */
          <div className="bg-slate-900/95 backdrop-blur border border-slate-755 p-2.5 sm:p-3 rounded-3xl shadow-2xl flex flex-col gap-2.5 text-white max-w-[160px] md:max-w-[200px] transition-all duration-300">
            <div className="border-b border-slate-800 pb-1 flex items-center justify-between gap-1">
              <span className="text-[9px] uppercase font-black tracking-widest text-[#4285F4] flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#4285F4] animate-spin" /> ASCENSEUR 🧭
              </span>
              <button 
                onClick={() => setElevatorExpanded(false)}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded-md font-black cursor-pointer"
                title="Plier l'ascenseur"
              >
                ✕
              </button>
            </div>

            {/* Quick jump Zone Selector Shortcuts */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Accès Zones :</p>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    setActiveZone('A');
                    triggerToast("🎯 Zone A activée !", "success");
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className={`py-1 text-xs font-black rounded-lg text-center transition-all cursor-pointer ${
                    activeZone === 'A' ? 'bg-[#4285F4] text-white shadow-md shadow-blue-500/20 scale-105' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Sauter à la Zone A (Moi)"
                >
                  A
                </button>
                <button
                  onClick={() => {
                    setActiveZone('B');
                    triggerToast("📢 Zone B activée !", "success");
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className={`py-1 text-xs font-black rounded-lg text-center transition-all cursor-pointer ${
                    activeZone === 'B' ? 'bg-[#EA4335] text-white shadow-md shadow-red-500/20 scale-105' : 'bg-slate-800 hover:bg-slate-705 text-slate-303'
                  }`}
                  title="Sauter à la Zone B (Jury)"
                >
                  B
                </button>
                <button
                  onClick={() => {
                    setActiveZone('C');
                    triggerToast("🤝 Zone commune activée !", "success");
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className={`py-1 text-xs font-black rounded-lg text-center transition-all cursor-pointer ${
                    activeZone === 'C' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105' : 'bg-slate-800 hover:bg-slate-705 text-slate-303'
                  }`}
                  title="Sauter à la Zone C (Commune)"
                >
                  C
                </button>
              </div>
            </div>

            {/* If in segmented view, quick block links */}
            {viewMode === 'segmented' && fichesGroupedByBlockAndModule.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-2 max-h-[140px] overflow-y-auto no-scrollbar">
                <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Sauts de Blocs :</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {fichesGroupedByBlockAndModule.map(group => (
                    <button
                      key={group.blockCode}
                      onClick={() => {
                        const el = document.getElementById(`scroll-block-${group.blockCode}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          triggerToast(`Défilé vers le bloc : ${group.blockCode} 📍`, "info");
                          if (!expandedBlocks[group.blockCode]) {
                            toggleBlockExpanded(group.blockCode);
                          }
                        } else {
                          triggerToast("Bloc non présent dans la vue actuelle", "info");
                        }
                      }}
                      className="p-1 text-[9px] font-black uppercase text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {group.blockCode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scroll controls */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  triggerToast("⬆️ Défilement tout en haut !", "info");
                }}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Tout en haut"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Haut
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  triggerToast("⬇️ Défilement tout en bas !", "info");
                }}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Tout en bas"
              >
                <ArrowDown className="w-3.5 h-3.5" /> Bas
              </button>
            </div>
          </div>
        ) : (
          /* Collapsed Bubble - A beautiful "Little box" */
          <button
            onClick={() => setElevatorExpanded(true)}
            className="w-12 h-12 bg-slate-900 border border-slate-750 hover:bg-slate-850 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-blue-500/20"
            title="Ouvrir l'ascenseur de navigation"
          >
            <Compass className="w-6 h-6 text-blue-400 animate-pulse" />
          </button>
        )}
      </div>

      {false && (
        <div className="hidden bg-white/20">
            {filteredFiches.map(fiche => {
              const currentStatus = activeZone === 'A' ? fiche.status1 : activeZone === 'B' ? fiche.status2 : (fiche.status3 || 'A faire');
              const completedDate = activeZone === 'A' ? fiche.date1 : activeZone === 'B' ? fiche.date2 : fiche.date3;
              const isCompleted = currentStatus === 'Fait';
              const isEnCours = currentStatus === 'En cours';

              return (
                <div 
                  key={fiche.id}
                  className={`bg-white rounded-2xl border-2 shadow-sm p-4 lg:p-5 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-300 ring-2 hover:scale-[1.005] hover:shadow-md ${getTopicLeftBorder(fiche.topic)} ${
                    isCompleted
                      ? 'border-emerald-500 bg-[#10b981]/[0.015] ring-[#34A853]/10 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.15)]' 
                      : isEnCours
                        ? 'border-[#FBBC05] bg-[#FBBC05]/[0.01] ring-[#FBBC05]/10 shadow-[0_4px_12px_-3px_rgba(251,188,5,0.1)]'
                        : (activeZone === 'A' ? 'border-blue-500/40 hover:border-blue-500 ring-slate-100/50' : activeZone === 'B' ? 'border-red-500/40 hover:border-red-500 ring-slate-100/20' : 'border-emerald-500/40 hover:border-emerald-500 ring-slate-100/10')
                  }`}
                >
                  {/* Top multi-color strip for Google Brand aesthetic */}
                  <div className="absolute top-0 left-0 w-full h-[4px] flex">
                    <div className="flex-1 h-full bg-[#4285F4]" />
                    <div className="flex-1 h-full bg-[#EA4335]" />
                    <div className="flex-1 h-full bg-[#FBBC05]" />
                    <div className="flex-1 h-full bg-[#34A853]" />
                  </div>

                  {/* Main Grid Content Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
                    
                    {/* LEFT SECTION (Title + Actions + Status) - Spans lg:col-span-7 */}
                    <div className="lg:col-span-7 flex flex-col justify-start gap-4">
                      
                      {/* Metadata badge and descriptive title */}
                      <div>
                        {/* Topic identifier header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wide transition-all duration-300 ${getTopicBadgeStyle(fiche.topic)}`}>
                              {fiche.topic}
                            </span>
                            {isCompleted && (
                              <span className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> VALIDÉ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setSelectedSpeechFiche(fiche)}
                              className="px-2 py-0.5 bg-gradient-to-r from-[#4285F4] to-indigo-600 hover:from-blue-600 hover:to-indigo-750 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
                              title="Écouter le résumé de la fiche à haute voix"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Écouter 🔊
                            </button>
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                              N° {fiche.id}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-base md:text-lg lg:text-xl leading-tight mt-1 text-balance">
                          {fiche.title}
                        </h3>
                      </div>

                      {/* Textual Actions (Immediate Action & Motors connection) placed SIDE-BY-SIDE to eliminate wasted space */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Action Block */}
                        <div className="p-3 bg-amber-500/[0.02] border border-slate-200 border-l-[3.5px] border-l-amber-500 rounded-xl hover:bg-amber-500/[0.05] transition-all flex flex-col justify-between shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 flex items-center gap-1 border-b border-amber-100 pb-1 mb-1.5">
                            ⚡ Action immédiate (Zéro BlaBla)
                          </p>
                          <p className="text-xs text-slate-800 font-medium leading-relaxed flex-1">
                            {fiche.action}
                          </p>
                        </div>

                        {/* M-Motors project connection link */}
                        <div className="p-3 bg-indigo-500/[0.02] border border-indigo-150 border-l-[3.5px] border-l-indigo-500 rounded-xl hover:bg-indigo-500/[0.05] transition-all flex flex-col justify-between shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-750 flex items-center gap-1 border-b border-indigo-150 pb-1 mb-1.5">
                            🎯 Lien avec Devoir M-Motors
                          </p>
                          <p className="text-xs text-slate-650 italic leading-relaxed font-mono flex-1 text-balance overflow-x-auto">
                            {fiche.motorsLink}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Status Selector Bar */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            🟢 Statut de validation ({activeZone === 'A' ? 'Zone A - Vous' : activeZone === 'B' ? 'Zone B - Jury' : 'Zone C - Commun'}):
                          </span>
                          {completedDate && (
                            <span className="text-[9px] text-emerald-750 font-black flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-sm">
                              <Calendar className="w-2.5 h-2.5 text-emerald-600" /> Validé le {completedDate}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-100/85 p-1 rounded-xl">
                          {(['A faire', 'En cours', 'Fait'] as FicheStatus[]).map(status => {
                            const isActive = currentStatus === status;
                            const getStatusStyle = () => {
                              if (!isActive) {
                                if (status === 'Fait') return 'text-[#34A853]/90 bg-white/40 hover:bg-[#34A853]/10 hover:text-[#34A853]';
                                if (status === 'En cours') return 'text-[#b7791f] bg-white/40 hover:bg-[#FBBC05]/15 hover:text-[#b7791f]';
                                return 'text-[#EA4335]/90 bg-white/40 hover:bg-[#EA4335]/10 hover:text-[#EA4335]';
                              }
                              if (status === 'Fait') return 'bg-[#34A853] text-white font-black shadow-md scale-[1.04] ring-2 ring-[#34A853]/20';
                              if (status === 'En cours') return 'bg-[#FBBC05] text-slate-900 font-black shadow-md scale-[1.04] ring-2 ring-[#FBBC05]/20';
                              return 'bg-[#EA4335] text-white font-black shadow-md scale-[1.04] ring-2 ring-[#EA4335]/20';
                            };

                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(fiche.id, activeZone, status)}
                                className={`py-1.5 rounded-lg text-[10.5px] text-center select-none cursor-pointer tracking-tight transition-all duration-350 font-bold hover:scale-[1.02] border border-transparent ${
                                  isActive ? 'border-slate-950/5' : 'border-slate-200/40'
                                } ${getStatusStyle()}`}
                              >
                                {status === 'Fait' ? 'Fait ✔' : status === 'En cours' ? 'En cours ⏳' : 'À faire 💤'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Resources Grid - Spans lg:col-span-5 */}
                    <div className="w-full lg:col-span-5 lg:border-l border-slate-200/60 pt-4 lg:pt-0 lg:pl-4 flex flex-col justify-start gap-2.5">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          📦 Supports & Ressources (Zone {activeZone}) :
                        </p>
                        
                        {/* Common File (PDF) with edit / custom link options */}
                        {fiche.coursFile && (
                          <div className="p-2.5 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] border border-slate-200 border-l-[3.5px] border-l-[#4285F4] rounded-xl flex flex-col gap-1.5 transition-all mb-2 shadow-sm transform hover:-translate-y-[1px]">
                            <div className="flex items-start justify-between text-[10px] gap-2">
                              <span className="font-bold text-slate-800 flex items-start gap-1 whitespace-normal break-all max-w-full leading-normal" title={fiche.coursFile}>
                                📂 <span className="font-mono text-[10px] text-slate-700">{fiche.coursFile}</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                              {fiche.coursFileUrl || fiche.coursFile.startsWith('http') ? (
                                <button
                                  onClick={() => setSelectedResourceForPreview({
                                    title: fiche.title,
                                    resourceName: fiche.coursFile || "Document PDF de Support d'Étude",
                                    url: fiche.coursFileUrl || fiche.coursFile,
                                    type: 'slide',
                                    ficheId: fiche.id
                                  })}
                                  className="p-0.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all text-[10px] flex items-center gap-1 font-bold cursor-pointer hover:scale-105 active:scale-95"
                                >
                                  <span>👁️ Lire</span>
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-400 italic">Lien non configuré</span>
                              )}

                              <button
                                onClick={() => setEditingPdfFicheId(editingPdfFicheId === fiche.id ? null : fiche.id)}
                                className="text-[8px] text-blue-600 hover:text-blue-750 font-extrabold hover:underline transition-all"
                              >
                                {fiche.coursFileUrl || fiche.coursFile.startsWith('http') ? '✏️ Modifier' : '🔗 Lier un PDF'}
                              </button>
                            </div>

                            {/* Quick inline URL associator */}
                            {editingPdfFicheId === fiche.id && (
                              <div className="pt-2 border-t border-slate-200 text-[10px] flex flex-col gap-1 animate-fadeIn">
                                <p className="font-semibold text-slate-700">Lien Google Drive du PDF :</p>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="https://drive.google.com/..." 
                                    id={`input-pdf-link-${fiche.id}`}
                                    defaultValue={fiche.coursFileUrl || (fiche.coursFile.startsWith('http') ? fiche.coursFile : '')}
                                    className="flex-1 p-1 px-2 text-[10px] bg-white border border-slate-250 rounded-md focus:border-blue-500 focus:outline-none text-slate-800"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = e.currentTarget.value;
                                        if (val) handleAssignPdfUrl(fiche.id, val);
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      const el = document.getElementById(`input-pdf-link-${fiche.id}`) as HTMLInputElement;
                                      if (el && el.value) handleAssignPdfUrl(fiche.id, el.value);
                                    }}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Display ONLY activeZone resource block */}
                        <div>
                          {activeZone === 'A' && (
                            /* Zone A Resource block */
                            (fiche.audio1 || fiche.slide1 || fiche.video1 || fiche.image1 || fiche.nblm1) && (
                              <div className="bg-blue-50/10 border border-blue-100/40 rounded-xl p-2 animate-fadeIn">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                  <span>Zone A • Évaluations (Moi)</span>
                                  <span className="bg-blue-100 text-blue-700 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-tight">Zone A</span>
                                </p>
                                <div className="space-y-1">
                                  {fiche.audio1 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Vocal d'évaluation (.m4a)" 
                                      url={fiche.audio1} 
                                      type="audio" 
                                      zone="A" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.slide1 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Slides Présentation" 
                                      url={fiche.slide1} 
                                      type="slide" 
                                      zone="A" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.video1 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Vidéo Explicative" 
                                      url={fiche.video1} 
                                      type="video" 
                                      zone="A" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.image1 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Schémas d'Appuis" 
                                      url={fiche.image1} 
                                      type="image" 
                                      zone="A" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.nblm1 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="NotebookLM d'Appuis IA" 
                                      url={fiche.nblm1} 
                                      type="nblm" 
                                      zone="A" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          )}

                          {activeZone === 'B' && (
                            /* Zone B Resource block */
                            (fiche.audio2 || fiche.slide2 || fiche.video2 || fiche.image2 || fiche.nblm2) && (
                              <div className="bg-red-50/10 border border-red-100/40 rounded-xl p-2 animate-fadeIn">
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                  <span>Zone B • Retour Jury</span>
                                  <span className="bg-red-100 text-red-700 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-tight">Zone B</span>
                                </p>
                                <div className="space-y-1">
                                  {fiche.audio2 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Vocal Soutenance (.m4a)" 
                                      url={fiche.audio2} 
                                      type="audio" 
                                      zone="B" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.slide2 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Slides Réponses Jury" 
                                      url={fiche.slide2} 
                                      type="slide" 
                                      zone="B" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.video2 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Vidéo Démonstration Jury" 
                                      url={fiche.video2} 
                                      type="video" 
                                      zone="B" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.image2 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Preuves & Graphiques d'Appui" 
                                      url={fiche.image2} 
                                      type="image" 
                                      zone="B" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.nblm2 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="NotebookLM Réponses Jury" 
                                      url={fiche.nblm2} 
                                      type="nblm" 
                                      zone="B" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          )}

                          {activeZone === 'C' && (
                            /* Zone C Resource block */
                            (fiche.audio3 || fiche.slide3 || fiche.video3 || fiche.image3 || fiche.nblm3) && (
                              <div className="bg-emerald-50/10 border border-emerald-100/40 rounded-xl p-2 animate-fadeIn">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                  <span>Zone C • Tracés Communs</span>
                                  <span className="bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-tight">Zone C</span>
                                </p>
                                <div className="space-y-1">
                                  {fiche.audio3 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Vocal Commun (.m4a)" 
                                      url={fiche.audio3} 
                                      type="audio" 
                                      zone="C" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.slide3 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Slides Base Commune" 
                                      url={fiche.slide3} 
                                      type="slide" 
                                      zone="C" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.video3 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Vidéo Explicative Commune" 
                                      url={fiche.video3} 
                                      type="video" 
                                      zone="C" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.image3 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="Iconographies Communes" 
                                      url={fiche.image3} 
                                      type="image" 
                                      zone="C" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                  {fiche.nblm3 && (
                                    <ResourcePlayer 
                                      ficheId={fiche.id} 
                                      ficheTitle={fiche.title} 
                                      resourceName="NotebookLM Références Communes" 
                                      url={fiche.nblm3} 
                                      type="nblm" 
                                      zone="C" 
                                      onPreviewInApp={setSelectedResourceForPreview}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Default studi module support */}
                      {fiche.studi && (
                        <div className="mt-1">
                          <ResourcePlayer 
                            ficheId={fiche.id} 
                            ficheTitle={fiche.title} 
                            resourceName="Plateforme d'études Studi" 
                            url={fiche.studi} 
                            type="studi" 
                            zone="common" 
                            onPreviewInApp={setSelectedResourceForPreview}
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* COLLAPSIBLE INTEGRATED IN-APP PREVIEW PLAYER (ZERO WASTED SPACE, 100% RESPONSIVE WIDTH) */}
                  {selectedResourceForPreview && selectedResourceForPreview.ficheId === fiche.id && (
                    selectedResourceForPreview.type === 'audio' ? (
                      <IntegratedAudioVisualPlayer
                        fiche={fiche}
                        activeZone={activeZone}
                        selectedResourceForPreview={selectedResourceForPreview}
                        previewHeight={previewHeight}
                        onClose={() => setSelectedResourceForPreview(null)}
                        onSetHeight={setPreviewHeight}
                        onSpeechActivate={() => setSelectedSpeechFiche(fiche)}
                      />
                    ) : (
                      <div className="w-full mt-4 bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 text-slate-100 flex flex-col gap-4 animate-slideDown shadow-2xl">
                        {/* Reader Header */}
                        <div className="flex items-center justify-between text-white border-b border-white/[0.08] pb-3 text-xs gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                              LECTEUR DIRECT 📄
                            </span>
                            <span className="font-extrabold text-slate-200 text-xs md:text-sm line-clamp-2 max-w-[180px] sm:max-w-xs md:max-w-md break-words whitespace-normal leading-tight block">
                              {selectedResourceForPreview.resourceName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedSpeechFiche(fiche)}
                              className="p-1 px-2.5 bg-gradient-to-r from-[#4285F4] to-indigo-650 hover:from-blue-600 hover:to-indigo-750 text-white rounded-lg transition-all text-[11px] flex items-center gap-1 font-bold border border-transparent shadow hover:scale-105 active:scale-95 cursor-pointer select-none"
                              title="Ouvrir le liseur vocal intelligent pour lire ce document à haute voix"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Lire à haute voix 🔊
                            </button>
                            <a
                              href={selectedResourceForPreview.url}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              rel="noopener noreferrer"
                              className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all text-[11px] flex items-center gap-1 font-bold border border-white/[0.08]"
                            >
                              Ouvrir externe ↗
                            </a>
                            <button
                              onClick={() => setPreviewHeight(prev => prev === 'compact' ? 'large' : 'compact')}
                              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-[11px] flex items-center gap-1 font-extrabold cursor-pointer border border-slate-700 shadow-sm"
                            >
                              {previewHeight === 'compact' ? '↕️ Mode Plein Écran' : '↕️ Mode Compact'}
                            </button>
                            <button
                              onClick={() => setSelectedResourceForPreview(null)}
                              className="text-white font-black text-xs p-1 px-2.5 bg-red-650 hover:bg-red-700 rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Fermer le lecteur ✕
                            </button>
                          </div>
                        </div>

                        {/* Display content inside card */}
                        {(() => {
                          const url = selectedResourceForPreview.url;
                          const ytEmbed = getYoutubeEmbedUrl(url);
                          const isDirectVideo = isDirectVideoUrl(url) || selectedResourceForPreview.type === 'video';
                          const driveEmbed = getDriveEmbedUrl(url);

                          const containerHeight = previewHeight === 'compact' ? 'h-[280px]' : 'h-[550px]';

                          if (isDirectVideo) {
                            return (
                              <div className={`w-full relative rounded-xl overflow-hidden bg-black border border-slate-800 transition-all duration-300 ${containerHeight}`}>
                                <video 
                                  src={url} 
                                  className="w-full h-full max-h-full rounded-xl bg-black object-contain" 
                                  controls 
                                  controlsList="nodownload"
                                  onContextMenu={(e) => e.preventDefault()}
                                  autoPlay 
                                  playsInline
                                />
                              </div>
                            );
                          }

                          if (ytEmbed) {
                            return (
                              <div className={`w-full relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all duration-300 ${containerHeight}`}>
                                <iframe 
                                  src={ytEmbed} 
                                  className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                                  allow="autoplay; encrypted-media; picture-in-picture"
                                  allowFullScreen
                                  title="YouTube Video Preview"
                                />
                              </div>
                            );
                          }

                          if (driveEmbed) {
                            return (
                              <div className={`w-full relative rounded-xl overflow-hidden bg-slate-905 border border-slate-800 transition-all duration-300 ${containerHeight}`}>
                                <iframe 
                                  src={driveEmbed} 
                                  className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                                  allow="autoplay; encrypted-media"
                                  title="In-App Preview"
                                />
                              </div>
                            );
                          }

                          return (
                            <div className="p-8 text-center text-slate-300 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                              <span className="text-3xl mb-2">⚠️</span>
                              <h5 className="font-bold text-sm text-slate-100">Intégration directe non supportée</h5>
                              <p className="text-xs text-slate-400 mt-1 max-w-sm">Ce fichier requiert une authentification externe ou une extension de sécurité.</p>
                              <a 
                                href={url} 
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                rel="noopener noreferrer" 
                                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow"
                              >
                                Ouvrir dans un nouvel onglet externe <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          );
                        })()}

                        <div className="text-[10px] text-slate-400 italic">
                          💡 Lecture sécurisée dans l'application &bull; Prévient les redirections externes
                        </div>
                      </div>
                    )
                  )}

                </div>
              );
            })}
          </div>
      )}
      </main>

      {/* Modern Compact Floating Navigation Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-5">
          {/* Footer Logo of PAIA and MMPA centered */}
          <div className="flex items-center justify-center gap-5">
            <img 
              src="https://projettechacademy.github.io/Projet_Python/Asset/Logo_MMPA.jpeg" 
              alt="Logo MMPA" 
              referrerPolicy="no-referrer"
              className="h-14 rounded-xl border border-slate-150 shadow-sm object-contain hover:scale-105 transition-transform"
            />
            <div className="w-px h-8 bg-slate-350" />
            <img 
              src="https://projettechacademy.github.io/Projet_Python/Asset/2127845D-F95D-49C0-A22B-88C07817841B.png" 
              alt="Logo PAIA Footer" 
              referrerPolicy="no-referrer"
              className="h-14 rounded-xl border border-slate-150 shadow-sm object-contain hover:scale-105 transition-transform"
            />
          </div>

          {/* Centered single line footer text */}
          <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 select-none text-center leading-normal">
            <span>💫 PAIA – Plateforme d’Actualisation & d’Information (IA) 💔</span>
            <span className="text-slate-350 hidden md:inline">|</span>
            <span>🌴 By Mathilde Martine PAISLEY 🌹</span>
            <span className="text-slate-350 hidden md:inline">|</span>
            <a 
              href="https://discord.gg/jnnNbNaGMp" 
              target="_blank" 
              referrerPolicy="no-referrer"
              rel="noopener noreferrer" 
              className="text-[#4285F4] hover:text-blue-800 hover:underline transition-colors animate-pulse"
            >
              Support Discord 💬
            </a>
            <span className="text-slate-350 hidden md:inline">|</span>
            <span className="text-slate-400 font-medium">© 2026 Tous droits réservés</span>
          </p>
        </div>
      </footer>

      <SpeechReaderModal
        fiche={selectedSpeechFiche}
        isOpen={selectedSpeechFiche !== null}
        onClose={() => setSelectedSpeechFiche(null)}
      />

      {renderReminderModal()}
    </div>
  );
}
