import { TerminologyScanOnJobCompletedHandler } from './terminology-scan-on-job-completed.handler';

describe('TerminologyScanOnJobCompletedHandler', () => {
  it('enqueues scan when autoTerminologyScan is enabled', async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({ autoTerminologyScan: true }),
      },
    };
    const terminologyQueue = {
      enqueueScan: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new TerminologyScanOnJobCompletedHandler(
      prisma as never,
      terminologyQueue as never,
    );

    await handler.handle({
      jobId: 'job-1',
      projectId: 'p1',
      tenantId: 't1',
    });

    expect(terminologyQueue.enqueueScan).toHaveBeenCalledWith({
      projectId: 'p1',
      tenantId: 't1',
    });
  });

  it('skips scan when autoTerminologyScan is disabled', async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({ autoTerminologyScan: false }),
      },
    };
    const terminologyQueue = {
      enqueueScan: jest.fn(),
    };
    const handler = new TerminologyScanOnJobCompletedHandler(
      prisma as never,
      terminologyQueue as never,
    );

    await handler.handle({
      jobId: 'job-1',
      projectId: 'p1',
      tenantId: 't1',
    });

    expect(terminologyQueue.enqueueScan).not.toHaveBeenCalled();
  });

  it('skips scan when project is missing', async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const terminologyQueue = {
      enqueueScan: jest.fn(),
    };
    const handler = new TerminologyScanOnJobCompletedHandler(
      prisma as never,
      terminologyQueue as never,
    );

    await handler.handle({
      jobId: 'job-1',
      projectId: 'p1',
      tenantId: 't1',
    });

    expect(terminologyQueue.enqueueScan).not.toHaveBeenCalled();
  });
});
