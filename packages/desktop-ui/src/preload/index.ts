import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { GenerateSchemaFileCommand } from "../main/types";

// Custom APIs for renderer
const api = {
  validateOpenAPISpecification: async (argument: string) => await ipcRenderer.invoke("validate-open-api-specification", argument),
  getSchemasByFilePath: async (argument: string) => await ipcRenderer.invoke("get-schemas-by-file-path", argument),
  openFileDialog: () => ipcRenderer.invoke("browse-file-dialog"),
  openDirectoryDialog: () => ipcRenderer.invoke("browse-directory-dialog"),
  openFileExplorer: async (argument: string) => await ipcRenderer.invoke("open-file-explorer", argument),
  generateSchemaFile: async (argument: GenerateSchemaFileCommand) => await ipcRenderer.invoke("generate-schema-file", argument)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
