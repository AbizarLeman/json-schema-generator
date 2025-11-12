/* eslint-disable prettier/prettier */
import { shell, dialog } from "electron";

const browseFileDialog = async (): Promise<string[]> => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
            { name: "YAML Files", extensions: ["yaml", "yml"] },
        ]
    });

    return result.filePaths;
};

const browseDirectoryDialog = async (): Promise<string[]>  => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
    });

    return result.filePaths;
};

const openFileExplorer = async (folderPath: string): Promise<string> => await shell.openPath(folderPath);

export { browseFileDialog, browseDirectoryDialog, openFileExplorer };