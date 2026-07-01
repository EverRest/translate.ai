export interface GlossaryPresetTerm {
  sourceTerm: string;
  targetTerm?: string | null;
  doNotTranslate?: boolean;
  note?: string;
}

export interface GlossaryPreset {
  id: string;
  name: string;
  description: string;
  terms: GlossaryPresetTerm[];
}

export const GLOSSARY_PRESETS: GlossaryPreset[] = [
  {
    id: 'fifa_accreditation',
    name: 'FIFA Sports Terminology',
    description:
      'Starter glossary for FIFA accreditation and venue operations (≥20 terms, brand names protected).',
    terms: [
      {
        sourceTerm: 'FIFA',
        doNotTranslate: true,
        note: 'Brand name — never translate',
      },
      {
        sourceTerm: 'World Cup',
        doNotTranslate: true,
        note: 'Competition brand',
      },
      {
        sourceTerm: 'LOC',
        doNotTranslate: true,
        note: 'Local Organising Committee acronym',
      },
      {
        sourceTerm: 'Accreditation',
        note: 'FR: Accréditation; ES: Acreditación — use official FIFA forms',
      },
      {
        sourceTerm: 'Accreditation Badge',
        note: 'FR: Badge d’accréditation; ES: Credencial de acreditación',
      },
      {
        sourceTerm: 'Media Accreditation',
        note: 'FR: Accréditation médias; ES: Acreditación de medios',
      },
      {
        sourceTerm: 'Workforce Accreditation',
        note: 'FR: Accréditation personnel; ES: Acreditación de personal',
      },
      { sourceTerm: 'Venue', note: 'FR: Site / Stade; ES: Sede / Estadio' },
      { sourceTerm: 'Stadium', note: 'FR: Stade; ES: Estadio' },
      { sourceTerm: 'Host City', note: 'FR: Ville hôte; ES: Ciudad sede' },
      {
        sourceTerm: 'Privilege',
        note: 'FR: Privilège (access level); ES: Privilegio',
      },
      {
        sourceTerm: 'Registration Group',
        note: 'FR: Groupe d’enregistrement; ES: Grupo de registro',
      },
      {
        sourceTerm: 'Access Control',
        note: 'FR: Contrôle d’accès; ES: Control de acceso',
      },
      {
        sourceTerm: 'Security Screening',
        note: 'FR: Contrôle de sécurité; ES: Control de seguridad',
      },
      { sourceTerm: 'Delegation', note: 'FR: Délégation; ES: Delegación' },
      {
        sourceTerm: 'Confederation',
        note: 'FR: Confédération; ES: Confederación',
      },
      {
        sourceTerm: 'Match Official',
        note: 'FR: Officiel de match; ES: Oficial de partido',
      },
      { sourceTerm: 'Broadcaster', note: 'FR: Diffuseur; ES: Difusor' },
      {
        sourceTerm: 'Official Partner',
        note: 'FR: Partenaire officiel; ES: Socio oficial',
      },
      { sourceTerm: 'Volunteer', note: 'FR: Bénévole; ES: Voluntario/a' },
      {
        sourceTerm: 'Ticket Holder',
        note: 'FR: Détenteur de billet; ES: Titular de entrada',
      },
      { sourceTerm: 'Competition', note: 'FR: Compétition; ES: Competición' },
      { sourceTerm: 'Pitch', note: 'FR: Terrain; ES: Campo de juego' },
      { sourceTerm: 'Match', note: 'FR: Match; ES: Partido' },
      {
        sourceTerm: 'Team Base Camp',
        note: 'FR: Base de l’équipe; ES: Base del equipo',
      },
    ],
  },
];

export function getGlossaryPreset(id: string): GlossaryPreset | undefined {
  return GLOSSARY_PRESETS.find((preset) => preset.id === id);
}
