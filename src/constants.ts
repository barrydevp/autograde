import * as path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DATA_PATH = path.join(__dirname, '..', 'data');

export const SUBMISSION_PATH = path.join(DATA_PATH, 'submission');

export const COOKIE = process.env.COOKIE || '';
