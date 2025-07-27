import { CommentLookup, CommentInfo } from "../types/CommentLookup";
import { fileTypeManger } from "./fileTypeManager";

/**
 * Determines the appropriate comment style for the current file.
 *
 * Analyzes the file's programming language and returns the corresponding comment
 * configuration (line comments like # or //, or block comments like / * * /).
 *
 * @returns Promise resolving to comment configuration or undefined if language not supported
 */
export const determineCommentType = async (): Promise<
	CommentInfo | undefined
> => {
	const res = await fileTypeManger();
	if (res === undefined) {
		return undefined;
	}
	const languageID = res.languageID;

	if (languageID in CommentLookup) {
		return CommentLookup[languageID as keyof typeof CommentLookup];
	}

	return undefined;
};
