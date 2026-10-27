#!/usr/bin/env node
'use strict';
/**
 * Standalone CLI SQLite database backup runner.
 * Usage: node scripts/backup.js
 */
const { createBackup, pruneBackups, listBackups } = require('../lib/backup');

console.log('Initiating lock-free SQLite online backup...');
try {
  const result = createBackup();
  console.log(`Backup completed successfully: ${result.filename} (${Math.round(result.size / 1024)} KB)`);
  
  const pruned = pruneBackups();
  if (pruned.length > 0) {
    console.log(`Pruned ${pruned.length} backup(s) older than 14-day retention.`);
  }

  const all = listBackups();
  console.log(`Total snapshots available: ${all.length}`);
  process.exit(0);
} catch (err) {
  console.error('Backup failed:', err);
  process.exit(1);
}
