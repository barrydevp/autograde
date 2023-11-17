import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { Path, glob, globSync } from 'glob';
import { rimraf } from 'rimraf';
import pmap from 'p-map';
import { COOKIE, SUBMISSION_PATH } from './constants.js';
import EvalFns from './evaluates/index.js';
import { unrar, unzip } from './utils.js';

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

export type UnzipResult = {
  dirent: Path;
  error?: any;
};

export async function unzipAssignment(week: string) {
  console.log(`Unzipping ${week}.zip`);
  // await unzip(path.join(SUBMISSION_PATH, `${week}.zip`));
  console.log(`Unzipped ${week}.zip`);

  const dirents = globSync(`${path.join(SUBMISSION_PATH, week)}/*/*`, {
    withFileTypes: true,
  }).filter((e) => e.isFile());

  const result = await pmap(
    dirents,
    async (dirent) => {
      const file = dirent.fullpath();
      const filePath = path.parse(file);
      const r: UnzipResult = {
        dirent,
      };
      // try {
      //   console.log(`  Unzipping ${dirent.name}`);
      //   if (filePath.ext === '.rar') {
      //     await unrar(file, { list: false });
      //     console.log(`  Unrared ${dirent.name}`);
      //   } else {
      //     await unzip(file, { list: false }).catch(
      //       () => unrar(file, { list: false }), // fallback to rar
      //     );
      //     console.log(`  Unzipped ${dirent.name}`);
      //   }
      // } catch (e) {
      //   console.error(`  Unzip ${dirent.name} error: ${e.message}`);
      //   r.error = e;
      // }

      return r;
    },
    { concurrency: 2 },
  );

  console.log(`Unzipped all submission of ${week}`);

  return result;
}

export async function rmAssignment(week: string) {
  await rimraf(path.join(SUBMISSION_PATH, week));
}

export function getNestedZipping(dirents: Path[]) {
  if (dirents.length == 1 && dirents[0].isDirectory()) {
    return dirents[0];
  }

  if (dirents.length == 2) {
    const macosDirentIdx = dirents.findIndex((d) => {
      return d.isDirectory() && d.name.includes('MACOS');
    });

    if (macosDirentIdx > -1 && dirents[1 - macosDirentIdx].isDirectory()) {
      return dirents[1 - macosDirentIdx];
    }
  }

  return null;
}

export async function goNestedZipping(dirents: Path[]) {
  const nestedDirent = getNestedZipping(dirents);
  if (nestedDirent) {
    return await glob(`${nestedDirent.fullpath()}/*`, {
      stat: true,
      withFileTypes: true,
    });
  }

  return dirents;
}

export async function initEvalParams(baseDirent: Path) {
  const filePath = path.parse(baseDirent.fullpath());

  const dirents = await glob(`${path.join(filePath.dir, filePath.name)}/*`, {
    stat: true,
    withFileTypes: true,
  }).then((dirs) => goNestedZipping(dirs));
  // nested one level due to zipping of folder
  const files = await pmap(dirents, async (dirent) => {
    return {
      dirent,
      path: path.parse(dirent.fullpath()),
    };
  });

  return {
    baseDirent: baseDirent,
    files,
  };
}

export type EvalFnParams = Awaited<ReturnType<typeof initEvalParams>>;
export type EvalFnReturn = {
  grade: number;
  log: string;
};
export type EvalResult = EvalFnReturn & {
  entry: Path;
};

export async function evaluate(week: string, dirents: UnzipResult[]) {
  console.log(`Run evaluate`);
  const evalFn = EvalFns[week];

  const evals: EvalResult[] = [];

  for (const { dirent } of dirents) {
    const params = await initEvalParams(dirent);
    const evalted: EvalFnReturn = await evalFn(params);

    evals.push({ entry: dirent, ...evalted });
    // break;
  }

  console.log(
    evals.map((e) => ({
      grade: e.grade,
      log: e.log,
    })),
  );

  console.log('\n\n');
  evals.forEach((e) => {
    if (e.grade < 100) {
      console.log({
        grade: e.grade,
        log: e.log,
      });
    }
  });

  return evals;
}

export async function grade(week: string) {
  // await rmAssignment(week);
  const dirents = await unzipAssignment(week);
  const evaluated = await evaluate(week, dirents);

  // await rmAssignment(week);

  return evaluated;
}
