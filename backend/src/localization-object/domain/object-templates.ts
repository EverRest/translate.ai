import type { StructureNodeInput } from './structure-generate.utils';

export interface ObjectTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'form' | 'page' | 'modal' | 'email' | 'api' | 'custom';
  nodes: StructureNodeInput[];
}

const TEMPLATES: ObjectTemplate[] = [
  {
    id: 'registration_form',
    name: 'Registration Form',
    description: 'Email signup with validation and submit/cancel actions',
    templateType: 'form',
    nodes: [
      {
        slug: 'title',
        nodeType: 'text',
        sourceText: 'Create account',
      },
      {
        slug: 'description',
        nodeType: 'text',
        sourceText: 'Create your account to continue.',
      },
      {
        slug: 'fields',
        nodeType: 'section',
        children: [
          {
            slug: 'email',
            nodeType: 'field',
            children: [
              {
                slug: 'label',
                nodeType: 'label',
                sourceText: 'Email',
              },
              {
                slug: 'placeholder',
                nodeType: 'placeholder',
                sourceText: 'Enter your email',
              },
              {
                slug: 'errors',
                nodeType: 'section',
                children: [
                  {
                    slug: 'required',
                    nodeType: 'error',
                    sourceText: 'Email is required',
                  },
                  {
                    slug: 'invalid',
                    nodeType: 'error',
                    sourceText: 'Invalid email address',
                  },
                ],
              },
            ],
          },
          {
            slug: 'password',
            nodeType: 'field',
            children: [
              {
                slug: 'label',
                nodeType: 'label',
                sourceText: 'Password',
              },
              {
                slug: 'placeholder',
                nodeType: 'placeholder',
                sourceText: 'Create a password',
              },
              {
                slug: 'errors',
                nodeType: 'section',
                children: [
                  {
                    slug: 'required',
                    nodeType: 'error',
                    sourceText: 'Password is required',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        slug: 'buttons',
        nodeType: 'section',
        children: [
          {
            slug: 'submit',
            nodeType: 'button',
            sourceText: 'Create account',
          },
          {
            slug: 'cancel',
            nodeType: 'button',
            sourceText: 'Cancel',
          },
        ],
      },
    ],
  },
  {
    id: 'login_form',
    name: 'Login Form',
    description: 'Email and password login',
    templateType: 'form',
    nodes: [
      {
        slug: 'title',
        nodeType: 'text',
        sourceText: 'Sign in',
      },
      {
        slug: 'fields',
        nodeType: 'section',
        children: [
          {
            slug: 'email',
            nodeType: 'field',
            children: [
              {
                slug: 'label',
                nodeType: 'label',
                sourceText: 'Email',
              },
              {
                slug: 'placeholder',
                nodeType: 'placeholder',
                sourceText: 'Enter your email',
              },
            ],
          },
          {
            slug: 'password',
            nodeType: 'field',
            children: [
              {
                slug: 'label',
                nodeType: 'label',
                sourceText: 'Password',
              },
              {
                slug: 'placeholder',
                nodeType: 'placeholder',
                sourceText: 'Enter your password',
              },
            ],
          },
        ],
      },
      {
        slug: 'buttons',
        nodeType: 'section',
        children: [
          {
            slug: 'submit',
            nodeType: 'button',
            sourceText: 'Sign in',
          },
          {
            slug: 'forgot_password',
            nodeType: 'text',
            sourceText: 'Forgot password?',
          },
        ],
      },
    ],
  },
];

export function listObjectTemplates(): ObjectTemplate[] {
  return TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    templateType: template.templateType,
    nodes: [],
  }));
}

export function getObjectTemplate(id: string): ObjectTemplate | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
