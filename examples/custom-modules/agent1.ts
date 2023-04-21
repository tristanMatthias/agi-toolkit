import { Container } from '@agi-toolkit/Container';
(async() => {
  const agent = new Container({
    registryUrl: 'http://localhost:3000',
    modules: { "module-1": './delete-test-registry/module-1' }
  });
})();
