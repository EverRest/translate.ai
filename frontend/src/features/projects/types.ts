export type DomainProfile = {
  domain?: string;
  event?: string;
  tone?: string;
  audience?: string;
  notes?: string;
  localeNotes?: Record<string, string>;
};

export type DomainPreset = {
  id: string;
  name: string;
  description: string;
  profile: DomainProfile;
  glossaryPresetId: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  domainProfile: DomainProfile | null;
  autoTerminologyScan?: boolean;
  status: string;
  createdAt: string;
  keysCount: number;
  languages: { code: string; isDefault: boolean }[];
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  domainProfile?: DomainProfile;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
  domainProfile?: DomainProfile | null;
  autoTerminologyScan?: boolean;
};
