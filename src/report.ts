import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { parse, NodeType } from 'node-html-parser';
import { COOKIE, DATA_PATH, SUBMISSION_PATH } from './constants';
import { dfs, toCsv } from './utils';

export const COLUMN_MAP = {
  name: 2,
  id: 3,
  email: 4,
  status: 5,
  last_modified: 8,
  file: 9,
};

export function getColIdx(name: string) {
  return COLUMN_MAP[name] || -1;
}

async function readReportHtml(filename: string) {
  const rawHtml = await fs.readFile(
    path.join(SUBMISSION_PATH, filename),
    'utf8',
  );

  const htmlText = rawHtml.substring(rawHtml.indexOf('<html>'));

  return htmlText;
}

export async function parseReport(filename: string) {
  const htmlText = await readReportHtml(filename);
  const document = parse(htmlText);

  const table = document.querySelector(
    '#region-main > div:nth-child(3) > div.box.py-3.boxaligncenter.gradingtable > div.no-overflow > table',
  );

  const columns = [];
  const rows = [];

  const thead = table.querySelectorAll('thead tr');

  for (const th of thead[0].childNodes) {
    const textNode = dfs(th, (n) => {
      return n.nodeType == NodeType.TEXT_NODE;
    });

    columns.push(textNode.text);
  }

  const tbody = table.querySelectorAll('tbody tr');
  for (const tr of tbody) {
    const row = [];
    for (const [i, td] of tr.childNodes.entries()) {
      let textNode = null;
      // Status column, get the late date submission
      if (i === 5) {
        textNode = td.childNodes[td.childNodes.length - 1];
      } else {
        textNode = dfs(td, (n) => {
          return n.nodeType === NodeType.TEXT_NODE && !!n.text.trim();
        });
      }

      row.push(textNode ? textNode.text.trim() : '');
    }
    rows.push(row);
  }

  return {
    columns,
    rows,
  };
}

export async function exportWeekReport(week: string) {
  const { columns, rows } = await parseReport(`${week}.php`);

  const csvStr = toCsv(columns, rows);
  await fs.writeFile(path.join(DATA_PATH, `${week}.csv`), csvStr);
}

export async function downloadReportPhp(id: string, week: string) {
  const data = await fetch(
    `https://courses.uet.vnu.edu.vn/mod/assign/view.php?id=${id}&action=grading`,
    {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua':
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        cookie: COOKIE,
      },
      body: null,
      method: 'GET',
    },
  ).then((response) => {
    return response.text();
  });

  await fs.writeFile(path.join(SUBMISSION_PATH, `${week}.php`), data);
}
