const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const isMac = process.platform === "darwin";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1120,
    minHeight: 720,
    title: "懂你 Link Dock",
    backgroundColor: "#dfe5ec",
    autoHideMenuBar: true,
    titleBarStyle: "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "..", "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const localUrl = new URL(win.webContents.getURL());
    const nextUrl = new URL(url);
    if (nextUrl.protocol !== "file:" || nextUrl.pathname !== localUrl.pathname) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
