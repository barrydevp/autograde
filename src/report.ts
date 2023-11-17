import path from 'node:path';
import fs from 'node:fs/promises';
import { parse, NodeType } from 'node-html-parser';
import { COOKIE, DATA_PATH, SUBMISSION_PATH } from './constants.js';
import { dfs, fromCsv, toCsv } from './utils.js';
import { EvalResult, grade } from './assigment.js';

const RAW_COLS = [
  'Select',
  'User picture',
  'First name',
  'Username',
  'Email address',
  'Status',
  'Grade',
  'Edit',
  'Last modified (submission)',
  'File submissions',
  'Submission comments',
  'Last modified (grade)',
  'Feedback comments',
  'Annotate PDF',
  'Final grade',
];
const ACCEPTED_RAW_COLS = [2, 3, 4, 5, 8, 9];

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

export function getColKey(name: string) {
  return RAW_COLS[getColIdx(name)];
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

  for (const [i, th] of thead[0].childNodes.entries()) {
    // if (!ACCEPTED_RAW_COLS.includes(i)) {
    //   continue;
    // }
    const textNode = dfs(th, (n) => {
      return n.nodeType == NodeType.TEXT_NODE;
    });

    columns.push(textNode.text);
  }

  const tbody = table.querySelectorAll('tbody tr');
  for (const tr of tbody) {
    const row = [];
    for (const [i, td] of tr.childNodes.entries()) {
      // if (!ACCEPTED_RAW_COLS.includes(i)) {
      //   continue;
      // }
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

export async function readWeekReport(
  week: string,
): Promise<Record<string, string>[]> {
  const data = await fromCsv(
    path.join(DATA_PATH, `${week}.csv`),
    true,
    // ACCEPTED_RAW_COLS.map((i) => RAW_COLS[i]),
  );

  return data;
  // return data.reduce((p, e) => {
  //   p[e[getColKey('id')]] = e;
  //   return p;
  // }, {});
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

export async function exportAssignmentReport(
  week: string,
  graded: EvalResult[],
) {
  const weekReport = await readWeekReport(week);

  const mapByFile = graded.reduce(
    (p, e) => {
      p[e.entry.name] = e;
      return p;
    },
    {} as Record<string, EvalResult>,
  );

  const assignmentJson = weekReport.map((e) => {
    const grade = mapByFile[e[getColKey('file')]];
    let mark = grade && grade.grade;
    let note = '';

    if (!mark) {
      mark = 0;
    } else {
      const status = e[getColKey('status')];
      if (status.includes('late')) {
        const daysp = /(\d+)\s+days?/.exec(status);
        let days = 0;
        if (daysp) {
          days = parseInt(daysp[1]);
        }
        if (days >= 10) {
          note += 'nop muon qua 10 ngay 50% diem';
          mark = Math.ceil((mark * 5) / 10);
        } else if (days >= 1) {
          note += 'nop muon qua 1 ngay 70% diem';
          mark = Math.ceil((mark * 7) / 10);
        } else {
          const hoursp = /(\d+)\s+hours?/.exec(status);
          let hours = 0;
          if (hoursp) {
            hours = parseInt(hoursp[1]);
          }
          if (hours > 12) {
            note += 'nop muon qua 12 gio 80% diem';
            mark = Math.ceil((mark * 8) / 10);
          } else if (hours >= 1) {
            note += 'nop muon qua 1 gio 90% diem';
            mark = Math.ceil((mark * 9) / 10);
          }
        }
      }
    }

    return {
      id: e[getColKey('id')],
      name: e[getColKey('name')],
      status: e[getColKey('status')],
      last_modified: e[getColKey('last_modified')],
      file: e[getColKey('file')],
      log: (grade && grade.log) || '',
      grade: mark.toString(),
      note: note,
    };
  });

  const csvStr = toCsv(
    Object.keys(assignmentJson[0]),
    assignmentJson.map((e) => Object.values(e)),
  );
  await fs.writeFile(path.join(DATA_PATH, `${week}_graded.csv`), csvStr);
}
