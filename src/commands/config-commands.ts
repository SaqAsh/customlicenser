import {tryCatch} from '../handlers';
import {error, info} from '../loggers';
import {type LicenseManager} from '../managers';
import {type ConfigService} from '../services';
import {displayInputBox} from '../ui';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export async function addYearCommand(
  configService: ConfigService,
): Promise<void> {
  const currentYear = new Date().getFullYear().toString();
  const [year, yearError] = await tryCatch(
    displayInputBox({
      prompt: 'Enter the year for license headers',
      placeHolder: currentYear,
      value: currentYear,
      ignoreFocusOut: true,
      validateInput: value => {
        const yearNum = Number.parseInt(value, 10);
        if (
          !Number.isFinite(yearNum) ||
          yearNum < MIN_YEAR ||
          yearNum > MAX_YEAR
        ) {
          return `Please enter a valid year between ${MIN_YEAR} and ${MAX_YEAR}`;
        }
        return undefined;
      },
    }),
  );

  if (yearError) {
    error(`Failed to update year: ${yearError.message}`, yearError);
    return;
  }
  if (year) {
    await configService.updateYear(year);
    info(`Year updated to: ${year}`);
  }
}

export async function addNameCommand(
  configService: ConfigService,
): Promise<void> {
  const [name, err] = await tryCatch(
    displayInputBox({
      prompt: 'Enter your name for license headers',
      placeHolder: 'Your Name',
      ignoreFocusOut: true,
      validateInput: value =>
        !value || value.trim().length === 0
          ? 'Name cannot be empty'
          : undefined,
    }),
  );

  if (err) {
    error(`Failed to update name: ${err.message}`, err);
    return;
  }
  if (name) {
    await configService.updateAuthorName(name);
    info(`Author name set to: ${name}`);
  }
}

export async function toggleAutoSaveCommand(
  licenseManager: LicenseManager,
): Promise<void> {
  if (licenseManager.isAutoSaveEnabled) {
    await licenseManager.disableAutoSave();
    info('Auto-save disabled');
    return;
  }

  const [, enableError] = await licenseManager.enableAutoSave();
  if (enableError) {
    error(`Failed to enable auto-save: ${enableError.message}`, enableError);
    return;
  }
  info('Auto-save enabled');
}

export async function toggleAutoCorrectCommand(
  licenseManager: LicenseManager,
): Promise<void> {
  if (licenseManager.isAutoCorrectEnabled) {
    const [, err] = await licenseManager.disableAutoCorrect();
    if (err) {
      error(`Failed to disable auto-correct: ${err.message}`, err);
      return;
    }
    info('Auto-correct disabled');
    return;
  }

  const [, enableError] = await licenseManager.enableAutoCorrect();
  if (enableError) {
    error(`Failed to enable auto-correct: ${enableError.message}`, enableError);
    return;
  }
  info('Auto-correct enabled');
}
