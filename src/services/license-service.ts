import { ILicenseService } from "./interfaces";

export class LicenseService implements ILicenseService {
    private language: string;
    private currentTemplate: string;

    constructor(language: string, template: string) {
        this.language = language;
        this.currentTemplate = template;
    }

    public formatBlockLicense(): string {
        const lines = this.currentTemplate.split("\n");
        if (lines.length === 0) {
            return "";
        }

        if (lines.length === 1) {
            return this.blockPrepend(lines[0], true, true);
        }

        const firstLine = this.blockPrepend(lines[0], true, false);
        const body = this.blockBodyFormat(lines.slice(1, lines.length - 1));
        const lastLine = this.blockPrepend(
            lines[lines.length - 1],
            false,
            true
        );

        return [firstLine, body, lastLine].join("\n");
    }

    public formatLineLicense(): string {
        return this.currentTemplate
            .split("\n")
            .map((line) => this.linePrepend(line))
            .join("\n");
    }

    public extractLicenseFromContent(content: string): string {
        const trimmedContent = content.trim();
        let pointer = 0;

        while (pointer < trimmedContent.length) {
            const commentStart = this.findCommentStart(trimmedContent, pointer);

            if (commentStart === -1) {
                break;
            }

            const commentEnd = this.findCommentEnd(
                trimmedContent,
                commentStart
            );

            if (commentEnd === -1) {
                break;
            }

            const licenseContent = trimmedContent.substring(
                commentStart,
                commentEnd
            );

            if (this.isLicenseContent(licenseContent)) {
                return this.cleanLicenseContent(licenseContent);
            }

            pointer = commentEnd;
        }

        return "";
    }

    private findCommentStart(content: string, startIndex: number): number {
        const remainingContent = content.substring(startIndex);

        switch (this.language) {
            case "javascript":
            case "typescript":
            case "java":
            case "c":
            case "cpp":
            case "csharp":
            case "go":
            case "rust":
            case "swift":
            case "kotlin":
            case "scala":
            case "php":
                const lineCommentIndex = remainingContent.indexOf("//");
                const blockCommentIndex = remainingContent.indexOf("/*");

                if (lineCommentIndex === -1 && blockCommentIndex === -1) {
                    return -1;
                }

                if (lineCommentIndex === -1) {
                    return startIndex + blockCommentIndex;
                }

                if (blockCommentIndex === -1) {
                    return startIndex + lineCommentIndex;
                }

                return (
                    startIndex + Math.min(lineCommentIndex, blockCommentIndex)
                );

            case "python":
            case "ruby":
            case "shell":
                const hashIndex = remainingContent.indexOf("#");
                const docStringIndex = remainingContent.indexOf('"""');

                if (hashIndex === -1 && docStringIndex === -1) {
                    return -1;
                }

                if (hashIndex === -1) {
                    return startIndex + docStringIndex;
                }

                if (docStringIndex === -1) {
                    return startIndex + hashIndex;
                }

                return startIndex + Math.min(hashIndex, docStringIndex);

            case "html":
            case "xml":
                const htmlCommentIndex = remainingContent.indexOf("<!--");
                return htmlCommentIndex === -1
                    ? -1
                    : startIndex + htmlCommentIndex;

            default:
                const defaultLineIndex = remainingContent.indexOf("//");
                const defaultBlockIndex = remainingContent.indexOf("/*");

                if (defaultLineIndex === -1 && defaultBlockIndex === -1) {
                    return -1;
                }

                if (defaultLineIndex === -1) {
                    return startIndex + defaultBlockIndex;
                }

                if (defaultBlockIndex === -1) {
                    return startIndex + defaultLineIndex;
                }

                return (
                    startIndex + Math.min(defaultLineIndex, defaultBlockIndex)
                );
        }
    }

    private findCommentEnd(content: string, startIndex: number): number {
        const remainingContent = content.substring(startIndex);

        switch (this.language) {
            case "javascript":
            case "typescript":
            case "java":
            case "c":
            case "cpp":
            case "csharp":
            case "go":
            case "rust":
            case "swift":
            case "kotlin":
            case "scala":
            case "php":
                if (remainingContent.startsWith("//")) {
                    const newlineIndex = remainingContent.indexOf("\n");
                    return newlineIndex === -1
                        ? content.length
                        : startIndex + newlineIndex;
                }

                if (remainingContent.startsWith("/*")) {
                    const blockEndIndex = remainingContent.indexOf("*/");
                    return blockEndIndex === -1
                        ? content.length
                        : startIndex + blockEndIndex + 2;
                }

                return -1;

            case "python":
            case "ruby":
            case "shell":
                if (remainingContent.startsWith("#")) {
                    const newlineIndex = remainingContent.indexOf("\n");
                    return newlineIndex === -1
                        ? content.length
                        : startIndex + newlineIndex;
                }

                if (remainingContent.startsWith('"""')) {
                    const docStringEndIndex = remainingContent.indexOf(
                        '"""',
                        3
                    );
                    return docStringEndIndex === -1
                        ? content.length
                        : startIndex + docStringEndIndex + 3;
                }

                return -1;

            case "html":
            case "xml":
                if (remainingContent.startsWith("<!--")) {
                    const htmlEndIndex = remainingContent.indexOf("-->");
                    return htmlEndIndex === -1
                        ? content.length
                        : startIndex + htmlEndIndex + 3;
                }

                return -1;

            default:
                if (remainingContent.startsWith("//")) {
                    const newlineIndex = remainingContent.indexOf("\n");
                    return newlineIndex === -1
                        ? content.length
                        : startIndex + newlineIndex;
                }

                if (remainingContent.startsWith("/*")) {
                    const blockEndIndex = remainingContent.indexOf("*/");
                    return blockEndIndex === -1
                        ? content.length
                        : startIndex + blockEndIndex + 2;
                }

                return -1;
        }
    }

    private isLicenseContent(content: string): boolean {
        const licensePhrases = [
            "copyright",
            "license",
            "licensed",
            "licensing",
            "mit license",
            "apache license",
            "gpl",
            "bsd license",
            "all rights reserved",
            "permission is hereby granted",
            "the above copyright notice",
            "this software is provided",
            "without warranty",
            "limitation of liability",
        ];

        const lowerContent = content.toLowerCase();
        return licensePhrases.some((phrase) => lowerContent.includes(phrase));
    }

    private cleanLicenseContent(content: string): string {
        return content
            .replace(/^\s*\/\/\s*/, "")
            .replace(/^\s*\/\*\s*/, "")
            .replace(/\s*\*\/\s*$/, "")
            .replace(/^\s*#\s*/, "")
            .replace(/^\s*<!--\s*/, "")
            .replace(/\s*-->\s*$/, "")
            .replace(/^\s*"""\s*/, "")
            .replace(/\s*"""\s*$/, "")
            .replace(/^\s*\*\s*/gm, "")
            .trim();
    }

    private blockBodyFormat(lines: string[]): string {
        return lines.map((line) => ` * ${line.trim()}`).join("\n");
    }

    private linePrepend(line: string): string {
        const trimmedLine = line.trim();

        switch (this.language) {
            case "javascript":
            case "typescript":
            case "java":
            case "c":
            case "cpp":
            case "csharp":
            case "go":
            case "rust":
            case "swift":
            case "kotlin":
            case "scala":
            case "php":
                return `// ${trimmedLine}`;
            case "python":
            case "ruby":
            case "shell":
                return `# ${trimmedLine}`;
            case "html":
            case "xml":
                return `<!-- ${trimmedLine} -->`;
            default:
                return `// ${trimmedLine}`;
        }
    }

    private blockPrepend(
        line: string,
        isStart: boolean,
        isEnd: boolean
    ): string {
        const trimmedLine = line.trim();

        switch (this.language) {
            case "javascript":
            case "typescript":
            case "java":
            case "c":
            case "cpp":
            case "csharp":
            case "go":
            case "rust":
            case "swift":
            case "kotlin":
            case "scala":
            case "php":
                if (isStart && isEnd) {
                    return `/* ${trimmedLine} */`;
                }
                if (isStart) {
                    return `/* ${trimmedLine}`;
                }
                if (isEnd) {
                    return ` * ${trimmedLine}\n */`;
                }
                return ` * ${trimmedLine}`;
            case "python":
                if (isStart && isEnd) {
                    return `""" ${trimmedLine} """`;
                }
                if (isStart) {
                    return `""" ${trimmedLine}`;
                }
                if (isEnd) {
                    return `${trimmedLine} """`;
                }
                return `${trimmedLine}`;
            case "html":
            case "xml":
                if (isStart && isEnd) {
                    return `<!-- ${trimmedLine} -->`;
                }
                if (isStart) {
                    return `<!-- ${trimmedLine}`;
                }
                if (isEnd) {
                    return `${trimmedLine} -->`;
                }
                return `${trimmedLine}`;
            default:
                if (isStart && isEnd) {
                    return `/* ${trimmedLine} */`;
                }
                if (isStart) {
                    return `/* ${trimmedLine}`;
                }
                if (isEnd) {
                    return ` * ${trimmedLine}\n */`;
                }
                return ` * ${trimmedLine}`;
        }
    }
}
