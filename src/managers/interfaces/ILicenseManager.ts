import {type LicenseTemplate, type LicenseType, type Result} from '../../types';

export interface ILicenseManager {
  start(): Promise<void>;
  stop(): Promise<void>;

  enableAutoSave(): Promise<Result<void, Error>>;
  disableAutoSave(): Promise<void>;
  readonly isAutoSaveEnabled: boolean;

  enableAutoCorrect(): Promise<Result<void, Error>>;
  disableAutoCorrect(): Promise<Result<void, Error>>;
  readonly isAutoCorrectEnabled: boolean;

  addLicenseToFile(licenseType?: LicenseType): Promise<Result<boolean, Error>>;

  availableLicenses(): Promise<Result<string[], Error>>;
  readonly defaultLicense: LicenseTemplate;
}
