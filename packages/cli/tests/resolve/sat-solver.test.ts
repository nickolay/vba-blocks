import solve from '../../src/resolve/sat-solver';
import { loadConfig } from '../../src/config';
import Resolver from '../../src/resolve/resolver';
import { toWorkspace } from '../helpers/workspace';
import * as manifest from '../fixtures/manifest';

jest.mock('../../src/sources/registry-source');

test('solves simple tree', async () => {
  const config = await loadConfig();
  const resolver = new Resolver(config);

  const solution = await solve(config, toWorkspace(manifest.simple), resolver);

  expect(solution).toMatchSnapshot();
});

test('solves complex tree', async () => {
  const config = await loadConfig();
  const resolver = new Resolver(config);

  const solution = await solve(config, toWorkspace(manifest.complex), resolver);

  expect(solution).toMatchSnapshot();
});

test('solves needs-sat tree', async () => {
  const config = await loadConfig();
  const resolver = new Resolver(config);

  const solution = await solve(
    config,
    toWorkspace(manifest.needsSat),
    resolver
  );

  expect(solution).toMatchSnapshot();
});

test('fails to solve unresolvable tree', async () => {
  const config = await loadConfig();
  const resolver = new Resolver(config);

  await expect(() =>
    solve(config, toWorkspace(manifest.unresolvable), resolver)
  ).rejects;
});