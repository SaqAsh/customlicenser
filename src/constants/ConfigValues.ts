import {type LicenseTemplate} from '../types';

export const CONFIG_SECTION = 'customlicenser';

export const CONFIG_KEYS = {
  AUTHOR_NAME: 'authorName',
  YEAR: 'year',
  DEFAULT_LICENSE: 'defaultLicense',
  TOGGLE_ON_SAVE: 'toggleOnSave',
  AUTO_CORRECT: 'autoCorrect',
  CUSTOM_TEMPLATES: 'customTemplates',
  TYPO_THRESHOLD: 'typoThreshold',
} as const;

interface Defaults {
  readonly AUTHOR_NAME: string;
  readonly YEAR: string;
  readonly DEFAULT_LICENSE: LicenseTemplate;
  readonly TOGGLE_ON_SAVE: boolean;
  readonly AUTO_CORRECT: boolean;
  readonly CUSTOM_TEMPLATES: readonly LicenseTemplate[];
  readonly TYPO_THRESHOLD: number;
}

export const DEFAULT_VALUES: Defaults = {
  AUTHOR_NAME: '',
  YEAR: new Date().getFullYear().toString(),
  DEFAULT_LICENSE: {name: 'mit', content: ''},
  TOGGLE_ON_SAVE: false,
  AUTO_CORRECT: false,
  CUSTOM_TEMPLATES: [],
  TYPO_THRESHOLD: 10,
};

export const EXTENSION_ID = 'customlicenser';
export const LANGUAGE_PLAINTEXT = 'plaintext';

export const VALIDATION_MESSAGES = {
  TEMPLATE_CONTENT_EMPTY: 'Template content cannot be empty',
} as const;

export const UI_MESSAGES = {
  TEMPLATE_CREATION_CANCELLED: 'Template creation cancelled.',
  TEMPLATE_EDITING_CANCELLED: 'Template editing cancelled.',
  TEMPLATE_CREATED_SUCCESS: 'Template created successfully!',
  TEMPLATE_UPDATED_SUCCESS: 'Template updated successfully!',
  LICENSE_ADDED_SUCCESS: 'License added successfully!',
  LICENSE_ADDITION_FAILED: 'License addition was cancelled or failed',
  AUTO_ADDED_LICENSE: 'Auto-added license to',
} as const;

export const ERROR_MESSAGES = {
  NO_LICENSE_TYPE: 'No license type provided and no default license configured',
  TEMPLATE_NOT_FOUND: 'Template not found for license type:',
  FAILED_TO_SAVE_DOCUMENT: 'Failed to save document after inserting license',
  FAILED_TO_CREATE_TEMPLATE: 'Failed to create template:',
  FAILED_TO_UPDATE_TEMPLATE: 'Failed to update template:',
  FAILED_TO_EDIT_TEMPLATE: 'Failed to edit template:',
} as const;
