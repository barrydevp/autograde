import { EvalFnParams, EvalFnReturn } from '../assigment.js';
import { Evltor } from './helper.js';
import path from 'node:path';
import { glob } from 'glob';
import pmap from 'p-map';

export default async function ({
  files,
}: EvalFnParams): Promise<EvalFnReturn> {
  const logger = new Evltor(1);

  const expectedExt = ['.html', '.htm'];

  for (const file of files) {
    logger.checkS('letter.html');
    logger.checkP(`${file.dirent.name}{${file.dirent.size}}`);

    if (file.dirent.size > 0 && expectedExt.includes(file.path.ext)) {
      // only check for one file
      logger.checkE(true);
      break;
    } else {
      logger.checkE(false);
    }
  }

  // logger.print();

  return {
    log: logger.log(),
    grade: logger.grade(),
  };
}
