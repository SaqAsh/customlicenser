import * as vscode from "vscode";
/**
 * Retrieves the default license value from VSCode workspace configuration
 * @param configurationName - The name of the configuration setting to retrieve
 * @returns The license value as a string if found, undefined otherwise
 */
export const getCurrConfigVal = <T>(configurationName: string) => {
    return vscode.workspace
        .getConfiguration("customlicenser", null)
        .get<T>(configurationName);
};
