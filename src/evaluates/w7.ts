import { EvalFnParams, EvalFnReturn, initEvalParams } from '../assigment.js';
import { Evltor, compareStr } from './helper.js';
import { du, slugify } from '../utils.js';

async function w7Eval({ files }: EvalFnParams): Promise<EvalFnReturn> {
  const testCases = [
    {
      name: 'Lab. Sap xep tren bang',
      dir: [/^lab05$/, 'sapxep', 'sort', 'table', 'index1'],
      sizeMin: 300, // optimistic images folder size
    },
    {
      name: 'Lab. JSON',
      dir: ['.1', 'json', 'index2'],
      sizeMin: 300, // optimistic html + css size
    },
    {
      name: 'Lab. AJAX',
      dir: ['.2', 'ajax', 'index3'],
      sizeMin: 300, // optimistic html + css size
    },
    {
      name: 'Lab. Cay',
      dir: ['.3', 'tree', 'cay', 'index4'],
      sizeMin: 300, // optimistic html + css size
    },
    // {
    //   name: 'Lab. Grid 2',
    //   dir: ['.4', 'grid2', 'grid0'],
    //   sizeMin: 300, // optimistic html + css size
    // },
    // {
    //   name: 'Lab. Stepped Typography',
    //   dir: ['.5', 'steppedtypography', 'stepped', 'stepping', 'typo2'],
    //   sizeMin: 300, // optimistic html + css size
    // },
  ];

  const logger = new Evltor(testCases.length);

  const runTest = async () => {
    for (const testCase of testCases) {
      logger.checkS(testCase.name);
      const file = files.find((f) => {
        // if (!f.dirent.isDirectory()) {
        //   return false;
        // }

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
    return w7Eval(newParams);
  }

  // logger.print();

  return {
    log: logger.log(),
    grade: logger.grade(),
  };
}

export default w7Eval;
