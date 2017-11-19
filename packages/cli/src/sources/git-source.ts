import { Registration } from './registration';
import { Dependency, GitDependency } from '../manifest/dependency';
import { Source } from './source';

export default class GitSource implements Source {
  async resolve(dependency: Dependency): Promise<Registration[]> {
    const { git, branch, tag, rev } = <GitDependency>dependency;

    // TODO
    //
    // 1. Shallow clone repository to cache
    // 2. Checkout branch, tag, or revision
    // 3. Convert manifest to registration
    // 4. source = git+{repo}#branch/tag=...&rev=...

    return [];
  }

  async fetch(registration: Registration): Promise<string> {
    // TODO
    //
    // 1. Checkout revision
    // 2. Return path to local cache

    return '';
  }
}
