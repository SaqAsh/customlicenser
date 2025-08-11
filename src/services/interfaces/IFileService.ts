import { CommentStyle } from "../../types/CommentStyle";
import { FileInfo } from "../../types/FileInfo";

export interface IFileService {
	readonly language: string;
	readonly extension: string;
	readonly fileInfo: FileInfo;
	readonly commentStyle: CommentStyle;

	shouldProcessFile(): boolean;
	insertIntoFile(license: string): Promise<Result<boolean, Error>>;
	hasLicense(): Promise<Result<boolean, Error>>;
	extractLicense(content: string): string;
}
