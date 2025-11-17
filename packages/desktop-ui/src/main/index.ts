/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import {
  generateSchemaFile,
  getSchemasByFilePath,
  validateOpenAPISpecification,
} from "@json-schema-generator-monorepo/core/services/open-api-services";
import {
  browseDirectoryDialog,
  browseFileDialog,
  openFileExplorer,
} from "@json-schema-generator-monorepo/core/services/directory-services";
import { GenerateSchemaFileCommand } from "@json-schema-generator-monorepo/core/types";

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-features", "UseLinuxVSocket");
app.commandLine.appendSwitch("disable-gpu");

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 250,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
    icon: join(__dirname, "../../resources/icons/win/icon.ico"),
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
};

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle(
    "validate-open-api-specification",
    async (_event, argument: string) =>
      await validateOpenAPISpecification(argument),
  );
  ipcMain.handle(
    "get-schemas-by-file-path",
    async (_event, argument: string) => await getSchemasByFilePath(argument),
  );
  ipcMain.handle("browse-file-dialog", async () => await browseFileDialog());
  ipcMain.handle(
    "browse-directory-dialog",
    async () => await browseDirectoryDialog(),
  );
  ipcMain.handle(
    "open-file-explorer",
    async (_event, argument: string) => await openFileExplorer(argument),
  );
  ipcMain.handle(
    "generate-schema-file",
    async (_event, argument: GenerateSchemaFileCommand) =>
      await generateSchemaFile(argument),
  );

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
