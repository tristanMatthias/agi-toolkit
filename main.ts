import { WriteFile } from "./commands/file-system";
import Configuration from "./toolkit/typescript/Configuration";
import { Toolkit } from "./toolkit/typescript/Toolkit";

(async() => {
  const configuration = new Configuration();
  const toolkit = new Toolkit(process.env.HOST!, configuration);
  await toolkit.initialize();

  toolkit.registerCommand(WriteFile);

  toolkit
    .module("cli")
    .mainLoop();
})();
