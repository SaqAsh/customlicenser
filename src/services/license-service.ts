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
