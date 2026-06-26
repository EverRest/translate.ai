import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@translate.ai').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const tenantName = process.env.ADMIN_TENANT_NAME ?? 'Default';

  const passwordHash = await argon2.hash(password);

  const baseSlug = slugify(tenantName) || 'default';
  let slug = baseSlug;
  let suffix = 0;

  while (await prisma.tenant.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  let tenant = await prisma.tenant.findFirst({
    where: { name: tenantName },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: tenantName, slug },
    });
    console.log(`Created tenant "${tenant.name}" (${tenant.slug})`);
  } else {
    console.log(`Using existing tenant "${tenant.name}" (${tenant.slug})`);
  }

  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        role: UserRole.admin,
      },
    });
    console.log(`Updated admin user ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      password: passwordHash,
      role: UserRole.admin,
    },
  });

  console.log(`Created admin user ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
