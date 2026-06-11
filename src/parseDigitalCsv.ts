import * as fs from 'fs';

function parseCsv() {
  const fileContent = fs.readFileSync('./zone_e_data.csv', 'utf-8');
  const lines = fileContent.split(/\r?\n/);
  
  // Custom CSV parser to handle quotes and commas
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const fiches: any[] = [];
  let idCounter = 2000;

  // Let's find columns: Header is the first non-empty line
  const headerIndex = lines.findIndex(l => l.includes("Programme") || l.includes("LIEN"));
  if (headerIndex === -1) {
    console.error("Could not find CSV header!");
    return;
  }

  const header = parseLine(lines[headerIndex]);
  console.log("Header columns found:", header);

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith(',,,')) continue;
    
    const row = parseLine(line);
    // Map columns
    const titleVal = row[0] || '';
    if (!titleVal) continue;
    
    const lienVal = row[1] || '';
    const nblmVal = row[2] || '';
    const audioVal = row[3] || '';
    const infoVal = row[4] || ''; // Info/additional
    const pdfVal = row[5] || '';
    const slideVal = row[6] || '';
    const videoVal = row[7] || '';
    const suiviVal = row[8] || '';

    // Let's build the fiche object
    // We will clean the titles
    const cleanTitle = titleVal.replace(/^0+/, ''); // remove leading zeroes if any

    const fiche = {
      id: idCounter++,
      title: cleanTitle,
      topic: "Digital CDO & SD",
      action: "Suivre le module d'apprentissage digital CDO & SD.",
      motorsLink: "",
      status5: "A faire",
      coursFile: cleanTitle,
      coursFileUrl: pdfVal || '',
      audio5: audioVal || undefined,
      slide5: slideVal || undefined,
      video5: videoVal || undefined,
      nblm5: nblmVal || undefined,
      info5: infoVal || undefined,
      studi: lienVal || undefined,
      inZoneD: false,
      inZoneE: true
    };
    fiches.push(fiche);
  }

  console.log(`Successfully parsed ${fiches.length} elements for Zone E.`);

  const outputContent = `import { Fiche } from '../types';

export const digitalFiches: Fiche[] = ${JSON.stringify(fiches, null, 2)};
`;

  fs.writeFileSync('./src/data/digitalFiches.ts', outputContent);
  console.log("Saved fiches output to /src/data/digitalFiches.ts");
}

parseCsv();
