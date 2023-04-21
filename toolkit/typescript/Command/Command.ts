import { Container } from "../Container";

export class Command {
  name: string;
  args: Record<string, string> = {};
  label: string;

  constructor(protected container: Container) { }

  async initialize() { }

  run(args: object): Promise<any> {
    throw new Error("Not implemented");
  }
}
