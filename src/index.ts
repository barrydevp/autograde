import 'dotenv/config';
import * as fs from 'node:fs/promises';
import {
  downloadReportPhp,
  exportWeekReport,
  parseReport,
  readWeekReport,
} from './report';
import { fromCsv, toCsv } from './utils';
import * as path from 'path';
import { DATA_PATH } from './constants';
import { downloadSubmission, grade } from './assigment';

async function main() {
  const weeks = [
    { id: '144084', name: 'w3' },
    // { id: '145982', name: 'w4' },
    // { id: '147289', name: 'w5' },
    // { id: '148167', name: 'w6' },
    // { id: '148633', name: 'w7' },
    // { id: '149160', name: 'w8' },
    // { id: '149514', name: 'w9' },
    // { id: '150796', name: 'w11' },
  ];

  for (const week of weeks) {
    console.log(`Executing week ${week.name}`);
    // console.log(await readWeekReport(week.name));
    await grade(week.name);
    // await downloadSubmission(week.id, week.name);
    // await downloadReportPhp(week.id, week.name);
    // await exportWeekReport(week.name);
  }

  // console.log(
  //   await fromCsv(path.join(DATA_PATH, 'student_list.csv'), [
  //     'id',
  //     'name',
  //     'birth',
  //     'school_year',
  //   ]),
  // );
}

main();
