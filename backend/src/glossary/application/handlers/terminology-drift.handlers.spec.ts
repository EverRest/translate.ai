import { NotFoundException } from '@nestjs/common';
import {
  ResolveTerminologyDriftIssueHandler,
  ScanTerminologyDriftHandler,
} from './terminology-drift.handlers';

describe('ScanTerminologyDriftHandler', () => {
  it('enqueues terminology scan after project access check', async () => {
    const projectAccess = {
      getProjectForTenant: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    const terminologyQueue = {
      enqueueScan: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new ScanTerminologyDriftHandler(
      projectAccess as never,
      terminologyQueue as never,
    );

    const result = await handler.execute({
      tenantId: 't1',
      projectId: 'p1',
    });

    expect(projectAccess.getProjectForTenant).toHaveBeenCalledWith('t1', 'p1');
    expect(terminologyQueue.enqueueScan).toHaveBeenCalledWith({
      projectId: 'p1',
      tenantId: 't1',
    });
    expect(result).toEqual({ queued: true });
  });
});

describe('ResolveTerminologyDriftIssueHandler', () => {
  const issue = {
    id: 'issue-1',
    projectId: 'p1',
    sourceTerm: 'Submit',
    targetLang: 'fr',
    variants: [
      { translation: 'Envoyer', keyIds: ['k1'], keys: ['btn.submit'] },
      { translation: 'Soumettre', keyIds: ['k2'], keys: ['form.submit'] },
    ],
    status: 'open',
  };

  it('upserts glossary term and marks issue resolved', async () => {
    const tx = {
      glossaryTerm: {
        upsert: jest.fn().mockResolvedValue({
          id: 'term-1',
          sourceTerm: 'Submit',
          targetTerm: 'Envoyer',
          doNotTranslate: false,
          note: 'Resolved terminology drift (fr)',
        }),
      },
      terminologyDriftIssue: {
        update: jest.fn().mockResolvedValue({
          ...issue,
          status: 'resolved',
          canonicalTranslation: 'Envoyer',
          resolvedAt: new Date('2026-01-01'),
        }),
      },
    };
    const prisma = {
      terminologyDriftIssue: {
        findFirst: jest.fn().mockResolvedValue(issue),
      },
      $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const projectAccess = {
      getProjectForTenant: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    const glossaryService = {
      ensureGlossary: jest.fn().mockResolvedValue({ id: 'g1' }),
    };
    const driftService = {
      mapIssue: jest.fn((value) => value),
    };

    const handler = new ResolveTerminologyDriftIssueHandler(
      prisma,
      projectAccess as never,
      glossaryService,
      driftService,
    );

    const result = await handler.execute({
      tenantId: 't1',
      projectId: 'p1',
      issueId: 'issue-1',
      canonicalTranslation: 'Envoyer',
    });

    expect(tx.glossaryTerm.upsert).toHaveBeenCalled();
    expect(result.term.targetTerm).toBe('Envoyer');
    expect(result.issue.status).toBe('resolved');
  });

  it('rejects unknown canonical translation', async () => {
    const prisma = {
      terminologyDriftIssue: {
        findFirst: jest.fn().mockResolvedValue(issue),
      },
    };
    const handler = new ResolveTerminologyDriftIssueHandler(
      prisma,
      { getProjectForTenant: jest.fn() } as never,
      {},
      { mapIssue: jest.fn() },
    );

    await expect(
      handler.execute({
        tenantId: 't1',
        projectId: 'p1',
        issueId: 'issue-1',
        canonicalTranslation: 'Unknown',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
