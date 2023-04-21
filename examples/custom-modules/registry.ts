import { RegistryConfiguration } from '@agi-toolkit/Registry/RegistryConfiguration';
new RegistryConfiguration().createAndStart();


// ================================================================= Alternative
// import { Registry } from '@agi-toolkit/Registry/Registry';

// (async () => {
//   const registry = new Registry({
//     requiredModules: ['module-1', 'module-2']
//   });

//   await registry.createAndStart();
// })();
