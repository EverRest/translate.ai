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
