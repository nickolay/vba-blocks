import { join } from 'path';
import { remove, outputFile } from 'fs-extra';
import { unzip, walk } from '../../src/utils';
import { loadProject } from '../../src/project';
import { Target, TargetType } from '../../src/manifest/target';
import { createTarget } from '../../src/targets';

const FIXTURES = join(__dirname, '..', 'fixtures');
const cwd = join(FIXTURES, 'build');
const build = join(cwd, 'build');
const backup = join(build, '.backup');
const tmp = join(cwd, 'tmp');

const target: Target = {
  name: 'testing',
  type: <TargetType>'xlsm',
  path: 'targets/xlsm'
};

afterEach(async () => Promise.all([remove(build), remove(tmp)]));

test('should create target', async () => {
  const project = await loadProject(cwd);
  const file = await createTarget(project, target);
  expect(file).toEqual(join(build, 'testing.xlsm'));
  expect(await walk(build)).toMatchSnapshot();

  await unzip(file, tmp);
  expect(await walk(tmp)).toMatchSnapshot();
});

test('should backup existing', async () => {
  const project = await loadProject(cwd);
  await outputFile(join(build, 'testing.xlsm'), '(existing)');

  const file = await createTarget(project, target);
  expect(await walk(build)).toMatchSnapshot();
});

test('should remove previous backup', async () => {
  const project = await loadProject(cwd);
  await outputFile(join(backup, 'testing.xlsm'), '(previous)');
  expect(await walk(build)).toMatchSnapshot();

  const file = await createTarget(project, target);
  expect(await walk(build)).toMatchSnapshot();
});
