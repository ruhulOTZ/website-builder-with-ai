// inject-corrupt-site.ts — inserts a GeneratedSiteRecord with invalid siteJson
// so the render route's schema-validation error path can be tested manually.
// Run: ts-node --transpile-only --project tsconfig.build.json scripts/inject-corrupt-site.ts
import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const record = await prisma.generatedSiteRecord.create({
      data: {
        siteJson: { corrupt: true, missing: 'all required fields' },
        modelUsed: 'test-corrupt',
        promptVersion: 'test-corrupt',
        userId: null,
      },
      select: { id: true },
    });
    console.log('\nInserted corrupt GeneratedSiteRecord.');
    console.log(`  id: ${record.id}`);
    console.log(`\nRender URL (expect schema error UI): http://localhost:3000/render/${record.id}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
