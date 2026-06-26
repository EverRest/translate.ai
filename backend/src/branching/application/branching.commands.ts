export class CreateBranchCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly name: string,
  ) {}
}

export class MergeBranchCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly branchId: string,
    public readonly userId: string,
  ) {}
}

export class UpdateBranchTranslationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly branchId: string,
    public readonly translationKeyId: string,
    public readonly language: string,
    public readonly value: string,
  ) {}
}

export class ListBranchesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class GetBranchDiffQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly branchId: string,
  ) {}
}

export const MAIN_BRANCH_NAME = 'main';
