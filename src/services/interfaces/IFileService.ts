import { CommentStyle } from "../../types/CommentStyle";
import { FileInfo } from "../../types/FileInfo";

export interface IFileService {
    readonly language: string;
    readonly extension: string;
    readonly fileInfo: FileInfo;
    readonly commentStyle: CommentStyle;

    shouldProcessFile(filePath: string): boolean;
    insertIntoFile(): Promise<boolean>;
}
