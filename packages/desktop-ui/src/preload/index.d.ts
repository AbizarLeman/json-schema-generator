import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      validateOpenAPISpecification: (argument: string) => Promise<boolean>;
      getSchemasByFilePath: (argument: string) => Promise<string[]>;
      openFileDialog: () => Promise<string[]>;
      openDirectoryDialog: () => Promise<string[]>;
      openFileExplorer: (argument: string) => void;
      generateSchemaFile: (argument: GenerateSchemaFileCommand) => void;
    }
  }
}
