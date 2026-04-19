import {ERROR_MESSAGES} from '../constants';
import {error} from '../loggers';
import {
  isStandardLicenseType,
  type LicenseTemplate,
  type LicenseType,
  type Result,
} from '../types';
import {type IConfigService, type ITemplateService} from './interfaces';
import {type TemplateLoader} from './template-loader';

const PLACEHOLDERS = [
  {pattern: /\{\{year\}\}/gi, field: 'year'},
  {pattern: /\{\{name\}\}/gi, field: 'authorName'},
] as const;

export class TemplateService implements ITemplateService {
  constructor(
    private readonly configService: IConfigService,
    private readonly templateLoader: TemplateLoader,
  ) {}

  get allCustomTemplates(): LicenseTemplate[] {
    return this.configService.allCustomTemplates;
  }

  async processTemplate(
    template: LicenseTemplate,
  ): Promise<Result<LicenseTemplate, Error>> {
    if (!template.content) {
      return [
        null,
        new Error(`${ERROR_MESSAGES.TEMPLATE_NOT_FOUND}: ${template.name}`),
      ];
    }

    const values = {
      year: this.configService.year || new Date().getFullYear().toString(),
      authorName: this.configService.authorName || 'Your Name',
    };

    const content = PLACEHOLDERS.reduce(
      (text, {pattern, field}) => text.replace(pattern, values[field]),
      template.content,
    );

    return [{...template, content}, null];
  }

  async getTemplate(
    licenseType: LicenseType,
  ): Promise<Result<LicenseTemplate, Error>> {
    if (isStandardLicenseType(licenseType)) {
      try {
        const content = await this.templateLoader.load(licenseType);
        return [{name: licenseType, content}, null];
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const errMsg = `Failed to load bundled ${licenseType} template: ${message}`;
        error(`Template service: ${errMsg}`);
        return [null, new Error(errMsg)];
      }
    }

    const customTemplate = this.configService.allCustomTemplates.find(
      template => template.name === licenseType,
    );
    if (customTemplate) {
      return [customTemplate, null];
    }

    const errMsg = `${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${licenseType}`;
    error(`Template service: ${errMsg}`);
    return [null, new Error(errMsg)];
  }

  async createCustomTemplate(name: string, content: string): Promise<void> {
    assertNonEmpty(name, 'Template name');
    assertNonEmpty(content, 'Template content');

    const current = this.configService.allCustomTemplates;
    if (current.some(template => template.name === name)) {
      throw new Error(`Template with name "${name}" already exists`);
    }
    await this.configService.updateCustomTemplates([
      ...current,
      {name, content},
    ]);
  }

  async updateCustomTemplate(name: string, content: string): Promise<void> {
    assertNonEmpty(name, 'Template name');
    assertNonEmpty(content, 'Template content');

    const current = this.configService.allCustomTemplates;
    const next = current.map(template =>
      template.name === name ? {name, content} : template,
    );
    if (!current.some(t => t.name === name)) {
      throw new Error(`Template with name "${name}" not found`);
    }
    await this.configService.updateCustomTemplates(next);
  }

  async deleteCustomTemplate(name: string): Promise<void> {
    assertNonEmpty(name, 'Template name');

    const current = this.configService.allCustomTemplates;
    const next = current.filter(template => template.name !== name);
    if (next.length === current.length) {
      throw new Error(`Template with name "${name}" not found`);
    }
    await this.configService.updateCustomTemplates(next);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${label} cannot be empty`);
  }
}
