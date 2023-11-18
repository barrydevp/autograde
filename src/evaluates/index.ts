import { EvalFnParams, EvalFnReturn } from '../assigment.js';
import { Evltor } from './helper.js';
import w3 from './w3.js';
import w4 from './w4.js';
import w5 from './w5.js';
import w6 from './w6.js';
import w7 from './w7.js';

async function noop({ files }: EvalFnParams): Promise<EvalFnReturn> {
  const logger = new Evltor(1);
  logger.checkS('no-op');
  logger.checkE(true);

  return {
    log: logger.log(),
    grade: logger.grade(),
  };
}

export default {
  noop,
  w3,
  w4,
  w5,
  w6,
  w7,
};
