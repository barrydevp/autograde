import 'dotenv/config';
import fs from 'node:fs/promises';
import {
  downloadReportPhp,
  exportAssignmentReport,
  exportWeekReport,
  parseReport,
  readWeekReport,
} from './report.js';
import { fromCsv, toCsv } from './utils.js';
import path from 'path';
import { downloadSubmission, grade } from './assigment.js';

async function main() {
  const weeks = [
    // { id: '144084', name: 'w3' },
    // { id: '145982', name: 'w4' },
    // { id: '147289', name: 'w5' },
    // { id: '148167', name: 'w6' },
    // { id: '148633', name: 'w7' },
    { id: '149160', name: 'w8' },
    // { id: '149514', name: 'w9' },
    // { id: '150796', name: 'w11' },
  ];

  for (const week of weeks) {
    console.log(`Executing week ${week.name}`);
    // console.log(await readWeekReport(week.name));
    // await downloadReportPhp(week.id, week.name);
    // await exportWeekReport(week.name);
    // await downloadSubmission(week.id, week.name);
    const graded = await grade(week.name, true);
    await exportAssignmentReport(week.name, graded);
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
