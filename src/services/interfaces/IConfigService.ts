import {type LicenseTemplate} from '../../types/LicenseTemplate';

export interface IConfigService {
  readonly authorName: string;
  readonly year: string;
  readonly defaultLicense: LicenseTemplate;
  readonly isAutoAddEnabled: boolean;
  readonly isAutoCorrectEnabled: boolean;
  readonly allCustomTemplates: LicenseTemplate[];
  readonly typoThreshold: number;

  updateAuthorName(value: string): Promise<void>;
  updateYear(value: string): Promise<void>;
  updateDefaultLicense(value: LicenseTemplate): Promise<void>;
  updateAutoAddEnabled(value: boolean): Promise<void>;
  updateAutoCorrect(value: boolean): Promise<void>;
  updateCustomTemplates(templates: LicenseTemplate[]): Promise<void>;
}
