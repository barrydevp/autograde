import { EvalFnParams, EvalFnReturn } from '../assigment.js';
import { Evltor } from './helper.js';

export default async function ({ files }: EvalFnParams): Promise<EvalFnReturn> {
  const logger = new Evltor(1);

  const expectedExts = ['.html', '.htm'];

  logger.checkS('Lab. Letter');
  if (
    expectedExts.find((expectedExt) => {
      return files.find((file) => {
        if (file.dirent.size > 0 && expectedExt === file.path.ext) {
          // console.log(file.path.ext);
          // only check for one file
          logger.checkP(`${file.dirent.name}{${file.dirent.size}}`);
          return true;
        } else {
          logger.checkP(
            `${file.dirent.name}{${file.dirent.size}} irrelevant or empty`,
          );
          return false;
        }
      });
    })
  ) {
    logger.checkE(true);
  } else {
    logger.checkE(false);
  }

  // logger.print();

  return {
    log: logger.log(),
    grade: logger.grade(),
  };
}
