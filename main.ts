import * as fileSystem from "./commands/file-system";
import BrowseWeb from "./modules/browser/browser.command";
import Configuration from "./toolkit/typescript/Configuration";
import { Toolkit } from "./toolkit/typescript/Toolkit";

(async() => {
  const configuration = new Configuration();
  const toolkit = new Toolkit(process.env.HOST!, configuration);
  await toolkit.initialize();

  // TODO: Convert to importing agi.module.yml files
  for (const command of Object.values(fileSystem)) {
    toolkit.registerCommand(command);
  }
  toolkit.registerCommand(BrowseWeb);

  toolkit
    .module("agent")
    .mainLoop();
})();
