import { Command } from "@agi-toolkit/Command/Command";

interface BrowseWebArgs extends Record<string, string> {
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

  async run(args: BrowseWebArgs) {
    throw new Error("Method not implemented.");
  }
}
