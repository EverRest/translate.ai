export type BranchStatus = 'active' | 'merged' | 'archived';

export type ProjectBranch = {
  id: string;
  name: string;
  isDefault: boolean;
  status: BranchStatus;
  createdAt: string;
  mergedAt: string | null;
};

export type BranchDiffItem = {
  translationKeyId: string;
  key: string;
  language: string;
  mainValue: string | null;
  branchValue: string;
  changeType: 'added' | 'changed';
};

export type MergeBranchResult = {
  branch: ProjectBranch;
  mergedCount: number;
};

export type UpdateBranchTranslationInput = {
  translationKeyId: string;
  language: string;
  value: string;
};
