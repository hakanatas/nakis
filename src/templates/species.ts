/** Kid-friendly information card attached to an endemic species template. */
export type ConservationStatus = 'nadir' | 'hassas' | 'tehlikede' | 'koruma';

export const STATUS_LABELS: Record<ConservationStatus, string> = {
  nadir: 'Nadir',
  hassas: 'Hassas',
  tehlikede: 'Tehlikede',
  koruma: 'Koruma altında',
};

export interface SpeciesInfo {
  /** Turkish common name */
  name: string;
  latin: string;
  /** Memeli, Kurbağa, Çiçek, Ağaç, Balık ... */
  group: string;
  emoji: string;
  /** Where in Türkiye it lives */
  region: string;
  habitat: string;
  status: ConservationStatus;
  /** "Biliyor muydun?" */
  fact: string;
  /** Why it matters / how to protect it */
  why: string;
}
