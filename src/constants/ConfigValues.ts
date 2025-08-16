import { LicenseTemplate } from "../types";

export const CONFIG_SECTION = "customlicenser";

export const CONFIG_KEYS = {
	AUTHOR_NAME: "authorName",
	TEMPLATES: "customTemplates", // Changed to match package.json
	YEAR: "year",
	DEFAULT_LICENSE: "defaultLicense",
	TOGGLE_ON_SAVE: "toggleOnSave",
	CUSTOM_TEMPLATES: "customTemplates",
	AUTO_CORRECT: "autoCorrect",
} as const;

export const DEFAULT_VALUES = {
	AUTHOR_NAME: "",
	TEMPLATES: [] as LicenseTemplate[],
	YEAR: new Date().getFullYear().toString(),
	DEFAULT_LICENSE: {
		name: "mit",
		content: "",
	} as LicenseTemplate,
	TOGGLE_ON_SAVE: false,
	AUTO_CORRECT: false,
	CUSTOM_TEMPLATES: [] as LicenseTemplate[],
} as const;

export const EXTENSION_ID = "customlicenser";

export const LANGUAGE_PLAINTEXT = "plaintext";

export const VALIDATION_MESSAGES = {
	TEMPLATE_CONTENT_EMPTY: "Template content cannot be empty",
} as const;

export const UI_MESSAGES = {
	TEMPLATE_CREATION_CANCELLED: "Template creation cancelled.",
	TEMPLATE_EDITING_CANCELLED: "Template editing cancelled.",
	TEMPLATE_CREATED_SUCCESS: "Template created successfully!",
	TEMPLATE_UPDATED_SUCCESS: "Template updated successfully!",
	LICENSE_ADDED_SUCCESS: "License added successfully!",
	LICENSE_ADDITION_FAILED: "License addition was cancelled or failed",
	AUTO_ADDED_LICENSE: "Auto-added license to",
} as const;

export const ERROR_MESSAGES = {
	NO_LICENSE_TYPE:
		"No license type provided and no default license configured",
	TEMPLATE_NOT_FOUND: "Template not found for license type:",

	FAILED_TO_SAVE_DOCUMENT: "Failed to save document after inserting license",
	ERROR_CHECKING_LICENSE: "Error checking for license:",
	ERROR_INSERTING_LICENSE: "Error inserting license:",
	ERROR_IN_ADD_LICENSE: "Error in addLicenseToFile:",
	FAILED_TO_CREATE_TEMPLATE: "Failed to create template:",
	FAILED_TO_UPDATE_TEMPLATE: "Failed to update template:",
	FAILED_TO_EDIT_TEMPLATE: "Failed to edit template:",
	FAILED_TO_OPEN_EDITOR: "Failed to open template editor:",
	TEMPLATE_ALREADY_EXISTS: "Template with name already exists",
	TEMPLATE_NOT_FOUND_BY_NAME: "Template with name not found",
	AUTO_SAVE_FAILED: "Auto-save failed for",
	AUTO_CORRECT_DISABLED: "Auto-correct is disabled",
	AUTO_CORRECT_ENABLED: "Auto-correct is enabled",
	AUTO_CORRECT_SUCCESS: "Auto-correct successful",
} as const;
