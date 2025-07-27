# CustomLicenser Development Guide

This guide provides documentation links and implementation guidance for the advanced features you want to implement.

## 🔗 Essential VS Code API Documentation

### Core Extension APIs

-   **[VS Code Extension API](https://code.visualstudio.com/api)** - Main documentation hub
-   **[Extension Capabilities](https://code.visualstudio.com/api/extension-capabilities/overview)** - What extensions can do
-   **[Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)** - Step-by-step implementation guides

### Text Input & User Interaction

-   **[Input Box API](https://code.visualstudio.com/api/references/vscode-api#InputBox)** - For taking text input from users
-   **[Quick Pick API](https://code.visualstudio.com/api/references/vscode-api#QuickPick)** - For selection menus
-   **[Window API](https://code.visualstudio.com/api/references/vscode-api#window)** - For showing input boxes, messages, etc.

### File System & Text Editing

-   **[TextDocument API](https://code.visualstudio.com/api/references/vscode-api#TextDocument)** - For reading file content
-   **[TextEditor API](https://code.visualstudio.com/api/references/vscode-api#TextEditor)** - For editing files
-   **[WorkspaceEdit API](https://code.visualstudio.com/api/references/vscode-api#WorkspaceEdit)** - For bulk file modifications
-   **[Workspace API](https://code.visualstudio.com/api/references/vscode-api#workspace)** - For file system operations

### Event Handling & Automation

-   **[Event API](https://code.visualstudio.com/api/references/vscode-api#Event)** - General event handling
-   **[Workspace Events](https://code.visualstudio.com/api/references/vscode-api#workspace)** - File save, create, delete events
-   **[Document Events](https://code.visualstudio.com/api/references/vscode-api#workspace.onDidSaveTextDocument)** - Specifically onDidSaveTextDocument

### Configuration & Settings

-   **[Configuration API](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration)** - Reading user settings
-   **[Settings Guide](https://code.visualstudio.com/api/extension-guides/configuration)** - How to define and use settings

## 🛠️ Implementation Roadmap

### 1. Text Input for Custom Licenses

```typescript
// Use vscode.window.showInputBox() for simple text input
const licenseText = await vscode.window.showInputBox({
	prompt: "Enter your custom license text",
	placeHolder: "Copyright (c) {{YEAR}} {{AUTHOR}}...",
	multiline: true, // This is a proposed API, check current status
});

// For multiline input, you might need to use QuickPick with custom input
// Or open a new untitled document for editing
```

**Key Documentation:**

-   [window.showInputBox](https://code.visualstudio.com/api/references/vscode-api#window.showInputBox)
-   [InputBoxOptions](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions)

### 2. File Save Event Handling

```typescript
// Listen for file save events
const disposable = vscode.workspace.onDidSaveTextDocument((document) => {
	// Check if license exists
	// Insert license if missing
});
```

**Key Documentation:**

-   [onDidSaveTextDocument](https://code.visualstudio.com/api/references/vscode-api#workspace.onDidSaveTextDocument)
-   [TextDocument](https://code.visualstudio.com/api/references/vscode-api#TextDocument)

### 3. License Detection & Insertion

```typescript
// Check if file has license
function hasLicense(document: vscode.TextDocument): boolean {
	const text = document.getText();
	// Look for common license patterns
	return /copyright|license|mit|gpl|apache/i.test(text.substring(0, 1000));
}

// Insert license at top of file
async function insertLicense(editor: vscode.TextEditor, licenseText: string) {
	const edit = new vscode.WorkspaceEdit();
	edit.insert(
		editor.document.uri,
		new vscode.Position(0, 0),
		licenseText + "\n\n"
	);
	await vscode.workspace.applyEdit(edit);
}
```

**Key Documentation:**

-   [WorkspaceEdit](https://code.visualstudio.com/api/references/vscode-api#WorkspaceEdit)
-   [Position](https://code.visualstudio.com/api/references/vscode-api#Position)
-   [Range](https://code.visualstudio.com/api/references/vscode-api#Range)

### 4. Warning/Error Messages

```typescript
// Show warning when license is missing
vscode.window
	.showWarningMessage(
		"This file is missing a license header",
		"Add License",
		"Ignore"
	)
	.then((selection) => {
		if (selection === "Add License") {
			// Trigger license addition
		}
	});
```

**Key Documentation:**

-   [window.showWarningMessage](https://code.visualstudio.com/api/references/vscode-api#window.showWarningMessage)
-   [window.showErrorMessage](https://code.visualstudio.com/api/references/vscode-api#window.showErrorMessage)

### 5. Configuration Access

```typescript
// Read user settings
const config = vscode.workspace.getConfiguration("customlicenser");
const defaultAuthor = config.get<string>("defaultAuthor", "");
const autoInsert = config.get<boolean>("autoInsertOnSave", false);
```

**Key Documentation:**

-   [getConfiguration](https://code.visualstudio.com/api/references/vscode-api#workspace.getConfiguration)
-   [WorkspaceConfiguration](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration)

## 📚 Advanced Topics

### File Type Detection

```typescript
// Get file extension and language
const fileExtension = path.extname(document.fileName);
const languageId = document.languageId;

// Different comment styles for different languages
function getCommentStyle(languageId: string): string {
	switch (languageId) {
		case "javascript":
		case "typescript":
		case "java":
		case "cpp":
			return "block-comment"; // /* */
		case "python":
		case "bash":
			return "hash-comment"; // #
		default:
			return "block-comment";
	}
}
```

### Template Variable Replacement

```typescript
function replaceLicenseVariables(
	template: string,
	variables: Record<string, string>
): string {
	return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		return variables[key] || match;
	});
}

// Usage
const variables = {
	AUTHOR: config.get("defaultAuthor", "Unknown"),
	YEAR: new Date().getFullYear().toString(),
	EMAIL: config.get("defaultEmail", ""),
	FILENAME: path.basename(document.fileName),
};
```

### Persistent Storage

```typescript
// Store custom licenses in extension context
async function saveCustomLicense(
	context: vscode.ExtensionContext,
	name: string,
	content: string
) {
	const licenses = context.globalState.get<Record<string, string>>(
		"customLicenses",
		{}
	);
	licenses[name] = content;
	await context.globalState.update("customLicenses", licenses);
}
```

**Key Documentation:**

-   [ExtensionContext](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext)
-   [Memento (GlobalState)](https://code.visualstudio.com/api/references/vscode-api#Memento)

## 🧪 Testing

### Unit Testing

```typescript
// Test your license detection logic
import * as assert from "assert";
import * as vscode from "vscode";

suite("License Detection Tests", () => {
	test("Should detect MIT license", () => {
		const content = "/* MIT License\n * Copyright (c) 2024...";
		assert.strictEqual(hasLicense(content), true);
	});
});
```

**Key Documentation:**

-   [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
-   [Extension Test Runner](https://code.visualstudio.com/api/working-with-extensions/testing-extension#the-test-runner)

## 🚀 Debugging & Development

### Running Your Extension

1. Press `F5` to launch Extension Development Host
2. Test commands in Command Palette (`Ctrl+Shift+P`)
3. Check Debug Console for logs
4. Use breakpoints in your TypeScript code

### Common Patterns

```typescript
// Error handling
try {
	await vscode.workspace.applyEdit(edit);
	vscode.window.showInformationMessage("License added successfully!");
} catch (error) {
	vscode.window.showErrorMessage(`Failed to add license: ${error}`);
}

// Async command with progress
vscode.window.withProgress(
	{
		location: vscode.ProgressLocation.Notification,
		title: "Adding licenses...",
		cancellable: false,
	},
	async (progress) => {
		// Your async work here
		progress.report({ increment: 50, message: "Processing files..." });
	}
);
```

## 📖 Additional Resources

-   **[Extension Samples](https://github.com/microsoft/vscode-extension-samples)** - Official code examples
-   **[Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)** - Best practices
-   **[Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)** - How to publish to marketplace
-   **[Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)** - package.json reference

## 🎯 Implementation Priority

1. **Start with**: Basic license insertion using `TextEditor.edit()`
2. **Then add**: File save event listening with `onDidSaveTextDocument`
3. **Next**: User input for custom licenses with `showInputBox`
4. **Advanced**: Configuration reading, file type detection, template variables
5. **Polish**: Error handling, progress indicators, comprehensive testing

Remember to check the VS Code API version compatibility and test thoroughly with different file types and scenarios!
