export interface IStatusManager {
	initialize(): void;
	updateStatusBar(text: string): void;
	showStatusBar(): void;
	hideStatusBar(): void;

	updateCoverage(totalFiles: number, licensedFiles: number): void;
	trackFile(filePath: string, hasLicense: boolean): void;
	removeFile(filePath: string): void;

	getStatistics(): {
		totalFiles: number;
		licensedFiles: number;
		coveragePercentage: number;
	};

	dispose(): void;
}
