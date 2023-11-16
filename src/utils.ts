import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { Node } from 'node-html-parser';
import { exec, spawn } from 'node:child_process';

export function dfs(root: Node, fn: (node: Node) => boolean) {
  if (!root) {
    return null;
  }

  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (fn(node)) {
      return node;
    }
    stack.push(...[...node.childNodes].reverse());
  }

  return null;
}

export function bfs(root: Node, fn: (node: Node) => boolean) {
  if (!root) {
    return null;
  }

  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (fn(node)) {
      return node;
    }
    queue.push(...node.childNodes);
  }

  return null;
}

export function toCsv(columns: string[], rows: string[][]) {
  return stringify([columns, ...rows]);
}

export async function fromCsv(filename: string, columns: string[]) {
  const csvStr = await fs.readFile(filename, 'utf8');

  return parse(csvStr, {
    columns: columns,
  });
}

export function shellescape(args: string[]) {
  // return a shell compatible format
  const ret = [];

  args.forEach(function (s) {
    if (/[^A-Za-z0-9_\/:=-]/.test(s)) {
      s = "'" + s.replace(/'/g, "'\\''") + "'";
      s = s
        .replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    ret.push(s);
  });

  return ret;
}

export async function unzip(file: string, { list }: { list?: boolean } = {}) {
  const filePath = path.parse(file);

  return new Promise((rs, rj) => {
    const args = ['-O', 'UTF-8'];
    if (list) {
      args.push('-l');
    } else {
      args.push('-d', `${path.join(filePath.dir, filePath.name)}`);
    }
    args.push(file);

    const cmd = `unzip`;
    exec(`${cmd} ${shellescape(args).join(' ')}`, (err, stdout, stderr) => {
      if (err || stderr) {
        rj(err || stderr);
      } else {
        rs(stdout);
      }
    });
  });
}

export async function unrar(file: string, { list }: { list?: boolean } = {}) {
  const filePath = path.parse(file);

  return new Promise((rs, rj) => {
    const args = [];
    if (list) {
      args.push('l', file);
    } else {
      args.push('e', file, `${path.join(filePath.dir, filePath.name)}/`);
    }

    const cmd = `unrar`;
    exec(`${cmd} ${shellescape(args).join(' ')}`, (err, stdout, stderr) => {
      if (err || stderr) {
        rj(err || stderr);
      } else {
        rs(stdout);
      }
    });
  });
}
