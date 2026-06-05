export type FicheStatus = 'Fait' | 'En cours' | 'A faire';

export interface Fiche {
  id: number;
  title: string;
  topic: string; // 'HTML & CSS' | 'Bootstrap' | 'Bases de Données' | 'Python' | 'Flask' | 'APIs' | 'Méthodologie & Sécurité'
  action: string;
  motorsLink: string;
  date1?: string;
  date2?: string;
  status1: FicheStatus;
  status2: FicheStatus;
  coursFile: string;
  coursFileUrl?: string;
  
  // Zone A / Tab 1 resources (Evaluation progress / Needs response)
  audio1?: string;
  slide1?: string;
  video1?: string;
  image1?: string;
  nblm1?: string;
  
  // Zone B / Tab 2 resources (Response to jury)
  audio2?: string;
  slide2?: string;
  video2?: string;
  image2?: string;
  nblm2?: string;

  // Zone C / Tab 3 resources (Common)
  status3?: FicheStatus;
  date3?: string;
  audio3?: string;
  slide3?: string;
  video3?: string;
  image3?: string;
  nblm3?: string;
  
  // Common resources
  studi?: string;
  suivi1?: string;
  suivi2?: string;
  suivi3?: string;

  // Zone presence flags
  inZoneA?: boolean;
  inZoneB?: boolean;
  inZoneC?: boolean;
}

export interface MetricCardConfig {
  title: string;
  value: string;
  subtitle: string;
  color: string; // e.g. 'blue', 'red', 'yellow', 'green' (Google Colors)
  iconName: string;
}
