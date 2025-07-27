export type LineComment = {
	type: "line";
	prefix: string;
};

export type BlockComment = {
	type: "block";
	start: string;
	end: string;
};

export type CommentInfo = LineComment | BlockComment;

export type CommentLookupType = {
	[key: string]: CommentInfo;
};

export type CommentLookupVal = CommentLookupType[string];

/**
 * Comment style lookup table for different programming languages.
 *
 * Maps language IDs to their corresponding comment styles (line vs block).
 * Used by comment type manager for determining proper license formatting.
 */
export const CommentLookup: CommentLookupType = {
	python: { type: "line", prefix: "# " },
	javascript: { type: "block", start: "/*", end: " */" },
	typescript: { type: "block", start: "/*", end: " */" },
	cpp: { type: "block", start: "/*", end: " */" },
	c: { type: "block", start: "/*", end: " */" },
	java: { type: "block", start: "/*", end: " */" },
	html: { type: "block", start: "<!--", end: " -->" },
	csharp: { type: "block", start: "/*", end: " */" },
	php: { type: "block", start: "/*", end: " */" },
	go: { type: "block", start: "/*", end: " */" },
	rust: { type: "block", start: "/*", end: " */" },
	swift: { type: "block", start: "/*", end: " */" },
	kotlin: { type: "block", start: "/*", end: " */" },
	scala: { type: "block", start: "/*", end: " */" },
	dart: { type: "block", start: "/*", end: " */" },
	css: { type: "block", start: "/*", end: " */" },
	scss: { type: "block", start: "/*", end: " */" },
};

/**
 * Array of supported programming language IDs.
 *
 * List of all language IDs that have comment style configurations.
 */
export const Languages = [
	"python",
	"javascript",
	"typescript",
	"cpp",
	"c",
	"java",
	"html",
	"csharp",
	"php",
	"go",
	"rust",
	"swift",
	"kotlin",
	"scala",
	"dart",
	"css",
	"scss",
];
