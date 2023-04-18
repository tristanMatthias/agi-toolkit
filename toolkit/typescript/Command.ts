import { Toolkit } from "./Toolkit";

// export type CommandArgType = "string" | "number" | "boolean" | "array" | "object";

export type CommandConstructor = new (tk: Toolkit) => Command;

export class Command {
  name: string;
  label: string;
  args: Record<string, any> = {};

  constructor(protected tk: Toolkit) {}

  run(args: object) {
    throw new Error("Not implemented");
  }
}
