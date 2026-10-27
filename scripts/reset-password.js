#!/usr/bin/env node
'use strict';
/**
 * Emergency CLI tool to reset an admin password or unlock an account.
 * Usage: node scripts/reset-password.js <email> <newPassword>
 */
const bcrypt = require('bcryptjs');
const { Users } = require('../db/queries');

const args = process.argv.slice(2);
const email = args[0];
const newPassword = args[1];

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-password.js <email> <newPassword>');
  console.log('Example: node scripts/reset-password.js admin@explorewings.com StrongPassword123!');
  process.exit(1);
}

const user = Users.getByEmail(email);
if (!user) {
  console.error(`Error: User with email "${email}" not found.`);
  process.exit(1);
}

const hash = bcrypt.hashSync(newPassword, 12);
Users.updatePassword(user.id, hash);
Users.resetLockout(user.id);

console.log(`Success! Password for ${email} has been updated.`);
console.log('Account lockouts have been cleared. You may now sign in at /admin/login');
process.exit(0);
