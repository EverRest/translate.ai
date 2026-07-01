import { DomainPreset } from './domain-profile.types';

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: 'fifa_accreditation',
    name: 'FIFA Accreditation',
    description:
      'Formal accreditation forms and badges for FIFA World Cup — official sports terminology, especially for FR/ES.',
    glossaryPresetId: 'fifa_accreditation',
    profile: {
      domain: 'sports',
      event: 'FIFA World Cup 2026',
      tone: 'formal',
      audience: 'accreditation',
      notes:
        'Official FIFA accreditation copy. Use established FIFA terminology; preserve brand names and competition titles.',
      localeNotes: {
        fr: 'Use official FIFA French terminology (e.g. Accréditation, Stade, Privilège). Avoid informal or generic sports wording.',
        es: 'Use official FIFA Spanish terminology (e.g. Acreditación, Estadio, Privilegio). Prefer formal register used in FIFA publications.',
      },
    },
  },
  {
    id: 'fifa_venue_ops',
    name: 'FIFA Venue Operations',
    description:
      'Venue operations, access control, and workforce copy for match-day and stadium operations.',
    glossaryPresetId: 'fifa_accreditation',
    profile: {
      domain: 'sports',
      event: 'FIFA World Cup 2026',
      tone: 'formal',
      audience: 'venue operations',
      notes:
        'Stadium and venue operations terminology. Short UI labels where applicable; precise operational language.',
      localeNotes: {
        fr: 'Terminologie opérationnelle des sites — privilèges d’accès, zones, contrôles de sécurité.',
        es: 'Terminología operativa de sedes — privilegios de acceso, zonas, controles de seguridad.',
      },
    },
  },
];

export function getDomainPreset(id: string): DomainPreset | undefined {
  return DOMAIN_PRESETS.find((preset) => preset.id === id);
}
