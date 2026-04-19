import * as fs from 'fs/promises';
import * as path from 'path';
import {type StandardLicenseType} from '../types';

/**
 * Loads the bundled text of a standard license from `resources/licenses/`.
 *
 * The template bodies ship as plain-text files inside the extension's
 * install directory so they stay out of the JS bundle. Results are
 * memoised per-process since the files are immutable at runtime.
 */
export class TemplateLoader {
  private readonly cache = new Map<StandardLicenseType, Promise<string>>();

  constructor(private readonly extensionRoot: string) {}

  load(name: StandardLicenseType): Promise<string> {
    const cached = this.cache.get(name);
    if (cached) return cached;

    const filePath = path.join(
      this.extensionRoot,
      'resources',
      'licenses',
      `${name}.txt`,
    );
    const promise = fs.readFile(filePath, 'utf-8');
    this.cache.set(name, promise);
    return promise;
  }
}
