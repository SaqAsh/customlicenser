import {type LicenseTemplate} from '../../types/LicenseTemplate';
import {type LicenseType} from '../../types/LicenseType';
import {type Result} from '../../types/Result';

export interface ITemplateService {
  readonly allCustomTemplates: LicenseTemplate[];

  createCustomTemplate(name: string, content: string): Promise<void>;
  updateCustomTemplate(name: string, content: string): Promise<void>;
  deleteCustomTemplate(name: string): Promise<void>;

  processTemplate(
    template: LicenseTemplate,
  ): Promise<Result<LicenseTemplate, Error>>;

  getTemplate(
    licenseType: LicenseType,
  ): Promise<Result<LicenseTemplate, Error>>;
}
