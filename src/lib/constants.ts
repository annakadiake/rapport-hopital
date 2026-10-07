// Liste des services. L'identifiant (id) ne doit contenir ni "_" ni majuscules.
export const SERVICES = [
  { id: 'medecine-generale', nom: 'Médecine générale' },
  { id: 'pediatrie', nom: 'Pédiatrie' },
  { id: 'cardiologie', nom: 'Cardiologie' },
  { id: 'urologie', nom: 'Urologie' },
  { id: 'pneumologie', nom: 'Pneumologie' },
  { id: 'maladies-infectieuses', nom: 'Maladies infectieuses' },
  { id: 'neurologie', nom: 'Neurologie' },
  { id: 'anesthesie-reanimation', nom: 'Anesthésie-Réanimation' },
  { id: 'chirurgie-generale', nom: 'Chirurgie générale' },
  { id: 'neurochirurgie', nom: 'Neurochirurgie' },
  { id: 'ophtalmologie', nom: 'Ophtalmologie' },
  { id: 'orl', nom: 'ORL' },
  { id: 'gyneco-obstetrique', nom: 'Gynéco-obstétrique' },
  { id: 'reeducation-fonctionnelle', nom: 'Rééducation fonctionnelle' },
  { id: 'orthopedie', nom: 'Orthopédie' },
  { id: 'imagerie-medicale', nom: 'Imagerie médicale' },
  { id: 'oncologie-medicale', nom: 'Oncologie médicale' },
] as const

export const nomService = (id?: string) =>
  SERVICES.find((s) => s.id === id)?.nom ?? id ?? ''

// Champs du formulaire. Les "key" doivent rester identiques à ceux de firestore.rules.
export const CHAMPS = [
  { key: 'malades', label: 'Nombre de malades', court: 'Malades', groupe: 'hospi' },
  { key: 'exeat', label: "Nombre d'exeat", court: 'Exeat', groupe: 'hospi' },
  { key: 'maladesSortis', label: 'Nombre de malades sortis', court: 'Sortis', groupe: 'hospi' },
  { key: 'journees', label: "Nombre de journées d'hospitalisation", court: 'Journées', groupe: 'hospi' },
  { key: 'dc', label: 'Nombre de DC', court: 'DC', groupe: 'hospi' },
  { key: 'transferes', label: 'Nombre de malades transférés', court: 'Transférés', groupe: 'hospi' },
  { key: 'ecg', label: "Nombre d'ECG exécutés", court: 'ECG', groupe: 'hospi' },
  { key: 'dcTable', label: 'Nombre de DC/table', court: 'DC/table', groupe: 'hospi' },
  { key: 'arrivesDCD', label: 'Nombre de malades arrivés DCD', court: 'Arrivés DCD', groupe: 'hospi' },
  { key: 'referes', label: 'Nombre de malades référés', court: 'Référés', groupe: 'hospi' },
  { key: 'evacues', label: 'Nombre de malades évacués', court: 'Évacués', groupe: 'hospi' },
  { key: 'lits', label: 'Nombre de lits', court: 'Lits', groupe: 'hospi' },
  { key: 'consultants', label: 'Consultants', court: 'Consultants', groupe: 'consult' },
  { key: 'consultations', label: 'Consultations', court: 'Consultations', groupe: 'consult' },
] as const

export type ChampKey = (typeof CHAMPS)[number]['key']
export type Donnees = Record<ChampKey, number | null>

export const donneesVides = (): Donnees =>
  Object.fromEntries(CHAMPS.map((c) => [c.key, null])) as Donnees

export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
