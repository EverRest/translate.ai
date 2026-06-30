const SAMPLE_OPENAPI = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Demo API', version: '1.0.0' },
  tags: [
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Auth', description: 'Authentication' },
  ],
  paths: {
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Returns a paginated list of users',
        responses: {
          '200': { description: 'Successful response' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        operationId: 'createUser',
        requestBody: {
          description: 'User payload',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', description: 'User email address' },
                  name: { type: 'string', description: 'Display name' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        parameters: [
          {
            name: 'remember',
            in: 'query',
            description: 'Remember session',
          },
        ],
        responses: {
          '200': { description: 'Login successful' },
          '403': { description: 'Invalid credentials' },
        },
      },
    },
  },
});

import { parseOpenApiSpec } from './openapi-to-structure.parser';

describe('parseOpenApiSpec', () => {
  it('parses entities per tag with paths and copy', () => {
    const result = parseOpenApiSpec(SAMPLE_OPENAPI);

    expect(result.availableTags).toEqual(['Auth', 'Users']);
    expect(result.entities).toHaveLength(2);

    const users = result.entities.find((entity) => entity.tag === 'Users');
    expect(users).toBeDefined();
    expect(users!.slug).toBe('users');
    expect(users!.nodeCount).toBeGreaterThan(0);
    expect(users!.nodes.some((node) => node.slug === 'users')).toBe(true);

    const usersPath = users!.nodes.find((node) => node.slug === 'users');
    expect(usersPath?.children?.some((child) => child.slug === 'get')).toBe(
      true,
    );
    expect(usersPath?.children?.some((child) => child.slug === 'create_user')).toBe(
      true,
    );
  });

  it('filters by selected tags', () => {
    const result = parseOpenApiSpec(SAMPLE_OPENAPI, ['Auth']);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].tag).toBe('Auth');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseOpenApiSpec('not-json')).toThrow(/Invalid OpenAPI spec/);
  });
});
