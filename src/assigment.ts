import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { globSync } from 'glob';
import { rimraf } from 'rimraf';
import { COOKIE, SUBMISSION_PATH } from './constants';
import { unrar, unzip } from './utils';

export async function downloadSubmission(id: string, week: string) {
  const buffer = await fetch(
    `https://courses.uet.vnu.edu.vn/mod/assign/view.php?id=${id}&action=downloadall`,
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
    return response.body;
  });

  const zipOut = fs.createWriteStream(
    path.join(SUBMISSION_PATH, `${week}.zip`),
  );

  // eslint-disable-next-line
  // @ts-ignore
  await finished(Readable.fromWeb(buffer).pipe(zipOut));
}

export async function unzipAssignment(week: string) {
  await unzip(path.join(SUBMISSION_PATH, `${week}.zip`));
  console.log(`Unzipped ${week}.zip`);

  const dirents = globSync(`${path.join(SUBMISSION_PATH, week)}/*/*`, {
    withFileTypes: true,
  });

  for (const dirent of dirents) {
    const file = dirent.fullpath();
    const filePath = path.parse(file);
    if (filePath.ext === '.rar') {
      console.log(await unrar(file, { list: false }));
    } else {
      console.log(
        await unzip(file, { list: false }).catch(
          () => unrar(file, { list: false }), // fallback to rar
        ),
      );
    }
  }
}

export async function rmAssignment(week: string) {
  await rimraf(path.join(SUBMISSION_PATH, week));
}

export async function grade(week: string) {
  await unzipAssignment(week);

  // await rmAssignment(week);
}
