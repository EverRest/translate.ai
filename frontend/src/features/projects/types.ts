export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  keysCount: number;
  languages: { code: string; isDefault: boolean }[];
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
};
