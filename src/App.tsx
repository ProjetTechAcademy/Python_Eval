import React, { useState, useEffect, useMemo } from 'react';
import { initialFiches } from './data/initialData';
import { Fiche, FicheStatus } from './types';
import ThreeDBox from './components/ThreeDBox';
import ResourcePlayer from './components/ResourcePlayer';
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
  ArrowDown
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
    return list.map(f => ({
      ...f,
      status3: f.status3 || 'A faire'
    }));
  });

  const [activeZone, setActiveZone] = useState<'A' | 'B' | 'C'>('A'); // Zone A: Personal, Zone B: Jury, Zone C: Common
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [selectedResourceForPreview, setSelectedResourceForPreview] = useState<{
    title: string;
    resourceName: string;
    url: string;
    type: string;
    ficheId: number;
  } | null>(null);

  const [previewHeight, setPreviewHeight] = useState<'compact' | 'large'>('compact'); // Default to compact (thinner) view as feedback requested
  const [elevatorExpanded, setElevatorExpanded] = useState(false); // Starts collapsed for maximum uncluttered space

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
        const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9upnowMIAhXQO5l7H-m9dfBtytEEugAA_ChZthJRiKILpUNJgrCSHHvQXRt_0QNF-2Sb8ie7gfi0L/pub?output=csv';
        const base = getBasePubUrl(spreadsheetUrl);
        if (!base) return;

        const fetchText = async (urlStr: string) => {
          const res = await fetch(urlStr + (urlStr.includes('?') ? '&' : '?') + 't=' + Date.now());
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        };

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
        triggerToast("🚀 Synchro auto : Toutes vos fiches à jour en direct depuis Google Sheets !", "success");
      } catch (error) {
        console.warn("Background auto-sync failed, running off cached offline fiches", error);
      } finally {
        setIsAutoSyncing(false);
      }
    };

    autoSyncSpreadsheet();
  }, []);

  const [viewMode, setViewMode] = useState<'continue' | 'segmented'>(() => {
    const localMode = localStorage.getItem('m-motors-view-mode');
    return (localMode as 'continue' | 'segmented') || 'segmented'; // Default to organized segmented view for easy navigation
  });

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

  const fichesInZoneA = useMemo(() => fiches.filter(f => f.inZoneA === true), [fiches]);
  const fichesInZoneB = useMemo(() => fiches.filter(f => f.inZoneB === true), [fiches]);
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
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                    N° {fiche.id}
                  </span>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-snug mt-1 text-balance">
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
              {fiche.coursFile && (
                <div className="p-2.5 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] border border-slate-200 border-l-[3.5px] border-l-[#4285F4] rounded-xl flex flex-col gap-1.5 transition-all mb-2 shadow-sm transform hover:-translate-y-[1px]">
                  <div className="flex items-center justify-between text-[10px] gap-2">
                    <span className="font-bold text-slate-800 truncate flex items-center gap-1" title={fiche.coursFile}>
                      📂 <span className="font-mono text-[10px] text-slate-705">{fiche.coursFile}</span>
                    </span>
                    <span className="text-[8px] text-[#4285F4] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md font-sans font-black uppercase shrink-0">
                      Support PDF
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {fiche.coursFileUrl || fiche.coursFile.startsWith('http') ? (
                      <button
                        onClick={() => setSelectedResourceForPreview({
                          title: fiche.title,
                          resourceName: "Document PDF de Support d'Étude",
                          url: fiche.coursFileUrl || fiche.coursFile,
                          type: 'slide',
                          ficheId: fiche.id
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
              )}

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
          <div className="w-full mt-4 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 text-slate-100 flex flex-col gap-3.5 animate-slideDown shadow-2xl">
            {/* Direct Player Header */}
            <div className="flex items-center justify-between text-white border-b border-white/[0.08] pb-3 text-xs gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-blue-405 font-mono text-[9px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                  LECTEUR DIRECT {selectedResourceForPreview.type === 'audio' ? '🔊' : '📄'}
                </span>
                <span className="font-extrabold text-slate-200 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {selectedResourceForPreview.resourceName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedSpeechFiche(fiche)}
                  className="p-1 px-2.5 bg-gradient-to-r from-[#4285F4] to-indigo-650 hover:from-blue-600 hover:to-indigo-750 text-white rounded-lg transition-all text-[10px] flex items-center gap-1 font-bold border border-transparent shadow hover:scale-105 active:scale-95 cursor-pointer select-none"
                  title="Ouvrir le liseur vocal pour ce document"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Lire à haute voix 🔊
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
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-[10px] flex items-center gap-1 font-extrabold cursor-pointer border border-slate-700 shadow-sm"
                >
                  {previewHeight === 'compact' ? '↕️ Mode Plein Écran' : '↕️ Mode Compact'}
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
            {selectedResourceForPreview.type === 'audio' ? (
              <div className="w-full flex flex-col gap-3">
                <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100">{selectedResourceForPreview.resourceName}</h5>
                      <p className="text-[10px] text-slate-400 font-medium">Lecteur officiel Google Drive intégré &bull; Lecture directe</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono self-center">
                    GOOGLE DRIVE AUDIO
                  </span>
                </div>
                {getDriveEmbedUrl(selectedResourceForPreview.url) ? (
                  <div className="w-full h-[180px] sm:h-[220px] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-805 shadow-inner">
                    <iframe 
                      src={getDriveEmbedUrl(selectedResourceForPreview.url) || undefined} 
                      className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                      allow="autoplay; encrypted-media"
                      title="In-App Audio"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <audio 
                      src={selectedResourceForPreview.url} 
                      controls 
                      autoPlay
                      className="w-full outline-none"
                    />
                  </div>
                )}
              </div>
            ) : getDriveEmbedUrl(selectedResourceForPreview.url) ? (
              <div className={`w-full relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all duration-300 ${
                previewHeight === 'compact' ? 'h-[280px]' : 'h-[550px]'
              }`}>
                <iframe 
                  src={getDriveEmbedUrl(selectedResourceForPreview.url) || undefined} 
                  className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                  allow="autoplay; encrypted-media"
                  title="In-App Preview"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-300 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">⚠️</span>
                <h5 className="font-bold text-sm text-slate-100">Intégration directe non supportée</h5>
                <p className="text-xs text-slate-404 mt-1 max-w-sm">Ce fichier requiert une authentification externe ou une extension de sécurité.</p>
                <a 
                  href={selectedResourceForPreview.url} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer" 
                  className="mt-4 px-4 py-2 bg-[#4285F4] hover:bg-blue-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow"
                >
                  Ouvrir externe <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="text-[10px] text-slate-400 italic">
              💡 Lecture sécurisée dans l'application &bull; Prévient les redirections externes
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 pb-16 font-sans">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white p-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-slideUp font-medium">
          <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
          <span>{toast.message}</span>
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
                <span className="font-semibold text-red-600"> Zone B (Avis & Réponses Jury)</span> sur le même tableau.
              </p>
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
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto shadow-inner">
              <button
                onClick={() => {
                  setViewMode('continue');
                  triggerToast("📋 Navigation en liste continue activée", "info");
                }}
                className={`flex-1 md:flex-none py-1.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'continue'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Liste Continue
              </button>
              <button
                onClick={() => {
                  setViewMode('segmented');
                  triggerToast("🗂️ Navigation par Blocs & Modules activée", "info");
                }}
                className={`flex-1 md:flex-none py-1.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'segmented'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-201/60'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Par Blocs & Modules
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
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                                <h5 className="font-extrabold text-[#1a56bc] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                  {mod.moduleCode === 'Autre' ? 'Sujets Isolés' : `Module ${mod.moduleCode.replace('M', '')}`}
                                  <span className="text-[10px] font-mono text-slate-400 normal-case font-bold">({mod.moduleCode})</span>
                                </h5>
                              </div>
                              <span className="text-[10.5px] font-bold text-slate-400 bg-slate-100 px-2 rounded-lg border border-slate-150">
                                {mod.fiches.length} {mod.fiches.length > 1 ? 'cours groupés' : 'cours unique'}
                              </span>
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
                            <div className="flex items-center justify-between text-[10px] gap-2">
                              <span className="font-bold text-slate-800 truncate flex items-center gap-1" title={fiche.coursFile}>
                                📂 <span className="font-mono text-[10px] text-slate-700">{fiche.coursFile}</span>
                              </span>
                              <span className="text-[8px] text-[#4285F4] bg-blue-105 border border-blue-100 px-1.5 py-0.5 rounded-md font-sans font-black uppercase shrink-0">
                                Support PDF
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                              {fiche.coursFileUrl || fiche.coursFile.startsWith('http') ? (
                                <button
                                  onClick={() => setSelectedResourceForPreview({
                                    title: fiche.title,
                                    resourceName: "Document PDF de Support d'Étude",
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
                    <div className="w-full mt-4 bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 text-slate-100 flex flex-col gap-4 animate-slideDown shadow-2xl">
                      {/* Reader Header */}
                      <div className="flex items-center justify-between text-white border-b border-white/[0.08] pb-3 text-xs gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                            LECTEUR DIRECT {selectedResourceForPreview.type === 'audio' ? '🔊' : '📄'}
                          </span>
                          <span className="font-extrabold text-slate-200 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                            {selectedResourceForPreview.resourceName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSpeechFiche(fiche)}
                            className="p-1 px-2.5 bg-gradient-to-r from-[#4285F4] to-indigo-600 hover:from-blue-600 hover:to-indigo-750 text-white rounded-lg transition-all text-[11px] flex items-center gap-1 font-bold border border-transparent shadow hover:scale-105 active:scale-95 cursor-pointer selection:none"
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
                            className="text-white font-black text-xs p-1 px-2.5 bg-red-650 hover:bg-red-650 rounded-lg transition-all cursor-pointer shadow-sm bg-red-605"
                          >
                            Fermer le lecteur ✕
                          </button>
                        </div>
                      </div>

                      {/* Display content inside card */}
                      {selectedResourceForPreview.type === 'audio' ? (
                        <div className="w-full flex flex-col gap-3">
                          <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">
                                <Volume2 className="w-5 h-5 animate-pulse" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-slate-100">{selectedResourceForPreview.resourceName}</h5>
                                <p className="text-[10px] text-slate-400">Lecteur officiel Google Drive intégré &bull; Lecture directe</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono self-center">
                              GOOGLE DRIVE AUDIO
                            </span>
                          </div>
                          {getDriveEmbedUrl(selectedResourceForPreview.url) ? (
                            <div className="w-full h-[180px] sm:h-[220px] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
                              <iframe 
                                src={getDriveEmbedUrl(selectedResourceForPreview.url) || undefined} 
                                className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                                allow="autoplay; encrypted-media"
                                title="In-App Audio Player"
                              />
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                              <audio 
                                src={selectedResourceForPreview.url} 
                                controls 
                                autoPlay
                                className="w-full outline-none"
                              />
                            </div>
                          )}
                        </div>
                      ) : getDriveEmbedUrl(selectedResourceForPreview.url) ? (
                        <div className={`w-full relative rounded-xl overflow-hidden bg-slate-905 border border-slate-800 transition-all duration-300 ${
                          previewHeight === 'compact' ? 'h-[280px]' : 'h-[550px]'
                        }`}>
                          <iframe 
                            src={getDriveEmbedUrl(selectedResourceForPreview.url) || undefined} 
                            className="w-full h-full border-0 absolute top-0 left-0 bg-slate-900" 
                            allow="autoplay; encrypted-media"
                            title="In-App Preview"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-300 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                          <span className="text-3xl mb-2">⚠️</span>
                          <h5 className="font-bold text-sm text-slate-100">Intégration directe non supportée</h5>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">Ce fichier requiert une authentification externe ou une extension de sécurité.</p>
                          <a 
                            href={selectedResourceForPreview.url} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer" 
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow"
                          >
                            Ouvrir dans un nouvel onglet externe <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 italic">
                        💡 Lecture sécurisée dans l'application &bull; Prévient les redirections externes
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
      )}
      </main>

      {/* Modern Compact Floating Navigation Footer */}
      <footer className="mt-20 border-t border-slate-200 py-10 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-800">Tableau de bord M-Motors</span>
            <span className="px-2 py-0.5 font-bold rounded-full bg-slate-100 text-slate-500 font-mono text-[10px]">v1.2.0 • Bento Theme</span>
          </p>
          <p className="flex items-center gap-1.5 justify-center text-slate-450">
            Amélioré avec amour <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" /> pour Mathilde
          </p>
        </div>
      </footer>

      <SpeechReaderModal
        fiche={selectedSpeechFiche}
        isOpen={selectedSpeechFiche !== null}
        onClose={() => setSelectedSpeechFiche(null)}
      />
    </div>
  );
}
