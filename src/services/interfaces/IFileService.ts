import { CommentStyle } from "../../types/CommentStyle";
import { FileInfo } from "../../types/FileInfo";
import { Result } from "../../types/Result";

export interface IFileService {
    readonly language: string;
    readonly extension: string;
    readonly fileInfo: FileInfo;
    readonly commentStyle: CommentStyle;

    shouldProcessFile(): boolean;
    insertIntoFile(license: string): Promise<Result<boolean, Error>>;
    hasLicense(): Promise<Result<boolean, Error>>;
    hasTypo(
        extractedLicense: string,
        defaultTemplate: string
    ): Promise<Result<boolean, Error>>;
    extractLicense(content: string): string;
}
