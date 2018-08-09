export class Period {
  private _days: number;
  private _hours: number;
  private _minutes: number;
  private _seconds: number;

  public constructor(ms: number) { // https://gist.github.com/remino/1563878
    this._seconds = Math.floor(ms / 1000);
    this._minutes = Math.floor(this._seconds / 60);
    this._seconds = this._seconds % 60;
    this._hours = Math.floor(this._minutes / 60);
    this._minutes = this._minutes % 60;
    this._days = Math.floor(this._hours / 24);
    this._hours = this._hours % 24;
  }

  public get days() {
    return this._days;
  }

  public set days(d: number) {
    this._days = d;
  }

  public get hours() {
    return this._hours;
  }

  public set hours(h: number) {
    this._hours = h;
  }

  public get minutes() {
    return this._minutes;
  }

  public set minutes(m: number) {
    this._minutes = m;
  }

  public get seconds() {
    return this._seconds;
  }

  public set seconds(s: number) {
    this._seconds = s;
  }
}

export default Period;
