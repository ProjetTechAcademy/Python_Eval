import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check, AlertCircle, RefreshCw, Upload, Copy, HelpCircle } from 'lucide-react';
import { Fiche, FicheStatus } from '../types';
import { initialFiches } from '../data/initialData';

interface CsvLoaderProps {
  onDataLoaded: (data: Fiche[]) => void;
  currentCount: number;
}

export default function CsvLoader({ onDataLoaded, currentCount }: CsvLoaderProps) {
  const [csvUrl, setCsvUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vS9upnowMIAhXQO5l7H-m9dfBtytEEugAA_ChZthJRiKILpUNJgrCSHHvQXRt_0QNF-2Sb8ie7gfi0L/pub?output=csv');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [rawText, setRawText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  // Parse CSV helper
  const parseCsvContent = (text: string) => {
    try {
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

      // Filter and trace columns
      if (rows.length < 5) {
        throw new Error('Format invalide. Le fichier contient trop peu de lignes.');
      }

      // We have multiple segments: Python_Eval_1 and Python_Eval_2
      // Let's create an advanced mapper to stitch Tab1 and Tab2 values together!
      const fichesMap: Record<number, Partial<Fiche>> = {};

      let currentSection: 'unknown' | 'eval1' | 'eval2' = 'unknown';
      let headers: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue;

        const firstCell = row[0].trim();

        if (firstCell.includes('Python_Eval_1')) {
          currentSection = 'eval1';
          headers = [];
          continue;
        } else if (firstCell.includes('Python_Eval_2')) {
          currentSection = 'eval2';
          headers = [];
          continue;
        }

        if (firstCell === 'N°' || firstCell === 'N') {
          headers = row.map(h => h.trim().toLowerCase());
          continue;
        }

        const idNum = parseInt(firstCell, 10);
        if (isNaN(idNum)) continue; // Skip header/non-numeric rows

        if (!fichesMap[idNum]) {
          fichesMap[idNum] = {
            id: idNum,
            title: '',
            action: '',
            motorsLink: '',
            status1: 'A faire',
            status2: 'A faire',
            coursFile: `${idNum}_pdf_doc.pdf`,
          };
        }

        const currentFiche = fichesMap[idNum];

        // Map values depending on current evaluation block
        headers.forEach((header, index) => {
          if (index >= row.length) return;
          const val = row[index];
          if (!val) return;

          if (header.includes('titre')) {
            currentFiche.title = val;
            // Infer topic from title
            if (val.includes('_M03_')) {
              if (val.includes('_S018_') || val.includes('_S019_') || val.includes('_S020_') || val.includes('_S021_')) {
                currentFiche.topic = 'Bootstrap';
              } else {
                currentFiche.topic = 'HTML & CSS';
              }
            } else if (val.includes('_M06_')) {
              currentFiche.topic = 'Bases de Données';
            } else if (val.includes('_M08_')) {
              if (val.includes('_S010_') || val.includes('_S021_') || val.includes('_S024_') || val.includes('_S025_') || val.includes('_S026_')) {
                currentFiche.topic = 'Python Quality & Flask';
              } else {
                currentFiche.topic = 'Python Backend';
              }
            } else if (val.includes('_M10_') || val.includes('_M12_') || val.includes('_M13_')) {
              currentFiche.topic = 'APIs, Git & Sécurité';
            } else {
              currentFiche.topic = 'Autre';
            }
          } else if (header.includes('action')) {
            currentFiche.action = val;
          } else if (header.includes('devoir') || header.includes('motors') || header.includes('lien direct')) {
            currentFiche.motorsLink = val;
          } else if (header.includes('date')) {
            if (currentSection === 'eval1') {
              currentFiche.date1 = val;
            } else {
              currentFiche.date2 = val;
            }
          } else if (header.includes('fait')) {
            const parsedStatus = (val.toLowerCase().includes('en cours') ? 'En cours' : val.toLowerCase().includes('fait') ? 'Fait' : 'A faire') as FicheStatus;
            if (currentSection === 'eval1') {
              currentFiche.status1 = parsedStatus;
            } else {
              currentFiche.status2 = parsedStatus;
            }
          } else if (header.includes('cours')) {
            currentFiche.coursFile = val;
          } else if (header.includes('studi')) {
            currentFiche.studi = val;
          } else if (header.includes('suivi')) {
            if (currentSection === 'eval1') {
              currentFiche.suivi1 = val;
            } else {
              currentFiche.suivi2 = val;
            }
          }

          // Tab Specific resources
          if (currentSection === 'eval1') {
            if (header.includes('audio')) currentFiche.audio1 = val;
            if (header.includes('slide')) currentFiche.slide1 = val;
            if (header.includes('vidéo') || header.includes('video')) currentFiche.video1 = val;
            if (header.includes('image')) currentFiche.image1 = val;
            if (header.includes('nblm')) currentFiche.nblm1 = val;
          } else {
            if (header.includes('audio')) currentFiche.audio2 = val;
            if (header.includes('slide')) currentFiche.slide2 = val;
            if (header.includes('vidéo') || header.includes('video')) currentFiche.video2 = val;
            if (header.includes('image')) currentFiche.image2 = val;
            if (header.includes('nblm')) currentFiche.nblm2 = val;
          }
        });
      }

      const list = Object.values(fichesMap) as Fiche[];
      
      if (list.length === 0) {
        throw new Error("Aucune fiche d'évaluation n'a pu être extraite. Vérifiez l'en-tête de colonnes ('N°', 'Titre de la Fiche').");
      }

      // Sort list by ID
      list.sort((a, b) => a.id - b.id);

      // Backfill missing titles or values based on course details if empty
      const stitchedList = list.map(item => {
        const foundOriginal = initialFiches.find(orig => orig.id === item.id);
        if (foundOriginal) {
          return {
            ...foundOriginal,
            ...item,
            // Merge nested items if custom was empty
            title: item.title || foundOriginal.title,
            action: item.action || foundOriginal.action,
            motorsLink: item.motorsLink || foundOriginal.motorsLink,
            topic: item.topic || foundOriginal.topic,
          };
        }
        return item as Fiche;
      });

      onDataLoaded(stitchedList);
      setStatusMessage({
        type: 'success',
        text: `Félicitations ! ${stitchedList.length} fiches synchronisées avec succès ! 🎉`
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
    setStatusMessage({ type: 'info', text: 'Connexion au Google Sheets et récupération...' });
    
    try {
      // Direct CORS fetch or using server side proxy
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Le serveur de feuilles de calcul a renvoyé une erreur HTTP ${response.status}`);
      }
      const rawText = await response.text();
      const success = parseCsvContent(rawText);
      if (success) {
        setRawText(rawText);
      }
    } catch (error: any) {
      console.warn('Direct dynamic fetch failed, attempting client-side browser parse simulated payload', error);
      // Let the user copy paste easily
      setStatusMessage({
        type: 'error',
        text: `Échec de récupération directe (CORS ou hors-ligne). Veuillez utiliser l'import direct de fichier CSV ou copier-coller les données ci-dessous.`
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
