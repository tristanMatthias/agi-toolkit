import { RegistryConfiguration } from "@agi-toolkit/Registry";

new RegistryConfiguration(
  "./examples/from-config/agi.config.yml"
).createAndStart();

// ================================================================ The Old way:

// import ModuleAgent from "./modules/agent/Agent.module";
// import { ContainerConfiguration } from "@agi-toolkit/Container/ContainerConfiguration";
// import { Registry } from "@agi-toolkit/Registry";

// (async() => {
//   await new Registry({
//     requiredModules: ['core', 'agent', 'llm']
//   }).start();

//   const config = new ContainerConfiguration();
//   const agent = await config.initialize();

//   await agent.ready();

//   agent
//     .module<ModuleAgent>("agent")
//     .mainLoop();
// })();
// =============================================================================
