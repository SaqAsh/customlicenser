import {type QuickPickItem} from 'vscode';
import {error, info} from '../loggers';
import {type LicenseManager} from '../managers';
import {type LicenseType} from '../types';
import {displayQuickPick} from '../ui';

async function addLicense(
  licenseManager: LicenseManager,
  licenseType: LicenseType,
  displayName: string,
): Promise<void> {
  const [success, err] = await licenseManager.addLicenseToFile(licenseType);
  if (err) {
    error(`Failed to add ${displayName} license: ${err.message}`, err);
    return;
  }
  if (success) {
    info(`${displayName} license added successfully`);
  }
}

export async function selectLicenseCommand(
  licenseManager: LicenseManager,
): Promise<void> {
  const [availableLicenses, err] = await licenseManager.availableLicenses();
  if (err) {
    error(`Failed to get available licenses: ${err.message}`, err);
    return;
  }
  if (availableLicenses.length === 0) {
    info('No licenses available. Create some licenses first.');
    return;
  }

  const quickPickItems: QuickPickItem[] = availableLicenses.map(license => ({
    label: license,
    description: `Add ${license} license to the current file`,
  }));

  const selectedLicense = await displayQuickPick(
    quickPickItems,
    'Select a license to add to the current file',
    false,
    false,
  );

  if (selectedLicense) {
    await addLicense(
      licenseManager,
      selectedLicense.label,
      selectedLicense.label,
    );
  }
}

export async function addMITLicenseCommand(mgr: LicenseManager): Promise<void> {
  await addLicense(mgr, 'mit', 'MIT');
}

export async function addGPLLicenseCommand(mgr: LicenseManager): Promise<void> {
  await addLicense(mgr, 'gpl', 'GPL');
}

export async function addApacheLicenseCommand(
  mgr: LicenseManager,
): Promise<void> {
  await addLicense(mgr, 'apache', 'Apache');
}

export async function addBSDLicenseCommand(mgr: LicenseManager): Promise<void> {
  await addLicense(mgr, 'bsd', 'BSD');
}

export async function addISCLicenseCommand(mgr: LicenseManager): Promise<void> {
  await addLicense(mgr, 'isc', 'ISC');
}

export async function addMozillaLicenseCommand(
  mgr: LicenseManager,
): Promise<void> {
  await addLicense(mgr, 'mozilla', 'Mozilla');
}
