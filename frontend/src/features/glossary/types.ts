export type GlossaryTerm = {
  id: string;
  sourceTerm: string;
  targetTerm: string | null;
  doNotTranslate: boolean;
  note: string | null;
};

export type CreateGlossaryTermInput = {
  sourceTerm: string;
  targetTerm?: string;
  doNotTranslate?: boolean;
  note?: string;
};

export type UpdateGlossaryTermInput = {
  sourceTerm?: string;
  targetTerm?: string;
  doNotTranslate?: boolean;
  note?: string;
};

export type GlossarySuggestion = {
  id: string;
  sourceTerm: string;
  targetTerm: string | null;
  doNotTranslate: boolean;
  confidence: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
};

export type AnalyzeGlossaryResult = {
  queued: boolean;
  translationCount: number;
};

export type DriftVariant = {
  translation: string;
  keyIds: string[];
  keys: string[];
};

export type TerminologyDriftIssue = {
  id: string;
  sourceTerm: string;
  targetLang: string;
  variants: DriftVariant[];
  status: 'open' | 'resolved';
  canonicalTranslation: string | null;
  detectedAt: string;
  resolvedAt: string | null;
};

export type GlossaryPageTab = 'terms' | 'suggestions' | 'drift';
