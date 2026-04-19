import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';

import {ERROR_MESSAGES, UI_MESSAGES} from '../constants';
import {error, info} from '../loggers';
import {type ITemplateService} from '../services/interfaces/ITemplateService';
import {type LicenseTemplate} from '../types';
import {type ITemplateManager} from './interfaces/ITemplateManager';

const TEMPLATE_PROMPT_HEADER = '# Enter your content below:\n\n';

export class TemplateManager implements ITemplateManager {
  private saveListener?: vscode.Disposable;

  constructor(private readonly templateService: ITemplateService) {}

  get allCustomTemplates(): LicenseTemplate[] {
    return this.templateService.allCustomTemplates;
  }

  async handleTemplateCreation(templateName: string): Promise<void> {
    try {
      const licenseFilePath = await this.createLicenseFile(templateName, '');
      await this.openAndListenForSave(licenseFilePath, templateName, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      error(
        `${ERROR_MESSAGES.FAILED_TO_CREATE_TEMPLATE} ${message}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  async handleTemplateEditing(templateName: string): Promise<void> {
    try {
      const existingTemplate = this.templateService.allCustomTemplates.find(
        template => template.name === templateName,
      );
      if (!existingTemplate) {
        error(`Template "${templateName}" not found.`);
        return;
      }

      const licenseFilePath = await this.createLicenseFile(
        templateName,
        existingTemplate.content,
      );
      await this.openAndListenForSave(licenseFilePath, templateName, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      error(
        `${ERROR_MESSAGES.FAILED_TO_EDIT_TEMPLATE} ${message}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  private async createLicenseFile(
    templateName: string,
    content: string,
  ): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const vscodeFolder = path.join(workspaceRoot, '.vscode');
    const licenseFilePath = path.join(vscodeFolder, `${templateName}.license`);

    await fs.mkdir(vscodeFolder, {recursive: true});
    const placeholderContent = content
      ? `${TEMPLATE_PROMPT_HEADER}${content}`
      : TEMPLATE_PROMPT_HEADER;
    await fs.writeFile(licenseFilePath, placeholderContent, 'utf-8');
    return licenseFilePath;
  }

  private async openAndListenForSave(
    licenseFilePath: string,
    templateName: string,
    isCreating: boolean,
  ): Promise<void> {
    const document = await vscode.workspace.openTextDocument(licenseFilePath);
    await vscode.window.showTextDocument(document);

    this.disposeSaveListener();
    this.saveListener = vscode.workspace.onDidSaveTextDocument(
      async savedDocument => {
        if (savedDocument.uri.fsPath !== licenseFilePath) {
          return;
        }
        try {
          const raw = await fs.readFile(licenseFilePath, 'utf-8');
          const cleanContent = raw
            .replace(new RegExp(`^${escapeRegExp(TEMPLATE_PROMPT_HEADER)}`), '')
            .trim();

          if (!cleanContent) {
            error('License template content cannot be empty');
            return;
          }

          if (isCreating) {
            await this.templateService.createCustomTemplate(
              templateName,
              cleanContent,
            );
            info(`${templateName} ${UI_MESSAGES.TEMPLATE_CREATED_SUCCESS}`);
          } else {
            await this.templateService.updateCustomTemplate(
              templateName,
              cleanContent,
            );
            info(`${templateName} ${UI_MESSAGES.TEMPLATE_UPDATED_SUCCESS}`);
          }

          await this.cleanupTemplateFile(licenseFilePath);
          this.disposeSaveListener();
        } catch (err) {
          const errorMessage = isCreating
            ? ERROR_MESSAGES.FAILED_TO_CREATE_TEMPLATE
            : ERROR_MESSAGES.FAILED_TO_UPDATE_TEMPLATE;
          const message = err instanceof Error ? err.message : 'Unknown error';
          error(
            `${errorMessage} ${message}`,
            err instanceof Error ? err : undefined,
          );
        }
      },
    );
  }

  private async cleanupTemplateFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Cleanup is best-effort: a missing file or denied permission should
      // not mask the template save success.
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to cleanup template file ${filePath}: ${message}`);
    }
  }

  private disposeSaveListener(): void {
    if (this.saveListener) {
      this.saveListener.dispose();
      this.saveListener = undefined;
    }
  }
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
