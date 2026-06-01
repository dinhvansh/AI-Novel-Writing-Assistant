/**
 * Backfill seed slugs — run via:
 *   pnpm --filter @ai-novel/server ts-node --transpile-only scripts/backfill-seed-slugs.ts [--dry-run]
 */
import "dotenv/config";
import { prisma } from "../src/db/prisma";

const isDryRun = process.argv.includes("--dry-run");

async function backfill() {
  let updated = 0;
  let skipped = 0;

  // NovelGenre: slug = id (e.g. genre_fantasy_root)
  const genres = await prisma.novelGenre.findMany({ select: { id: true, slug: true } });
  for (const row of genres) {
    if (row.slug) { skipped++; continue; }
    if (isDryRun) {
      console.log(`[dry-run] NovelGenre ${row.id} → slug=${row.id}`);
    } else {
      await prisma.novelGenre.update({ where: { id: row.id }, data: { slug: row.id } });
    }
    updated++;
  }

  // NovelStoryMode: slug = id (e.g. story_mode_power_root)
  const modes = await prisma.novelStoryMode.findMany({ select: { id: true, slug: true } });
  for (const row of modes) {
    if (row.slug) { skipped++; continue; }
    if (isDryRun) {
      console.log(`[dry-run] NovelStoryMode ${row.id} → slug=${row.id}`);
    } else {
      await prisma.novelStoryMode.update({ where: { id: row.id }, data: { slug: row.id } });
    }
    updated++;
  }

  // StyleTemplate: slug = key
  const templates = await (prisma as any).styleTemplate?.findMany({ select: { id: true, key: true, slug: true } }).catch(() => []) ?? [];
  for (const row of templates) {
    if (row.slug) { skipped++; continue; }
    const slug = row.key ?? null;
    if (!slug) { console.warn(`StyleTemplate ${row.id} has no key, skipping`); skipped++; continue; }
    if (isDryRun) {
      console.log(`[dry-run] StyleTemplate ${row.id} → slug=${slug}`);
    } else {
      await (prisma as any).styleTemplate.update({ where: { id: row.id }, data: { slug } });
    }
    updated++;
  }

  // AntiAiRule: slug = key
  const rules = await (prisma as any).antiAiRule?.findMany({ select: { id: true, key: true, slug: true } }).catch(() => []) ?? [];
  for (const row of rules) {
    if (row.slug) { skipped++; continue; }
    const slug = row.key ?? null;
    if (!slug) { console.warn(`AntiAiRule ${row.id} has no key, skipping`); skipped++; continue; }
    if (isDryRun) {
      console.log(`[dry-run] AntiAiRule ${row.id} → slug=${slug}`);
    } else {
      await (prisma as any).antiAiRule.update({ where: { id: row.id }, data: { slug } });
    }
    updated++;
  }

  console.log(`\nBackfill complete: ${updated} updated, ${skipped} already had slug.`);
  if (isDryRun) console.log("(dry-run — no changes written)");
}

backfill()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
