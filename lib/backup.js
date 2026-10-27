'use strict';
/**
 * SQLite backup and restore utility.
 * Uses better-sqlite3's online backup API for crash-safe, lock-free backups.
 * Keeps daily backups for 14 days and supports on-demand backups and restores.
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { db } = require('../db/index');
const { Settings } = require('../db/queries');

async function createBackup(label = 'manual') {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}_${label}.sqlite`;
  const destPath = path.join(config.backupDir, filename);

  try {
    await db.backup(destPath);
    const stats = fs.statSync(destPath);
    Settings.set('last_backup_at', new Date().toISOString());
    Settings.set('last_backup_file', filename);

    // Prune backups older than 14 days
    cleanOldBackups(14);

    return {
      success: true,
      filename,
      filepath: destPath,
      size: stats.size,
      created_at: new Date().toISOString()
    };
  } catch (err) {
    console.error('[backup] Failed:', err);
    throw err;
  }
}

function listBackups() {
  if (!fs.existsSync(config.backupDir)) return [];

  const files = fs.readdirSync(config.backupDir);
  const backups = [];

  for (const f of files) {
    if (f.endsWith('.sqlite')) {
      const fullPath = path.join(config.backupDir, f);
      const stat = fs.statSync(fullPath);
      backups.push({
        filename: f,
        size: stat.size,
        created_at: stat.mtime.toISOString(),
        formatted_size: (stat.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    }
  }

  // Sort descending by created_at
  backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return backups;
}

function cleanOldBackups(retentionDays = 14) {
  if (!fs.existsSync(config.backupDir)) return;
  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(config.backupDir);
  for (const f of files) {
    if (f.endsWith('.sqlite')) {
      const p = path.join(config.backupDir, f);
      const stat = fs.statSync(p);
      if (now - stat.mtimeMs > maxAgeMs) {
        try {
          fs.unlinkSync(p);
        } catch (e) {}
      }
    }
  }
}

async function restoreBackup(filename) {
  const backupFile = path.join(config.backupDir, path.basename(filename));
  if (!fs.existsSync(backupFile)) {
    throw new Error('Backup file not found.');
  }

  // Take a pre-restore safety snapshot first
  await createBackup('pre_restore_safety');

  // To restore into a live better-sqlite3 connection cleanly,
  // we attach and copy tables or replace via online backup
  const backupDb = new (require('better-sqlite3'))(backupFile);
  await backupDb.backup(config.dbFile);
  backupDb.close();

  Settings.set('last_restore_at', new Date().toISOString());
  Settings.set('last_restored_from', filename);

  return { success: true };
}

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  cleanOldBackups
};
