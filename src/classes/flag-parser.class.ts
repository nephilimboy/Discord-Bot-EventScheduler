export class FlagParser {
  public static parse(args: string[]): any {
    const flagData: any = {};
    let i: number = 0;
    const body: string[] = [];

    // Push the arg as body text until the first flag is detected
    while (i < args.length && !args[i].startsWith("--")) {
      body.push(args[i]);
      i++;
    }
    flagData._body = body.join(" ");

    // Parse the flags in args
    while (i < args.length) {
      if (args[i].startsWith("--")) {
        const key: string = args[i].slice(2);
        const values: string[] = [];
        i++;
        while (i < args.length && !args[i].startsWith("--")) {
          values.push(args[i]);
          i++;
        }
        flagData[key] = values.join(" ");
        i--;
      }
      i++;
    }

    return flagData;
  }
}

export default FlagParser;
