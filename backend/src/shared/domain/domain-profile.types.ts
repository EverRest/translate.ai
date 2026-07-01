export interface DomainProfile {
  domain?: string;
  event?: string;
  tone?: string;
  audience?: string;
  notes?: string;
  localeNotes?: Record<string, string>;
}

export interface DomainPreset {
  id: string;
  name: string;
  description: string;
  profile: DomainProfile;
  glossaryPresetId?: string;
}
