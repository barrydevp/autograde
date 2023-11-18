export class Evltor {
  private _cnum: number = 0;
  private _cpass: number = 0;
  constructor(
    private totalCnum: number,
    private _log: string = '',
  ) {}

  checkS(name: string) {
    this._cnum++;
    this._log += `<c${this._cnum}="${name}">`;
  }

  checkP(s: string) {
    this._log += `"${s}";`;
  }

  checkE(pass: boolean) {
    this._log += `</c${this._cnum}=${(pass && 'pass') || 'fail'}>`;
    if (pass) {
      this._cpass++;
    }
  }

  print() {
    console.log(`\t\t${this.grade()}`);
    console.log(`\t\t${this._cpass}/${this._cnum}`);
    console.log(`\t${this._log}`);
  }

  log() {
    return this._log;
  }

  grade() {
    const original = (this._cpass * 100) / this.totalCnum;
    return Math.ceil(original > 100 ? 100 : original);
  }

  cpass() {
    return this._cpass;
  }
}

export function compareStr(src: string, dst: (string | RegExp)[]) {
  return dst.find((d) => {
    if (d instanceof RegExp) {
      return d.test(src);
    } else {
      return src.includes(d);
    }
  });
}
