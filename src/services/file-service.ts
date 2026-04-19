import * as vscode from 'vscode';
import {type TextEditorEdit} from 'vscode';

import {
  ERROR_MESSAGES,
  LICENSE_PHRASES,
  SKIP_EXTENSIONS,
  SKIP_LANGUAGES,
} from '../constants';
import {tryCatch} from '../handlers';
import {error} from '../loggers';
import {
  CommentLookup,
  type CommentStyle,
  type ExtractedLicense,
  type FileInfo,
  type Result,
} from '../types';
import {removeLicense} from '../utils/remove-license';
import {typoDetector} from '../utils/typo-detection';
import {type IConfigService, type IFileService} from './interfaces';

const DEFAULT_COMMENT_STYLE: CommentStyle = {type: 'line'};

export class FileService implements IFileService {
  constructor(private readonly configService?: IConfigService) {}

  private get currentEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  private get currentDocument(): vscode.TextDocument | undefined {
    return this.currentEditor?.document;
  }

  private get currentFilePath(): string | undefined {
    return this.currentDocument?.uri.fsPath;
  }

  get language(): string {
    return this.currentDocument?.languageId ?? '';
  }

  get extension(): string {
    const fileName = this.currentDocument?.fileName ?? '';
    const lastDot = fileName.lastIndexOf('.');
    return lastDot >= 0 ? fileName.slice(lastDot + 1) : '';
  }

  get fileInfo(): FileInfo {
    return {
      fileName: this.currentDocument?.fileName,
      fileExtension: this.extension,
      languageID: this.language,
      filePath: this.currentFilePath,
      uri: this.currentDocument?.uri,
    };
  }

  get commentStyle(): CommentStyle {
    return CommentLookup[this.language] ?? DEFAULT_COMMENT_STYLE;
  }

  shouldProcessFile(): boolean {
    if (SKIP_LANGUAGES.has(this.language)) {
      return false;
    }
    const ext = this.extension;
    return ext.length === 0 || !SKIP_EXTENSIONS.has(ext);
  }

  async insertIntoFile(license: string): Promise<Result<boolean, Error>> {
    return this.applyEdit(editBuilder =>
      editBuilder.insert(new vscode.Position(0, 0), `${license}\n\n`),
    );
  }

  async replaceLicense(
    extractedLicense: ExtractedLicense,
    newLicense: string,
  ): Promise<Result<boolean, Error>> {
    const textEdit = removeLicense(extractedLicense, newLicense);
    return this.applyEdit(editBuilder =>
      editBuilder.replace(textEdit.range, textEdit.newText),
    );
  }

  async hasTypo(
    extractedLicense: string,
    defaultTemplate: string,
  ): Promise<Result<boolean, Error>> {
    if (!extractedLicense || !defaultTemplate) {
      return [false, null];
    }
    const distance = typoDetector(
      normalize(defaultTemplate),
      normalize(extractedLicense),
    );
    const threshold = this.configService?.typoThreshold ?? 0;
    return [distance > threshold, null];
  }

  async hasLicense(): Promise<Result<boolean, Error>> {
    const content = this.currentDocument?.getText();
    if (content === undefined) {
      error('File service: Document content is undefined');
      return [null, new Error('content is undefined')];
    }
    const licenseRegex = new RegExp(LICENSE_PHRASES.join('|'), 'i');
    return [licenseRegex.test(content), null];
  }

  extractLicense(content: string): ExtractedLicense | undefined {
    const lines = content.split('\n');
    const style = this.commentStyle;
    if (style.type === 'block' && style.start && style.end) {
      return extractBlockLicense(lines, style.start, style.end);
    }
    if (style.type === 'line' && style.prefix) {
      return extractLineLicense(lines, style.prefix);
    }
    return undefined;
  }

  private async applyEdit(
    mutate: (editBuilder: TextEditorEdit) => void,
  ): Promise<Result<boolean, Error>> {
    const editor = this.currentEditor;
    const document = this.currentDocument;
    if (!editor || !document || document.isClosed) {
      error('File service: No active editor or document is closed');
      return [null, new Error('No active editor or document is closed')];
    }

    const [edited, editError] = await tryCatch(editor.edit(mutate));
    if (editError) return [null, editError];
    if (!edited) {
      error('File service: Failed to edit document');
      return [null, new Error('Failed to edit document')];
    }

    const [saved, saveError] = await tryCatch(document.save());
    if (saveError) return [null, saveError];
    if (!saved) {
      error(`File service: ${ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT}`);
      return [null, new Error(ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT)];
    }
    return [saved, null];
  }
}

function normalize(str: string): string {
  return str
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\/\*\s*\*\//g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function extractBlockLicense(
  lines: readonly string[],
  startToken: string,
  endToken: string,
): ExtractedLicense | undefined {
  const startingLine = lines.findIndex(line =>
    line.trim().includes(startToken),
  );
  if (startingLine === -1) return undefined;

  const endOffset = lines
    .slice(startingLine)
    .findIndex(line => line.includes(endToken));
  if (endOffset === -1) return undefined;

  const endingLine = startingLine + endOffset;
  const content = lines.slice(startingLine, endingLine + 1).join('\n');
  return {content, startingLine, endingLine};
}

function extractLineLicense(
  lines: readonly string[],
  prefix: string,
): ExtractedLicense | undefined {
  const prefixTrimmed = prefix.trim();
  const startingLine = lines.findIndex(line => line.trim().startsWith(prefix));
  if (startingLine === -1) return undefined;

  function isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith(prefix) || trimmed === prefixTrimmed;
  }

  let endingLine = startingLine;
  for (let i = startingLine; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line)) {
      endingLine = i;
      continue;
    }
    // Blanks count only if the block resumes immediately after.
    const nextIsComment =
      line.trim() === '' && i + 1 < lines.length && isCommentLine(lines[i + 1]);
    if (!nextIsComment) break;
  }

  return {
    content: lines.slice(startingLine, endingLine + 1).join('\n'),
    startingLine,
    endingLine,
  };
}
