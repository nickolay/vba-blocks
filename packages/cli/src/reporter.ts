import dedent from 'dedent';
import { Target } from './manifest';
import { Registration } from './sources';

export interface ErrorMessages {
  'unknown-command': { command: string };
  'unsupported-source': { type: string };
  'dependency-not-found': { dependency: string; registry: string };
  'dependency-invalid-checksum': { registration: Registration };
  'target-not-found': { target: Target };
  'target-is-open': { target: Target; path: string };
  'target-create-failed': { target: Target };
  'target-import-failed': { target: Target };
  'target-restore-failed': { backup: string; file: string };
  'resolve-failed': { details?: string };
  'run-script-not-found': { path: string };
}

export interface Messages {
  errors: { [T in keyof ErrorMessages]: (values: ErrorMessages[T]) => string };
}

export interface Reporter {
  progress: (name?: string) => Progress;
  messages: Messages;
}

export interface Progress {
  start: (count?: number) => void;
  tick: () => void;
  done: () => void;
}

export const reporter: Reporter = {
  progress(): Progress {
    return {
      start(count?: number) {},
      tick() {},
      done() {}
    };
  },

  messages: {
    errors: {
      'unknown-command': ({ command }) => dedent`
        Unknown command "${command}".

        Try "vba-blocks --help" for a list of commands.`,

      'unsupported-source': ({ type }) => dedent`
        ${type} dependencies are not supported.

        Upgrade to Professional Edition for ${type} dependencies and more`,

      'dependency-not-found': ({ dependency, registry }) => dedent`
        Dependency "${dependency}" not found in registry "${registry}"`,

      'dependency-invalid-checksum': ({ registration }) => dedent`
        Dependency "${registration.name}" failed validation.
  
        The downloaded file signature for ${registration.id}
        does not match the signature in the registry.`,

      'target-not-found': ({ target }) => dedent`
        Target "${target.name}" not found at "${target.path}"`,

      'target-is-open': ({ target, path }) => dedent`
        Failed to build target "${target.name}", it is currently open.
  
        Please close "${path}" and try again.`,

      'target-create-failed': ({ target }) => dedent`
        Failed to create project for target "${target.name}"`,

      'target-import-failed': ({ target }) => dedent`
        Failed to import project for target "${target.name}"`,

      'target-restore-failed': ({ backup, file }) => dedent`
        Failed to automatically restore backup from "${backup}" to "${file}".

        The previous version can be moved back manually, if desired.`,

      'resolve-failed': () => dedent`
        Unable to resolve dependency graph for project.

        There are dependencies that cannot be satisfied.`,

      'run-script-not-found': ({ path }) => dedent`
        Bridge script not found at "${path}".

        This is a fatal error and will require vba-blocks to be re-installed.`
    }
  }
};
