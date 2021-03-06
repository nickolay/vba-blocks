import { Config, loadConfig } from './config';
import env from './env';
import { isLockfileValid, readLockfile } from './lockfile';
import { loadManifest, Manifest } from './manifest';
import { loadWorkspace, Workspace } from './professional/workspace';
import resolve from './resolve';
import { DependencyGraph } from './resolve/dependency-graph';
import { fetch } from './sources';
import { tmpFolder } from './utils/fs';
import parallel from './utils/parallel';
import { join, normalize } from './utils/path';

const debug = env.debug('vba-blocks:project');

export interface Project {
  manifest: Manifest;
  workspace: Workspace;
  packages: DependencyGraph;

  config: Config;
  paths: {
    root: string;
    dir: string;
    build: string;
    backup: string;
    staging: string;
  };
  has_dirty_lockfile: boolean;
}

/**
 * Load project from given directory / cwd
 *
 * 1. Load manifest in dir
 * 2. Load workspace from manifest
 * 3. Load lockfile
 * 4. Resolve dependencies
 */
export async function loadProject(dir: string = env.cwd): Promise<Project> {
  const manifest = await loadManifest(dir);

  const config = await loadConfig();
  const workspace = await loadWorkspace(manifest, dir);
  const lockfile = await readLockfile(workspace.paths.root);

  // Resolve packages from lockfile or from sources
  const has_dirty_lockfile = !lockfile || !(await isLockfileValid(lockfile, workspace));
  debug(!has_dirty_lockfile ? 'Loading packages from lockfile' : 'Resolving packages');

  const packages = !has_dirty_lockfile
    ? lockfile!.packages
    : await resolve(config, workspace, lockfile ? lockfile.packages : []);

  const paths = {
    root: workspace.paths.root,
    dir,
    build: join(dir, 'build'),
    backup: join(dir, 'build', '.backup'),
    staging: await tmpFolder({ dir: env.staging })
  };

  return {
    manifest,
    workspace,
    packages,
    config,
    paths,
    has_dirty_lockfile
  };
}

export interface FetchProject {
  manifest: Manifest;
  packages: DependencyGraph;
  config: Config;
}

/**
 * Fetch all dependencies for project
 * (based on already resolved project.packages)
 *
 * After sources complete fetches, manifests are loaded and returned for each package
 */
export async function fetchDependencies(project: FetchProject): Promise<Manifest[]> {
  const manifests = await parallel(
    project.packages,
    async registration => {
      const path = await fetch(project.config.sources, registration);
      const manifest = await loadManifest(path);

      return manifest;
    },
    { progress: env.reporter.progress('Fetching dependencies') }
  );

  return manifests;
}

export interface ProjectOptions {
  type?: 'project' | 'package';
}

/**
 * Initialize new project
 *
 * Minimum requirements: name and dir
 */
export async function initProject(
  name: string,
  dir: string,
  options: ProjectOptions = {}
): Promise<Project> {
  dir = normalize(dir);
  const { type = 'project' } = options;

  const config = await loadConfig();

  // TODO load defaults from config
  const version = '0.0.0';
  const authors: string[] = [];
  const license = 'UNLICENSED';

  // Manually generate manifest and project
  // (may be included in project in the future)
  const manifest: Manifest = {
    type,
    name,
    version,
    metadata: {
      authors,
      license
    },
    src: [],
    dependencies: [],
    references: [],
    devSrc: [],
    devDependencies: [],
    devReferences: []
  };

  const workspace = await loadWorkspace(manifest, dir);

  const project: Project = {
    manifest,
    workspace,
    packages: [],
    config,
    paths: {
      root: workspace.paths.root,
      dir,
      build: join(dir, 'build'),
      backup: join(dir, 'build', '.backup'),
      staging: await tmpFolder({ dir: env.staging })
    },
    has_dirty_lockfile: true
  };

  return project;
}
