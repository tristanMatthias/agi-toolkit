import { Command } from "../../toolkit/typescript/Command";

interface BrowseWebArgs {
  url: string;
  question: string;
}

export default class BrowseWeb extends Command {
  name = "browse-web";
  label = "Browse website";
  args: BrowseWebArgs = {
    url: "<url>",
    question: "<what_you_want_to_find_on_website>"
  }

  run(args: BrowseWebArgs): void {
    throw new Error("Method not implemented.");
  }
}
