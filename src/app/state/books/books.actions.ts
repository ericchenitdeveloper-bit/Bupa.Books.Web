export class FetchBooks {
  static readonly type = '[Books] Fetch Books';
  constructor(public hardcoverOnly = false) {}
}
