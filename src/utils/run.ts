import { promisify } from 'util';
const exec = promisify(require('child_process').exec);

import env from '../env';
import { join } from './path';
import { pathExists } from './fs';
import { runScriptNotFound } from '../errors';

const debug = require('debug')('vba-blocks:run');

export interface RunResult {
  success: boolean;
  messages: string[];
  warnings: string[];
  errors: string[];
  stdout?: string;
  stderr?: string;
}

export class RunError extends Error {
  result: RunResult;

  constructor(result: RunResult) {
    const message = result.errors.join('\n') || 'An unknown error occurred.';
    super(message);

    this.result = result;
  }
}

export default async function run(
  application: string,
  file: string,
  macro: string,
  arg: string
): Promise<RunResult> {
  const script = join(
    env.scripts,
    env.isWindows ? 'run.vbs' : 'run.applescript'
  );

  if (!(await pathExists(script))) {
    throw runScriptNotFound(script);
  }

  const parts = [application, file, macro, arg];
  const command = env.isWindows
    ? `cscript //Nologo ${script} ${parts
        .map(part => `"${escape(part)}"`)
        .join(' ')}`
    : `osascript ${script}  ${parts.map(part => `'${part}'`).join(' ')}`;

  debug('Run:');
  debug('params:', { application, file, macro, arg });
  debug('command:', command);

  let result;
  try {
    const { stdout, stderr } = await exec(command);
    result = toResult(stdout, stderr);
  } catch (err) {
    result = toResult(err.stdout, err.stderr, err);
  }

  if (!result.success) {
    throw new RunError(result);
  }

  return result;
}

export function escape(value: string): string {
  // TODO Test robustness/validity of this approach
  return value.replace(/\"/g, '|Q|').replace(/ /g, '|S|');
}

export function unescape(value: string): string {
  return value.replace(/\|Q\|/g, '"').replace(/\|S\|/g, ' ');
}

export function toResult(
  stdout: string,
  stderr: string,
  err?: Error
): RunResult {
  let success = false;
  let messages: string[] = [];
  let warnings: string[] = [];
  let errors: string[] = [];

  if (stdout) {
    try {
      // For vba-blocks run, check for standard JSON result
      const parsed = JSON.parse(stdout);

      if ('success' in parsed && ('messages' in parsed || 'errors' in parsed)) {
        ({ success, messages = [], warnings = [], errors = [] } = parsed);
      } else {
        throw new Error('(ok, non-standard response)');
      }
    } catch (err) {
      success = true;
      messages = [stdout];
    }
  }

  if (err) {
    success = false;
    errors.push(unescape(err.message));
  }
  if (stderr) {
    success = false;
    errors.push(stderr);
  }

  return { success, messages, warnings, errors, stdout, stderr };
}
