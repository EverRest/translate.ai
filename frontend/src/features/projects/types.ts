export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
};
