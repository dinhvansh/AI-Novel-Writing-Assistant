#!/usr/bin/env node
/**
 * backfill-seed-slugs.mjs
 *
 * Backfills the `slug` column for NovelGenre, NovelStoryMode, StyleTemplate,
 * and AntiAiRule rows that don't yet have a slug.
 *
 * Strategy:
 *   - NovelGenre / NovelStoryMode: slug = row.id (already slug-like, e.g. genre_fantasy_root)
 *   - StyleTemplate: slug = row.key (already set on seed rows)
 *   - AntiAiRule: slug = row.key
 *
 * This is idempotent — rows that already have a slug are skipped.
 *
 * Usage:
 *   node scripts/i18n/backfill-seed-slugs.mjs [--dry-run]
 */

import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const isDryRun = process.argv.includes("--dry-run");

// Load Prisma from server — must run from server directory
const serverRoot = path.resolve(__dirname, "../../server");

// Set DATABASE_URL for SQLite if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(serverRoot, "dev.db")}`;
}
// Force SQLite mode
process.env.AI_NOVEL_DATABASE_MODE = "sqlite";

// Use server's prisma client (generated for SQLite)
const { PrismaClient } = require(path.join(serverRoot, "node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function backfill() {
  let total = 0;
  let skipped = 0;
  let updated = 0;

  // --- NovelGenre: slug = id ---
  const genres = await prisma.novelGenre.findMany({ select: { id: true, slug: true } });
  for (const row of genres) {
    if (row.slug) { skipped++; continue; }
    const slug = row.id; // e.g. genre_fantasy_root
    if (isDryRun) {
      console.log(`[dry-run] NovelGenre ${row.id} → slug=${slug}`);
    } else {
      await prisma.novelGenre.update({ where: { id: row.id }, data: { slug } });
    }
    updated++;
    total++;
  }

  // --- NovelStoryMode: slug = id ---
  const modes = await prisma.novelStoryMode.findMany({ select: { id: true, slug: true } });
  for (const row of modes) {
    if (row.slug) { skipped++; continue; }
    const slug = row.id; // e.g. story_mode_power_root
    if (isDryRun) {
      console.log(`[dry-run] NovelStoryMode ${row.id} → slug=${slug}`);
    } else {
      await prisma.novelStoryMode.update({ where: { id: row.id }, data: { slug } });
    }
    updated++;
    total++;
  }

  // --- StyleTemplate: slug = key ---
  const templates = await prisma.styleTemplate.findMany({ select: { id: true, key: true, slug: true } }).catch(() => []);
  for (const row of templates) {
    if (row.slug) { skipped++; continue; }
    const slug = row.key ?? null;
    if (!slug) { console.warn(`StyleTemplate ${row.id} has no key, skipping`); skipped++; continue; }
    if (isDryRun) {
      console.log(`[dry-run] StyleTemplate ${row.id} → slug=${slug}`);
    } else {
      await prisma.styleTemplate.update({ where: { id: row.id }, data: { slug } });
    }
    updated++;
    total++;
  }

  // --- AntiAiRule: slug = key ---
  const rules = await prisma.antiAiRule.findMany({ select: { id: true, key: true, slug: true } }).catch(() => []);
  for (const row of rules) {
    if (row.slug) { skipped++; continue; }
    const slug = row.key ?? null;
    if (!slug) { console.warn(`AntiAiRule ${row.id} has no key, skipping`); skipped++; continue; }
    if (isDryRun) {
      console.log(`[dry-run] AntiAiRule ${row.id} → slug=${slug}`);
    } else {
      await prisma.antiAiRule.update({ where: { id: row.id }, data: { slug } });
    }
    updated++;
    total++;
  }

  console.log(`\nBackfill complete: ${updated} updated, ${skipped} already had slug.`);
  if (isDryRun) console.log("(dry-run — no changes written)");
}

backfill()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
