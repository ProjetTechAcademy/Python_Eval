import React, { useState, useEffect, useMemo } from 'react';
import { initialFiches } from './data/initialData';
import { Fiche, FicheStatus } from './types';
import ThreeDBox from './components/ThreeDBox';
import ResourcePlayer from './components/ResourcePlayer';
import CsvLoader from './components/CsvLoader';
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
  Heart
} from 'lucide-react';

export default function App() {
  const [fiches, setFiches] = useState<Fiche[]>(() => {
    const local = localStorage.getItem('m-motors-fiches');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return initialFiches;
      }
    }
    return initialFiches;
  });

  const [activeZone, setActiveZone] = useState<'A' | 'B'>('A'); // Zone A: Personal, Zone B: Jury
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

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
  const handleStatusChange = (id: number, zone: 'A' | 'B', newStatus: FicheStatus) => {
    setFiches(prev => prev.map(f => {
      if (f.id === id) {
        if (zone === 'A') {
          const finishedSymbol = newStatus === 'Fait' ? '🟢 Fait' : newStatus === 'En cours' ? '🟡 En cours' : '🔴 À faire';
          return { ...f, status1: newStatus, date1: newStatus === 'Fait' ? new Date().toLocaleDateString('fr-FR') : f.date1 };
        } else {
          return { ...f, status2: newStatus, date2: newStatus === 'Fait' ? new Date().toLocaleDateString('fr-FR') : f.date2 };
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
          } else {
            return { ...f, status2: 'Fait', date2: new Date().toLocaleDateString('fr-FR') };
          }
        }
        return f;
      }));
      triggerToast(`${matchingFiches.length} fiches marquées accomplies ! 🎉`);
    }
  };

  // Calculate live stats
  const totalFichesCount = fiches.length;

  const stats1 = useMemo(() => {
    const fait = fiches.filter(f => f.status1 === 'Fait').length;
    const cours = fiches.filter(f => f.status1 === 'En cours').length;
    const faire = fiches.filter(f => f.status1 === 'A faire').length;
    return {
      fait,
      cours,
      faire,
      pct: totalFichesCount > 0 ? Math.round((fait / totalFichesCount) * 100) : 0
    };
  }, [fiches, totalFichesCount]);

  const stats2 = useMemo(() => {
    const fait = fiches.filter(f => f.status2 === 'Fait').length;
    const cours = fiches.filter(f => f.status2 === 'En cours').length;
    const faire = fiches.filter(f => f.status2 === 'A faire').length;
    return {
      fait,
      cours,
      faire,
      pct: totalFichesCount > 0 ? Math.round((fait / totalFichesCount) * 100) : 0
    };
  }, [fiches, totalFichesCount]);

  const currentStats = activeZone === 'A' ? stats1 : stats2;

  // Domain Category listing
  const topics = ['All', 'HTML & CSS', 'Bootstrap', 'Bases de Données', 'Python Backend', 'Python Quality & Flask', 'APIs, Git & Sécurité'];

  // Sub-filter core
  const filteredFiches = useMemo(() => {
    return fiches.filter(f => {
      const matchesTopic = selectedTopic === 'All' || f.topic === selectedTopic;
      const fStatus = activeZone === 'A' ? f.status1 : f.status2;
      const matchesStatus = selectedStatus === 'All' || fStatus === selectedStatus;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        f.id.toString().includes(query) ||
        f.title.toLowerCase().includes(query) ||
        f.action.toLowerCase().includes(query) ||
        f.motorsLink.toLowerCase().includes(query);

      return matchesTopic && matchesStatus && matchesSearch;
    });
  }, [fiches, activeZone, selectedTopic, selectedStatus, searchQuery]);

  // Recharts trend visualizer comparing Zone A and Zone B metrics by category
  const comparisonChartData = useMemo(() => {
    return topics.filter(t => t !== 'All').map(topic => {
      const subset1 = fiches.filter(f => f.topic === topic && f.status1 === 'Fait').length;
      const subset2 = fiches.filter(f => f.topic === topic && f.status2 === 'Fait').length;
      const total = fiches.filter(f => f.topic === topic).length;
      return {
        name: topic,
        'Zone A - Ma Progression (%)': total > 0 ? Math.round((subset1 / total) * 100) : 0,
        'Zone B - Réponses Jury (%)': total > 0 ? Math.round((subset2 / total) * 105) : 100, // mock scaled index response
      };
    });
  }, [fiches]);

  // Timeline progress simulation data over 6 stages
  const progressTimelineData = [
    { name: 'Étape 1: Bases', 'Ma Réponse': 15, 'Retour Jury': 5 },
    { name: 'Étape 2: Bootstrap', 'Ma Réponse': 35, 'Retour Jury': 15 },
    { name: 'Étape 3: Bases de Données', 'Ma Réponse': 55, 'Retour Jury': 28 },
    { name: 'Étape 4: Python Backend', 'Ma Réponse': 72, 'Retour Jury': 40 },
    { name: 'Étape 5: Flask & Dev', 'Ma Réponse': 88, 'Retour Jury': 65 },
    { name: 'Étape 6: Projet Final', 'Ma Réponse': stats1.pct, 'Retour Jury': stats2.pct },
  ];

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
            />
          </div>
        )}

        {/* 1. OVERALL STATS BENTO BOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Main Metric Selector - Zone A Progress */}
          <ThreeDBox themeColor="blue" className="md:col-span-2 flex flex-col justify-between">
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
                <span className="text-xs text-slate-500">de fiches d'étude validées</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3 border border-slate-200">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats1.pct}%` }}
                />
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
          <ThreeDBox themeColor="red" className="md:col-span-2 flex flex-col justify-between">
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
                <span className="text-xs text-slate-500">conformes aux avis jury</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3 border border-slate-200">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats2.pct}%` }}
                />
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
                  <Line type="monotone" dataKey="Ma Réponse" stroke="#4285F4" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Retour Jury" stroke="#EA4335" strokeWidth={2.5} strokeDasharray="4 4" />
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
          <div className="p-2 bg-slate-900 border-2 border-slate-950 rounded-full shadow-lg flex gap-2 w-full max-w-lg">
            <button
              onClick={() => {
                setActiveZone('A');
                triggerToast("Zone A activée : Ma Progression Personnelle 🎯", "info");
              }}
              className={`flex-1 py-3 px-5 rounded-full text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeZone === 'A'
                  ? 'bg-[#4285F4] text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              Zone A: Ma Réponse (Moi)
            </button>
            <button
              onClick={() => {
                setActiveZone('B');
                triggerToast("Zone B activée : Livrables pour le Jury ⚖️", "info");
              }}
              className={`flex-1 py-3 px-5 rounded-full text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeZone === 'B'
                  ? 'bg-[#EA4335] text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              Zone B: Réponse Jury
            </button>
          </div>
        </div>

        {/* 4. FILTERS AND SEARCH COMPONENT BOARD */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Search inputs */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher N°, titre, devoir, action..."
                className="w-full bg-slate-50 border border-slate-250 focus:border-slate-800 rounded-2xl p-3 pl-11 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            {/* Filter tags list */}
            <div className="w-full lg:flex-1 overflow-x-auto no-scrollbar py-2">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-xs text-slate-400 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Thème:</span>
                {topics.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTopic(t)}
                    className={`p-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      selectedTopic === t 
                        ? 'bg-slate-900 text-white shadow' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'All' ? 'Tous 🗺️' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
              <span className="text-xs text-slate-400">Statut:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2 px-3 text-xs text-slate-750 pointer focus:outline-none focus:border-slate-400"
              >
                <option value="All">Tout afficher 📊</option>
                <option value="Fait">Fait ✔</option>
                <option value="En cours">En cours ⏳</option>
                <option value="A faire">À faire 💤</option>
              </select>

              {/* Bulk actions button */}
              {filteredFiches.length > 0 && (
                <button
                  onClick={() => markFilteredAsCompleted(filteredFiches)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1 pointer active:scale-95 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Tout cocher
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 5. MAIN CHECKLIST GRID SYSTEM */}
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500 max-w-7xl px-2">
          <span>{filteredFiches.length} fiches d'études correspondent aux filtres</span>
          <span>Zone active: <strong className={activeZone === 'A' ? 'text-[#4285F4]' : 'text-[#EA4335]'}>{activeZone === 'A' ? 'Moi (Évaluation)' : 'Exigences Jury'}</strong></span>
        </div>

        {filteredFiches.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-slate-300">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-750">Aucun cours trouvé</h4>
            <p className="text-xs text-slate-500 mt-1">Ajustez les termes de recherche ou la thématique de filtre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiches.map(fiche => {
              const currentStatus = activeZone === 'A' ? fiche.status1 : fiche.status2;
              const completedDate = activeZone === 'A' ? fiche.date1 : fiche.date2;
              const hasCommonFiles = !!fiche.coursFile;

              return (
                <ThreeDBox 
                  key={fiche.id} 
                  themeColor={activeZone === 'A' ? 'blue' : 'red'}
                  className="flex flex-col justify-between h-full"
                >
                  {/* Topic identifier header */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase">
                      {fiche.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      N° {fiche.id}
                    </span>
                  </div>

                  {/* Title and descriptions */}
                  <div>
                    <h3 className="font-extrabold text-[#111827] text-base leading-tight mt-1 line-clamp-2 hover:line-clamp-none transition-all">
                      {fiche.title}
                    </h3>

                    {/* Action Block */}
                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Action immédiate (Zéro BlaBla)</p>
                      <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
                        {fiche.action}
                      </p>
                    </div>

                    {/* M-Motors project connection link */}
                    <div className="mt-2.5 p-2.5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                      <p className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-700">🎯 Lien avec Devoir M-Motors</p>
                      <p className="text-xs text-slate-700 italic mt-0.5 leading-relaxed">
                        {fiche.motorsLink}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Status Selector Bar */}
                  <div className="my-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">Statut du livrable:</span>
                      {completedDate && (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <Calendar className="w-3 h-3" /> Fait le {completedDate}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                      {(['A faire', 'En cours', 'Fait'] as FicheStatus[]).map(status => {
                        const isActive = currentStatus === status;
                        const getStatusStyle = () => {
                          if (!isActive) return 'text-slate-600 hover:bg-white/50';
                          if (status === 'Fait') return 'bg-[#34A853] text-white font-bold shadow-md';
                          if (status === 'En cours') return 'bg-[#FBBC05] text-[#1e293b] font-bold shadow-md';
                          return 'bg-slate-400 text-white font-bold shadow-md';
                        };

                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(fiche.id, activeZone, status)}
                            className={`py-1.5 rounded-lg text-[10px] text-center select-none cursor-pointer transition-all ${getStatusStyle()}`}
                          >
                            {status === 'Fait' ? 'Fait ✔' : status === 'En cours' ? 'En cours ⏳' : 'À faire 💤'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resources Links Grid */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supports / Ressources :</p>
                    
                    {/* Common PDF File */}
                    {fiche.coursFile && (
                      <div className="p-2 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors">
                        <span className="font-medium text-slate-700 line-clamp-1 flex items-center gap-1.5">
                          📂 <span className="font-mono text-[11px]">{fiche.coursFile}</span>
                        </span>
                        <span className="text-[10px] text-[#4285F4] bg-blue-50 px-2 py-0.5 rounded font-mono">Commun</span>
                      </div>
                    )}

                    {/* Dynamic Zone-related files */}
                    <div className="grid grid-cols-1 gap-2 mt-1">
                      {activeZone === 'A' ? (
                        <>
                          {fiche.audio1 && (
                            <ResourcePlayer 
                              ficheId={fiche.id} 
                              ficheTitle={fiche.title} 
                              resourceName="Vocal d'évaluation (.m4a)" 
                              url={fiche.audio1} 
                              type="audio" 
                              zone="A" 
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
                            />
                          )}
                        </>
                      ) : (
                        <>
                          {fiche.audio2 && (
                            <ResourcePlayer 
                              ficheId={fiche.id} 
                              ficheTitle={fiche.title} 
                              resourceName="Vocal Soutenance (.m4a)" 
                              url={fiche.audio2} 
                              type="audio" 
                              zone="B" 
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
                            />
                          )}
                        </>
                      )}

                      {/* Default studi module support */}
                      {fiche.studi && (
                        <ResourcePlayer 
                          ficheId={fiche.id} 
                          ficheTitle={fiche.title} 
                          resourceName="Plateforme d'études Studi" 
                          url={fiche.studi} 
                          type="studi" 
                          zone="common" 
                        />
                      )}
                    </div>
                  </div>
                </ThreeDBox>
              );
            })}
          </div>
        )}

        {/* Common Elements Footer Bento from design specification */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border-l-[12px] border-[#FBBC05] flex flex-col md:flex-row items-center justify-between gap-4 mt-10 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Common Course Segment</p>
                <p className="text-xs font-bold text-slate-700">188_Py_B3_M03_S001_Introduction.pdf</p>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎞️</span>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Masterclass Video</p>
                <p className="text-xs font-bold text-slate-700">Introduction_HTML_CSS.mp4</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <a 
              href="https://drive.google.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-6 py-2.5 bg-slate-900 text-white text-center rounded-full text-[11px] font-black uppercase tracking-tighter hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              Open Drive
            </a>
            <a 
              href="https://studi.fr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-6 py-2.5 bg-blue-500 text-white text-center rounded-full text-[11px] font-black uppercase tracking-tighter shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all cursor-pointer"
            >
              Studi Access
            </a>
          </div>
        </section>
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
    </div>
  );
}
