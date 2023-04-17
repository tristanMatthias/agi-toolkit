import { Toolkit } from "./Toolkit";

// export type CommandArgType = "string" | "number" | "boolean" | "array" | "object";

export type CommandConstructor = new (tk: Toolkit) => Command;

export class Command {
  name: string;

  args: Record<string, any> = {};

  constructor(private tk: Toolkit) {}

  run(args: object) {
    throw new Error("Not implemented");
  }
}
