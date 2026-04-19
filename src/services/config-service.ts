import * as vscode from 'vscode';

import {CONFIG_KEYS, CONFIG_SECTION, DEFAULT_VALUES} from '../constants';
import {error} from '../loggers';
import {type LicenseTemplate} from '../types';
import {type IConfigService} from './interfaces';

export class ConfigService implements IConfigService {
  private get config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(CONFIG_SECTION);
  }

  private read<T>(key: string, fallback: T): T {
    return this.config.get<T>(key) ?? fallback;
  }

  get authorName(): string {
    return this.read(CONFIG_KEYS.AUTHOR_NAME, DEFAULT_VALUES.AUTHOR_NAME);
  }

  get year(): string {
    return this.read(CONFIG_KEYS.YEAR, DEFAULT_VALUES.YEAR);
  }

  get defaultLicense(): LicenseTemplate {
    return this.read(
      CONFIG_KEYS.DEFAULT_LICENSE,
      DEFAULT_VALUES.DEFAULT_LICENSE,
    );
  }

  get isAutoAddEnabled(): boolean {
    return this.read(CONFIG_KEYS.TOGGLE_ON_SAVE, DEFAULT_VALUES.TOGGLE_ON_SAVE);
  }

  get isAutoCorrectEnabled(): boolean {
    return this.read(CONFIG_KEYS.AUTO_CORRECT, DEFAULT_VALUES.AUTO_CORRECT);
  }

  get allCustomTemplates(): LicenseTemplate[] {
    return [
      ...this.read<readonly LicenseTemplate[]>(
        CONFIG_KEYS.CUSTOM_TEMPLATES,
        DEFAULT_VALUES.CUSTOM_TEMPLATES,
      ),
    ];
  }

  get typoThreshold(): number {
    const raw = this.read(
      CONFIG_KEYS.TYPO_THRESHOLD,
      DEFAULT_VALUES.TYPO_THRESHOLD,
    );
    return Number.isFinite(raw) && raw >= 0
      ? raw
      : DEFAULT_VALUES.TYPO_THRESHOLD;
  }

  async updateAuthorName(value: string): Promise<void> {
    await this.write(CONFIG_KEYS.AUTHOR_NAME, value);
  }

  async updateYear(value: string): Promise<void> {
    await this.write(CONFIG_KEYS.YEAR, value);
  }

  async updateDefaultLicense(licenseTemplate: LicenseTemplate): Promise<void> {
    await this.write(CONFIG_KEYS.DEFAULT_LICENSE, licenseTemplate);
  }

  async updateAutoAddEnabled(value: boolean): Promise<void> {
    await this.write(CONFIG_KEYS.TOGGLE_ON_SAVE, value);
  }

  async updateCustomTemplates(templates: LicenseTemplate[]): Promise<void> {
    await this.write(CONFIG_KEYS.CUSTOM_TEMPLATES, templates);
  }

  async updateAutoCorrect(value: boolean): Promise<void> {
    await this.write(CONFIG_KEYS.AUTO_CORRECT, value);
  }

  private async write<T>(key: string, value: T): Promise<void> {
    try {
      await this.config.update(key, value, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      error(`Config service: Failed to update config key "${key}": ${message}`);
      throw err;
    }
  }
}
