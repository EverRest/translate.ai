/**
 * Seed a project with inconsistent RU translations for shared UI tokens
 * (Title → Заголовок vs Название) to reproduce terminology drift.
 *
 * Usage (from repo root, postgres running):
 *   make repro-drift
 *   make repro-drift SCAN=1          # also persist terminology_issues + queue scan via API
 *   make repro-drift CLEAN=1         # delete previous repro projects first
 *
 * Env:
 *   DATABASE_URL          — required (backend/.env)
 *   REPRO_ADMIN_EMAIL     — default admin@translate.ai
 *   REPRO_LANGUAGE        — default ru
 *   API_BASE_URL          — default http://localhost:3000/api/v1 (for --scan-api)
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';
import {
  PrismaClient,
  TerminologyIssueSeverity,
  TranslationStatus,
} from '@prisma/client';
import { detectTerminologyDrift } from '../src/glossary/application/terminology-drift.utils';

const prisma = new PrismaClient();

const PROJECT_NAME_PREFIX = 'Terminology Drift Repro';
const SOURCE_LANG = 'en';

type ReproField = {
  key: string;
  sourceText: string;
  /** Intentionally inconsistent RU translation for this key */
  targetValue: string;
};

/** Mimics materialized localization-object keys (`form_slug: Title`). */
const REPRO_FIELDS: ReproField[] = [
  { key: 'registration_form: Title', sourceText: 'Title', targetValue: 'Заголовок' },
  { key: 'login_form: Title', sourceText: 'Title', targetValue: 'Название' },
  { key: 'checkout_form: Title', sourceText: 'Title', targetValue: 'Название' },
  { key: 'profile_page: Title', sourceText: 'Title', targetValue: 'Заголовок' },
  { key: 'registration_form: Label', sourceText: 'Label', targetValue: 'Метка' },
  { key: 'login_form: Label', sourceText: 'Label', targetValue: 'Надпись' },
  { key: 'settings_form: Submit', sourceText: 'Submit', targetValue: 'Отправить' },
  { key: 'checkout_form: Submit', sourceText: 'Submit', targetValue: 'Подтвердить' },
];

function parseArgs(argv: string[]) {
  return {
    clean: argv.includes('--clean'),
    persistScan: argv.includes('--persist-scan'),
    scanApi: argv.includes('--scan-api'),
    dryRun: argv.includes('--dry-run'),
  };
}

async function findAdminTenant(adminEmail: string) {
  const user = await prisma.user.findFirst({
    where: { email: adminEmail.toLowerCase() },
    include: { tenant: true },
  });
  if (!user) {
    throw new Error(
      `Admin user ${adminEmail} not found. Run: make db-seed`,
    );
  }
  return { tenantId: user.tenantId, userId: user.id };
}

async function cleanReproProjects(tenantId: string) {
  const projects = await prisma.project.findMany({
    where: { tenantId, name: { startsWith: PROJECT_NAME_PREFIX } },
    select: { id: true, name: true },
  });
  for (const project of projects) {
    await prisma.project.delete({ where: { id: project.id } });
    console.log(`Deleted repro project: ${project.name}`);
  }
}

async function ensureProject(tenantId: string) {
  const suffix = Date.now();
  const name = `${PROJECT_NAME_PREFIX} ${suffix}`;

  const project = await prisma.project.create({
    data: {
      tenantId,
      name,
      description:
        'Auto-generated corpus for Title/Label terminology drift reproduction',
      languages: {
        create: [
          { code: SOURCE_LANG, isDefault: true },
          { code: process.env.REPRO_LANGUAGE ?? 'ru', isDefault: false },
        ],
      },
    },
  });

  return project;
}

async function seedFields(
  projectId: string,
  language: string,
  fields: ReproField[],
) {
  const createdKeys: Array<{ id: string; key: string; ru: string }> = [];

  for (const field of fields) {
    const translationKey = await prisma.translationKey.upsert({
      where: {
        projectId_key: { projectId, key: field.key },
      },
      create: {
        projectId,
        key: field.key,
        sourceText: field.sourceText,
        description: 'repro-terminology-drift script',
        contentType: 'text',
      },
      update: {
        sourceText: field.sourceText,
      },
    });

    const existingTranslation = await prisma.translation.findFirst({
      where: {
        translationKeyId: translationKey.id,
        language,
      },
    });

    if (existingTranslation) {
      await prisma.translation.update({
        where: { id: existingTranslation.id },
        data: {
          value: field.targetValue,
          status: TranslationStatus.draft,
          provider: 'repro-script',
        },
      });
    } else {
      await prisma.translation.create({
        data: {
          translationKeyId: translationKey.id,
          language,
          value: field.targetValue,
          status: TranslationStatus.draft,
          provider: 'repro-script',
        },
      });
    }

    createdKeys.push({
      id: translationKey.id,
      key: field.key,
      ru: field.targetValue,
    });
  }

  return createdKeys;
}

async function persistDriftIssues(projectId: string) {
  const rows = await prisma.translation.findMany({
    where: {
      translationKey: { projectId },
      value: { not: '' },
    },
    select: {
      language: true,
      value: true,
      translationKey: {
        select: { id: true, key: true, sourceText: true },
      },
    },
  });

  const corpus = rows.map((row) => ({
    keyId: row.translationKey.id,
    key: row.translationKey.key,
    sourceText: row.translationKey.sourceText ?? '',
    language: row.language,
    value: row.value,
  }));

  const candidates = detectTerminologyDrift(corpus);
  const scanId = randomUUID();

  for (const candidate of candidates) {
    await prisma.terminologyIssue.create({
      data: {
        projectId,
        sourceTerm: candidate.sourceTerm,
        language: candidate.language,
        variants: candidate.variants,
        severity: candidate.severity as TerminologyIssueSeverity,
        scanId,
        status: 'open',
      },
    });
  }

  return { scanId, issueCount: candidates.length, candidates };
}

async function scanViaApi(projectId: string, adminEmail: string) {
  const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: HTTP ${loginRes.status}. Is API running?`);
  }
  const loginBody = (await loginRes.json()) as {
    data?: { accessToken?: string };
  };
  const token = loginBody.data?.accessToken;
  if (!token) {
    throw new Error('Login response missing accessToken');
  }

  const scanRes = await fetch(`${baseUrl}/projects/${projectId}/terminology/scan`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!scanRes.ok) {
    throw new Error(`Scan enqueue failed: HTTP ${scanRes.status}`);
  }

  console.log('Queued terminology.scan — ensure worker is running (make dev-worker)');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const adminEmail = process.env.REPRO_ADMIN_EMAIL ?? 'admin@translate.ai';
  const language = process.env.REPRO_LANGUAGE ?? 'ru';

  console.log('==> Terminology drift repro script');
  console.log(`    language=${language}, fields=${REPRO_FIELDS.length}`);

  const { tenantId } = await findAdminTenant(adminEmail);

  if (args.clean) {
    await cleanReproProjects(tenantId);
  }

  if (args.dryRun) {
    console.log('\nDry run — would create keys:');
    for (const field of REPRO_FIELDS) {
      console.log(`  ${field.key} → [${language}] ${field.targetValue}`);
    }
    return;
  }

  const project = await ensureProject(tenantId);
  const keys = await seedFields(project.id, language, REPRO_FIELDS);

  console.log(`\nCreated project: ${project.name}`);
  console.log(`Project ID: ${project.id}`);
  console.log(`\nKeys (${keys.length}):`);
  for (const row of keys) {
    console.log(`  ${row.key} → [${language}] ${row.ru}`);
  }

  const preview = detectTerminologyDrift(
    keys.map((row) => {
      const field = REPRO_FIELDS.find((item) => item.key === row.key)!;
      return {
        keyId: row.id,
        key: row.key,
        sourceText: field.sourceText,
        language,
        value: row.ru,
      };
    }),
  );

  console.log(`\nExpected drift issues (${preview.length}):`);
  for (const issue of preview) {
    const variants = issue.variants
      .map((variant) => `${variant.value}×${variant.count}`)
      .join(', ');
    console.log(
      `  [${issue.severity}] ${issue.sourceTerm} (${issue.language}): ${variants}`,
    );
  }

  if (args.persistScan) {
    const persisted = await persistDriftIssues(project.id);
    console.log(
      `\nPersisted ${persisted.issueCount} open issue(s), scanId=${persisted.scanId}`,
    );
  }

  if (args.scanApi) {
    await scanViaApi(project.id, adminEmail);
  }

  const uiBase = process.env.UI_BASE_URL ?? 'http://localhost:5173';
  console.log('\nNext steps:');
  console.log(`  UI:  ${uiBase}/projects/${project.id}/glossary?tab=drift`);
  console.log(`  UI:  ${uiBase}/projects/${project.id}/translations`);
  if (!args.scanApi && !args.persistScan) {
    console.log('  Run: make repro-drift SCAN=1   (persist + queue scan)');
  }
  if (args.scanApi) {
    console.log('  Worker must process terminology.scan, then refresh Drift tab');
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
