import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const input = createInterface({ input: process.stdin, output: process.stdout });
const password = await input.question('Password baru (input terlihat di terminal): ');
input.close();
if (!password) throw new Error('Password tidak boleh kosong.');
const salt = randomBytes(16).toString('hex');
console.log(`AUTH_PASSWORD_HASH=${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
