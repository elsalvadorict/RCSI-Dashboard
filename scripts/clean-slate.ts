#!/usr/bin/env bun
/**
 * Clean Slate Script — wipes ALL data from the database for pilot deployment.
 *
 * This deletes:
 *   - All SurveyScore records
 *   - All ResearchRecord records
 *   - All School records
 *   - All UploadBatch audit records
 *
 * After running this, the database is empty and ready for pilot testing.
 * Schools will see empty dashboards with "No data available" messages until
 * they upload their first quarterly survey and research metadata.
 *
 * Usage:  bun run scripts/clean-slate.ts
 *
 * ⚠️  THIS IS IRREVERSIBLE. All data will be permanently deleted.
 *     Take a backup first if you might need the data later.
 */
import { db } from '../src/lib/db';

async function cleanSlate() {
  console.log('⚠️  CLEAN SLATE — Wiping all data from the database…');
  console.log('');

  const surveys = await db.surveyScore.count();
  const research = await db.researchRecord.count();
  const schools = await db.school.count();
  const batches = await db.uploadBatch.count();

  console.log(`  Current data to be deleted:`);
  console.log(`    • ${surveys} survey scores`);
  console.log(`    • ${research} research records`);
  console.log(`    • ${schools} schools`);
  console.log(`    • ${batches} upload batch records`);
  console.log('');

  console.log('→ Deleting survey scores…');
  await db.surveyScore.deleteMany();
  console.log('→ Deleting research records…');
  await db.researchRecord.deleteMany();
  console.log('→ Deleting schools…');
  await db.school.deleteMany();
  console.log('→ Deleting upload audit log…');
  await db.uploadBatch.deleteMany();

  console.log('');

  // Verify
  const surveysAfter = await db.surveyScore.count();
  const researchAfter = await db.researchRecord.count();
  const schoolsAfter = await db.school.count();
  const batchesAfter = await db.uploadBatch.count();

  console.log('✓ Clean slate complete. Database is now empty:');
  console.log(`    • ${surveysAfter} survey scores`);
  console.log(`    • ${researchAfter} research records`);
  console.log(`    • ${schoolsAfter} schools`);
  console.log(`    • ${batchesAfter} upload batch records`);
  console.log('');
  console.log('The app is ready for pilot testing.');
  console.log('Schools will see empty dashboards until they upload their first data.');
}

cleanSlate()
  .catch((e) => {
    console.error('Clean slate failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
