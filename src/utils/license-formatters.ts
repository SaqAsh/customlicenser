/**
 * Prepends a comment marker based on language for line comments.
 * @param line - A single line of text
 * @param language - Programming language identifier
 * @returns Commented line
 */
const prependCommentString = (line: string, language: string): string => {
	const trimmedLine = line.trim();
	switch (language) {
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
};

/**
 * Formats a line of text with block comment delimiters based on language.
 * @param line - A single line of text
 * @param language - Programming language identifier
 * @param isStart - Whether it's the first line of the block
 * @param isEnd - Whether it's the last line of the block
 * @returns Formatted block comment line
 */
const blockPrepend = (
	line: string,
	language: string,
	isStart: boolean,
	isEnd: boolean
): string => {
	const trimmedLine = line.trim();
	switch (language) {
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
			if (isStart && isEnd) return `/* ${trimmedLine} */`;
			if (isStart) return `/* ${trimmedLine}`;
			if (isEnd) return ` * ${trimmedLine} */`;
			return ` * ${trimmedLine}`;
		case "python":
			if (isStart && isEnd) return `""" ${trimmedLine} """`;
			if (isStart) return `""" ${trimmedLine}`;
			if (isEnd) return `${trimmedLine} """`;
			return `${trimmedLine}`;
		case "html":
		case "xml":
			if (isStart && isEnd) return `<!-- ${trimmedLine} -->`;
			if (isStart) return `<!-- ${trimmedLine}`;
			if (isEnd) return `${trimmedLine} -->`;
			return `${trimmedLine}`;
		default:
			if (isStart && isEnd) return `/* ${trimmedLine} */`;
			if (isStart) return `/* ${trimmedLine}`;
			if (isEnd) return ` * ${trimmedLine} */`;
			return ` * ${trimmedLine}`;
	}
};

/**
 * Formats the middle lines of a block comment using asterisk prefix.
 * @param lines - Array of text lines
 * @returns Joined block body with prefixes
 */
const blockBodyFormat = (lines: string[]): string => {
	return lines.map((line) => ` * ${line.trim()}`).join("\n");
};

/**
 * Formats a license as a line comment for the entire template.
 * @param licenseTemplate - Raw license text
 * @param language - Programming language identifier
 * @returns Line-commented license
 */
export const lineFormatLicense = (
	licenseTemplate: string,
	language: string
): string => {
	return licenseTemplate
		.split("\n")
		.map((line) => prependCommentString(line, language))
		.join("\n");
};

/**
 * Formats a license using C-style block comment structure.
 * @param licenseTemplate - Raw license text
 * @param language - Programming language identifier
 * @returns Block-commented license
 */
export const blockFormatLicense = (
	licenseTemplate: string,
	language: string
): string => {
	const lines = licenseTemplate.split("\n");

	if (lines.length === 0) return "";

	if (lines.length === 1) return blockPrepend(lines[0], language, true, true);

	const firstLine = blockPrepend(lines[0], language, true, false);
	const body = blockBodyFormat(lines.slice(1, lines.length - 1));
	const lastLine = blockPrepend(
		lines[lines.length - 1],
		language,
		false,
		true
	);

	return [firstLine, body, lastLine].join("\n");
};
