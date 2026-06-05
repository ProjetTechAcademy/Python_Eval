import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check, AlertCircle, RefreshCw, Upload, Copy, HelpCircle } from 'lucide-react';
import { Fiche, FicheStatus } from '../types';
import { initialFiches } from '../data/initialData';

interface CsvLoaderProps {
  onDataLoaded: (data: Fiche[]) => void;
  currentCount: number;
  currentList?: Fiche[];
}

// Get base public URL
export const getBasePubUrl = (url: string) => {
  const match = url.match(/^(https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[a-zA-Z0-9_-]+\/pub)/);
  return match ? match[1] : null;
};

// Parse a single CSV sheet of rows into a worksheet object
export const parseSingleTextToSheet = (text: string) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Le CSV est vide ou invalide.');
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let insideQuote = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // Skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  if (rows.length < 3) {
    throw new Error('Format invalide. Trop peu de lignes.');
  }

  // Detect section
  let section: 'eval0' | 'eval1' | 'eval2' = 'eval0';
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const lineJoined = rows[i].join(',');
    if (lineJoined.includes('Python_Eval_1') || lineJoined.includes('audio_1') || lineJoined.includes('Audio_1')) {
      section = 'eval1';
      break;
    } else if (lineJoined.includes('Python_Eval_2') || lineJoined.includes('audio_2') || lineJoined.includes('Audio_2')) {
      section = 'eval2';
      break;
    } else if (lineJoined.includes('Python_Eval_0') || lineJoined.includes('audio_0') || lineJoined.includes('Audio_0')) {
      section = 'eval0';
      break;
    }
  }

  // Find headers row starting with N° or N
  let headers: string[] = [];
  let headersIndex = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (row.length === 0 || !row[0]) continue;
    const firstCell = row[0].trim();
    if (firstCell === 'N°' || firstCell === 'N') {
      headers = row.map(h => h.trim().toLowerCase());
      headersIndex = i;
      break;
    }
  }

  if (headers.length === 0) {
    headers = ['n°', 'titre', 'action', 'devoir', 'date', 'fait', 'cours', 'audio', 'slide', 'video', 'image', 'nblm'];
  }

  // Double check section using exact columns names
  headers.forEach(h => {
    if (h.includes('_1') || h.includes('audio_1') || h.includes('slide_1')) section = 'eval1';
    if (h.includes('_2') || h.includes('audio_2') || h.includes('slide_2')) section = 'eval2';
    if (h.includes('_0') || h.includes('audio_0') || h.includes('slide_0')) section = 'eval0';
  });

  const records: Record<number, any> = {};

  for (let i = headersIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row[0]) continue;

    const firstCell = row[0].trim();
    const idNum = parseInt(firstCell, 10);
    if (isNaN(idNum)) continue;

    const record: any = {
      id: idNum,
      title: '',
      action: '',
      motorsLink: '',
      date: '',
      status: 'A faire',
      coursFileUrl: '',
      audio: '',
      slide: '',
      video: '',
      image: '',
      nblm: '',
      studi: '',
      suivi: ''
    };

    headers.forEach((header, index) => {
      if (index >= row.length) return;
      const val = row[index].trim();
      if (!val) return;

      if (header.includes('titre')) {
        record.title = val;
      } else if (header.includes('action')) {
        record.action = val;
      } else if (header.includes('devoir') || header.includes('motors') || header.includes('lien direct')) {
        record.motorsLink = val;
      } else if (header.includes('date')) {
        record.date = val;
      } else if (header.includes('fait') || header.includes('fait ?')) {
        record.status = (val.toLowerCase().includes('en cours') ? 'En cours' : val.toLowerCase().includes('fait') ? 'Fait' : 'A faire');
      } else if (header.includes('cours')) {
        if (val.startsWith('http')) {
          record.coursFileUrl = val;
        } else {
          record.coursFile = val;
        }
      } else if (header.includes('audio')) {
        record.audio = val;
      } else if (header.includes('slide')) {
        record.slide = val;
      } else if (header.includes('vidéo') || header.includes('video')) {
        record.video = val;
      } else if (header.includes('image')) {
        record.image = val;
      } else if (header.includes('nblm')) {
        record.nblm = val;
      } else if (header.includes('studi')) {
        record.studi = val;
      } else if (header.includes('suivi')) {
        record.suivi = val;
      } else if (header.includes('lien') && !record.coursFileUrl && val.startsWith('http')) {
        record.coursFileUrl = val;
      }
    });

    records[idNum] = record;
  }

  return { section, records };
};

export const mergeSheets = (sheets: { section: 'eval0' | 'eval1' | 'eval2'; records: Record<number, any> }[], currentList: Fiche[]): Fiche[] => {
  const mergedMap: Record<number, Partial<Fiche>> = {};

  // First copy currentList's existing records to retain all user states/clicks/dates
  currentList.forEach(fiche => {
    mergedMap[fiche.id] = { ...fiche };
  });

  sheets.forEach(sheet => {
    const section = sheet.section;
    Object.entries(sheet.records).forEach(([idStr, rec]) => {
      const id = parseInt(idStr, 10);
      if (isNaN(id)) return;

      if (!mergedMap[id]) {
        mergedMap[id] = { id };
      }

      const m = mergedMap[id];

      if (rec.title) m.title = rec.title;
      if (rec.action) m.action = rec.action;
      if (rec.motorsLink) m.motorsLink = rec.motorsLink;
      if (rec.studi) m.studi = rec.studi;

      // Infer topic
      if (rec.title) {
        const val = rec.title;
        if (val.includes('_M03_')) {
          if (val.includes('_S018_') || val.includes('_S019_') || val.includes('_S020_') || val.includes('_S021_')) {
            m.topic = 'Bootstrap';
          } else {
            m.topic = 'HTML & CSS';
          }
        } else if (val.includes('_M06_') || val.includes('_M09_')) {
          m.topic = 'Bases de Données';
        } else if (val.includes('_M08_')) {
          if (val.includes('_S010_') || val.includes('_S021_') || val.includes('_S024_') || val.includes('_S025_') || val.includes('_S026_')) {
            m.topic = 'Python Quality & Flask';
          } else {
            m.topic = 'Python Backend';
          }
        } else if (val.includes('_M10_') || val.includes('_M12_') || val.includes('_M13_')) {
          m.topic = 'APIs, Git & Sécurité';
        } else {
          m.topic = 'Autre';
        }
      }

      if (rec.coursFileUrl && rec.coursFileUrl.startsWith('http')) {
        m.coursFileUrl = rec.coursFileUrl;
      }

      if (section === 'eval1') {
        m.inZoneA = true;
        // Keep user local/custom status if it is already "Fait" or "En cours" in the app
        m.status1 = (m.status1 && m.status1 !== 'A faire' && rec.status === 'A faire') ? m.status1 : rec.status;
        if (rec.date) m.date1 = rec.date;
        if (rec.audio) m.audio1 = rec.audio;
        if (rec.slide) m.slide1 = rec.slide;
        if (rec.video) m.video1 = rec.video;
        if (rec.image) m.image1 = rec.image;
        if (rec.nblm) m.nblm1 = rec.nblm;
        if (rec.suivi) m.suivi1 = rec.suivi;
      } else if (section === 'eval2') {
        m.inZoneB = true;
        m.status2 = (m.status2 && m.status2 !== 'A faire' && rec.status === 'A faire') ? m.status2 : rec.status;
        if (rec.date) m.date2 = rec.date;
        if (rec.audio) m.audio2 = rec.audio;
        if (rec.slide) m.slide2 = rec.slide;
        if (rec.video) m.video2 = rec.video;
        if (rec.image) m.image2 = rec.image;
        if (rec.nblm) m.nblm2 = rec.nblm;
        if (rec.suivi) m.suivi2 = rec.suivi;
      } else if (section === 'eval0') {
        m.inZoneC = true;
        m.status3 = (m.status3 && m.status3 !== 'A faire' && rec.status === 'A faire') ? m.status3 : rec.status;
        if (rec.date) m.date3 = rec.date;
        if (rec.audio) m.audio3 = rec.audio;
        if (rec.slide) m.slide3 = rec.slide;
        if (rec.video) m.video3 = rec.video;
        if (rec.image) m.image3 = rec.image;
        if (rec.nblm) m.nblm3 = rec.nblm;
        if (rec.suivi) m.suivi3 = rec.suivi;
      }
    });
  });

  // Re-generate list from mergedMap, making sure new IDS are handled cleanly
  const finalIds = Array.from(new Set([
    ...currentList.map(f => f.id),
    ...Object.keys(mergedMap).map(idStr => parseInt(idStr, 10))
  ])).filter(id => !isNaN(id));

  const resultList = finalIds.map(id => {
    const up = mergedMap[id] || {};
    
    // Default fallback zone memberships for common files of Bloc 3
    const belongsToAB = (id >= 188 && id <= 342) || id === 329 || id === 333 || id === 335 || id === 338 || id === 340 || id === 342;
    
    const baseMerged = {
      id,
      title: up.title || `Fiche #${id}`,
      topic: up.topic || 'Autre',
      action: up.action || '',
      motorsLink: up.motorsLink || '',
      status1: up.status1 || 'A faire',
      status2: up.status2 || 'A faire',
      status3: up.status3 || 'A faire',
      coursFile: up.coursFile || `${id}_cours.pdf`,
      coursFileUrl: up.coursFileUrl || '',
      ...up
    };

    return {
      ...baseMerged,
      inZoneA: up.inZoneA !== undefined ? up.inZoneA : belongsToAB,
      inZoneB: up.inZoneB !== undefined ? up.inZoneB : belongsToAB,
      inZoneC: up.inZoneC !== undefined ? up.inZoneC : true,
    } as Fiche;
  });

  return resultList.sort((a, b) => a.id - b.id);
};

export default function CsvLoader({ onDataLoaded, currentCount, currentList }: CsvLoaderProps) {
  const [csvUrl, setCsvUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vS9upnowMIAhXQO5l7H-m9dfBtytEEugAA_ChZthJRiKILpUNJgrCSHHvQXRt_0QNF-2Sb8ie7gfi0L/pub?output=csv');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [rawText, setRawText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  const parseCsvContent = (text: string) => {
    try {
      const single = parseSingleTextToSheet(text);
      const merged = mergeSheets([single], currentList || initialFiches);
      
      onDataLoaded(merged);
      setStatusMessage({
        type: 'success',
        text: `Félicitations ! Fiche synchronisée avec succès ! (Zone: ${single.section === 'eval1' ? 'A' : single.section === 'eval2' ? 'B' : 'C'}) 🎉`
      });
      return true;
    } catch (e: any) {
      console.error(e);
      setStatusMessage({
        type: 'error',
        text: `Erreur de traitement : ${e.message || 'Structure non reconnue'}`
      });
      return false;
    }
  };

  // 1. Dynamic fetch from the server/browser
  const fetchCsvData = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Connexion aux feuilles de calcul Google Sheets...' });
    
    try {
      const base = getBasePubUrl(csvUrl);
      if (base) {
        setStatusMessage({ type: 'info', text: 'Récupération simultanée des Zones A, B et C...' });
        
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

        const merged = mergeSheets([sheetC, sheetA, sheetB], currentList || initialFiches);
        onDataLoaded(merged);
        setStatusMessage({
          type: 'success',
          text: `Félicitations ! ${merged.length} fiches synchronisées en fusionnant simultanément les dossiers Zone A (Vos progrès), Zone B (Jury) et Zone C (Commun) ! 🌐🎓`
        });
        setRawText(textA);
      } else {
        const response = await fetch(csvUrl + (csvUrl.includes('?') ? '&' : '?') + 't=' + Date.now());
        if (!response.ok) {
          throw new Error(`Le serveur a renvoyé une erreur HTTP ${response.status}`);
        }
        const text = await response.text();
        const success = parseCsvContent(text);
        if (success) {
          setRawText(text);
        }
      }
    } catch (error: any) {
      console.warn('Direct dynamic fetch failed', error);
      setStatusMessage({
        type: 'error',
        text: `CORS ou erreur d'accès. Veuillez copier-coller le texte directement dans l'espace ci-dessous.`
      });
      setShowPasteArea(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch File upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Lecture du fichier local...' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvContent(text);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Impossible de lire le fichier local.' });
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Paste handler
  const handlePasteSubmit = () => {
    parseCsvContent(rawText);
  };

  return (
    <div id="csv-loader-panel" className="relative p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      {/* 3D Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4285F4]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#4285F4]/20 text-[#4285F4] rounded-xl border border-[#4285F4]/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              Import & Synchronisation Google Sheets 🔄
            </h3>
            <p className="text-xs text-slate-400">
              Chargez vos propres évaluations directement pour mettre à jour les fiches de cours
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1.5 px-3 border border-slate-700 text-xs text-slate-300 font-mono self-start md:self-auto">
          <span>{currentCount} fiches chargées</span>
        </div>
      </div>

      {statusMessage && (
        <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
          statusMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
          statusMessage.type === 'error' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
          'bg-blue-500/15 text-blue-300 border-blue-500/30'
        }`}>
          {statusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Synchronise form link */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
        <div className="lg:col-span-8 relative">
          <input
            type="url"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            placeholder="Lien de publication CSV du Google Sheets"
            className="w-full bg-slate-950/80 border border-slate-700 hover:border-slate-500 focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded-xl p-3 text-xs font-mono text-slate-100 pr-10"
          />
          <HelpCircle className="absolute right-3 top-3.5 w-4.5 h-4.5 text-slate-500 hover:text-slate-300 cursor-help" title="Allez dans Fichier > Partager > Publier sur le web. Choisissez la feuille au format CSV." />
        </div>
        
        <div className="lg:col-span-4 flex gap-2">
          <button
            onClick={fetchCsvData}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold p-3 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Fetch en cours...' : 'Synchroniser'}
          </button>

          <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold p-3 flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>Fichier CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <button
          onClick={() => setShowPasteArea(!showPasteArea)}
          className="text-slate-400 hover:text-white transition-all underline flex items-center gap-1.5 cursor-pointer"
        >
          {showPasteArea ? "Masquer le presse-papier" : "Méthode alternative : Copier-Coller le CSV direct (Zéro blabla) 📋"}
        </button>

        <span className="text-[10px] text-slate-500 italic">
          Garantit 100% de compatibilité locale et hors-ligne
        </span>
      </div>

      {showPasteArea && (
        <div className="mt-4 transition-all animate-fadeIn">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Copiez et collez l'intégralité du contenu CSV ici (les en-têtes Python_Eval_1 et Python_Eval_2 seront détectées automatiquement)..."
            rows={6}
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-[#4285F4] rounded-xl p-3 text-xs font-mono text-emerald-400 mb-2 focus:outline-none"
          />
          <button
            onClick={handlePasteSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" /> Traiter le CSV collé
          </button>
        </div>
      )}
    </div>
  );
}
