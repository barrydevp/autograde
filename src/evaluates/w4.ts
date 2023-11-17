import { EvalFnParams, EvalFnReturn, initEvalParams } from '../assigment.js';
import { Evltor, compareStr } from './helper.js';
import { du, slugify } from '../utils.js';

async function w4Eval({ files }: EvalFnParams): Promise<EvalFnReturn> {
  const testCases = [
    {
      name: 'Lab. Trang tin',
      dir: ['trangtin', /lab02$/, 'b1', 'bai1'],
      sizeMin: 400000, // optimistic images folder size
    },
    {
      name: 'Lab. Thuc don',
      dir: ['thucdon', 'menu', 'lab02.1', 'b2', 'bai2'],
      sizeMin: 1000, // optimistic html + css size
    },
    {
      name: 'Lab. Tab',
      dir: ['tab', 'lab02.2', 'b3', 'bai3'],
      sizeMin: 1000, // optimistic html + css size
    },
  ];

  const logger = new Evltor(testCases.length);

  const runTest = async () => {
    for (const testCase of testCases) {
      logger.checkS(testCase.name);
      const file = files.find((f) => {
        if (!f.dirent.isDirectory()) {
          return false;
        }

        const name = slugify(f.dirent.name);

        if (!testCase.dir) {
          return false;
        }

        if (!compareStr(name, testCase.dir)) {
          return false;
        }

        return true;
      });

      let passed = false;

      if (file) {
        const size = await du(file.dirent.fullpath());
        if (size >= testCase.sizeMin) {
          logger.checkP(`${file.dirent.name}{${size}}`);
          passed = true;
        } else {
          logger.checkP(
            `${file.dirent.name}{${size}} is not passed for test ${testCase.name}`,
          );
        }
      } else {
        logger.checkP(
          `${testCase.name} notfound in ${files.map((e) => e.dirent.name)}`,
        );
      }
      logger.checkE(passed);
    }
  };

  // run the first time
  await runTest();

  if (!logger.cpass() && files.length == 1) {
    // try to go deeper if having nested folder and re-run the test
    const newParams = await initEvalParams(files[0].dirent);
    return w4Eval(newParams);
  }

  // for (const file of files) {
  //   logger.checkS();
  //   logger.checkP(`${file.dirent.name}{${file.dirent.size}}`);
  //
  //   if (file.dirent.size > 0 && expectedExt.includes(file.path.ext)) {
  //     // only check for one file
  //     logger.checkE(true);
  //     break;
  //   } else {
  //     logger.checkE(false);
  //   }
  // }

  // logger.print();

  return {
    log: logger.log(),
    grade: logger.grade(),
  };
}

export default w4Eval;
