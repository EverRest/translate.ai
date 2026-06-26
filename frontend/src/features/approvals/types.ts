export type ReviewItem = {
  id: string;
  key: string;
  sourceText: string;
  language: string;
  value: string;
  status: string;
  version: number;
  reviewer: string | null;
};

export type ReviewStatusFilter = 'pending' | 'approved';
