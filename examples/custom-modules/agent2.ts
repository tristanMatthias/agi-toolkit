// import { ContainerConfiguration } from '@agi-toolkit/Container/ContainerConfiguration';
// new ContainerConfiguration("./delete-test-registry/agi.container.yml").initialize()

import { Container } from '@agi-toolkit/Container';
(async () => {
  const agent = new Container({
    registryUrl: 'http://localhost:3000',
    modules: { "module-2": './delete-test-registry/module-2' }
  });
})();
