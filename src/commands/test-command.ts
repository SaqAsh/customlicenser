import { error, info } from "../loggers";

export async function testCommand(): Promise<void> {
	try {
		await info(
			"CustomLicenser extension is working! Test command executed successfully."
		);
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Test command failed: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}
