import * as path from 'node:path';

export const DATA_PATH = path.join(__dirname, '..', 'data');

export const SUBMISSION_PATH = path.join(DATA_PATH, 'submission');

export const COOKIE = process.env.COOKIE;
