import Fuse from "fuse.js";
import * as vscode from "vscode";

import { licensePhrases } from "../constants/license-phrases.js";

const fuse = new Fuse(licensePhrases, {
    includeScore: true,
    threshold: 0.4,
});

/**
 * Checks if a line starts with a comment pattern.
 * @param line - The text line to check (should be trimmed)
 * @returns True if the line starts with //, /*, or /**; false otherwise
 */
const isCommentStart = (line: string): boolean => {
    return (
        line.startsWith("/*") || line.startsWith("/**") || line.startsWith("//")
    );
};

/**
 * Determines if a document has a comment block within its initial lines.
 * Scans the first 10 non-empty lines to detect common comment patterns.
 * @param document - The VS Code text document to analyze
 * @returns True if any of the first 10 non-empty lines start with comment patterns; false otherwise
 */
const hasInitialCommentBlock = (document: vscode.TextDocument): boolean => {
    let count = 0;
    const bound = Math.min(10, document.lineCount);

    for (let i = 0; i < bound; i++) {
        const line = document.lineAt(i).text.trim();
        if (line === "") continue;
        count++;
        if (isCommentStart(line)) {
            return true;
        }
        if (count >= 10) break;
    }
    return false;
};

/**
 * Analyzes a document to detect existing license content within the initial comment block.
 * Searches for common license phrases using fuzzy matching to identify potential license text.
 * @param document - The VS Code text document to analyze for license content
 * @returns License detection result object with match details, or undefined if no license found
 */
export const checkIfLicenseExists = (document: vscode.TextDocument) => {
    if (!hasInitialCommentBlock(document)) {
        return undefined;
    }

    const buffer: string[] = [];
    const bound = Math.min(100, document.lineCount);

    for (let i = 0; i < bound; i++) {
        const line = document.lineAt(i).text.trim();
        if (isCommentStart(line)) {
            buffer.push(line);
        } else if (line === "") {
            continue;
        } else {
            break;
        }
    }

    const fullCommentBlock = buffer.join(" ").toLowerCase();
    const results = fuse.search(fullCommentBlock);

    if (results.length > 0) {
        const { item, score } = results[0];
        return {
            containsKeyword: true,
            matchedPhrase: item,
            score,
            lineNumber: 0,
        };
    }

    return undefined;
};
