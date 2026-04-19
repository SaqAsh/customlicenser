import {tryCatch} from '../handlers';
import {error, info} from '../loggers';
import {type LicenseManager, type TemplateManager} from '../managers';
import {type ConfigService} from '../services';
import {type ITemplateService} from '../services/interfaces';
import {displayInputBox, displayQuickPick} from '../ui';

export async function createCustomLicenseCommand(
  templateManager: TemplateManager,
): Promise<void> {
  const [templateName, err] = await tryCatch(
    displayInputBox({
      prompt: 'Enter a name for your custom license template',
      placeHolder: 'My Custom License',
      ignoreFocusOut: true,
      validateInput: value =>
        !value || value.trim().length === 0
          ? 'Template name cannot be empty'
          : undefined,
    }),
  );

  if (err) {
    error(`Failed to create custom license: ${err.message}`, err);
    return;
  }
  if (!templateName) {
    return;
  }

  await templateManager.handleTemplateCreation(templateName);
}

export async function editCustomLicenseCommand(
  licenseManager: LicenseManager,
  templateManager: TemplateManager,
): Promise<void> {
  const [availableLicenses, err] = await licenseManager.availableLicenses();
  if (err) {
    error(`Failed to get available licenses: ${err.message}`, err);
    return;
  }
  if (availableLicenses.length === 0) {
    info('No custom licenses available. Create one first.');
    return;
  }

  const quickPickItems = availableLicenses.map(license => ({
    label: license,
    description: `Edit ${license} template`,
  }));

  const selectedLicense = await displayQuickPick(
    quickPickItems,
    'Select a custom license to edit',
    false,
    false,
  );

  if (selectedLicense) {
    await templateManager.handleTemplateEditing(selectedLicense.label);
  }
}

export async function selectDefaultLicenseCommand(
  licenseManager: LicenseManager,
  configService: ConfigService,
  templateService: ITemplateService,
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

  const quickPickItems = availableLicenses.map(license => ({
    label: license,
    description: `Set ${license} as default license`,
  }));

  const selectedLicense = await displayQuickPick(
    quickPickItems,
    'Select a default license',
    false,
    false,
  );
  if (!selectedLicense) {
    return;
  }

  const [template, templateError] = await templateService.getTemplate(
    selectedLicense.label,
  );
  if (templateError) {
    error(
      `Failed to get template for ${selectedLicense.label}: ${templateError.message}`,
      templateError,
    );
    return;
  }

  await configService.updateDefaultLicense(template);
  info(`Default license set to: ${selectedLicense.label}`);
}
