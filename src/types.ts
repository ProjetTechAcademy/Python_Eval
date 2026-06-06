export type FicheStatus = 'Fait' | 'En cours' | 'A faire';

export interface Fiche {
  id: number;
  title: string;
  topic: string; // 'HTML & CSS' | 'Bootstrap' | 'Bases de Données' | 'Python' | 'Flask' | 'APIs' | 'Méthodologie & Sécurité'
  action: string;
  motorsLink: string;
  date1?: string;
  date2?: string;
  status1?: FicheStatus;
  status2?: FicheStatus;
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

  // Zone D / Tab 4 resources (DWWM)
  status4?: FicheStatus;
  date4?: string;
  audio4?: string;
  slide4?: string;
  video4?: string;
  image4?: string;
  nblm4?: string;

  // Zone E / Tab 5 resources (Digital CDO & SDE)
  status5?: FicheStatus;
  date5?: string;
  audio5?: string;
  slide5?: string;
  video5?: string;
  image5?: string;
  nblm5?: string;
  info5?: string;
  
  // Common resources
  studi?: string;
  suivi1?: string;
  suivi2?: string;
  suivi3?: string;
  suivi4?: string;
  suivi5?: string;

  // Zone presence flags
  inZoneA?: boolean;
  inZoneB?: boolean;
  inZoneC?: boolean;
  inZoneD?: boolean;
  inZoneE?: boolean;
}

export interface MetricCardConfig {
  title: string;
  value: string;
  subtitle: string;
  color: string; // e.g. 'blue', 'red', 'yellow', 'green' (Google Colors)
  iconName: string;
}

export interface ScheduledDate {
  label: string;
  date: string;
  completed: boolean;
}

export interface Reminder {
  id: string;
  ficheId: number;
  ficheTitle: string;
  topic: string;
  type: 'spaced' | 'custom';
  baseDate: string; // ISO / rounded J0 date
  scheduledDates: ScheduledDate[];
}

