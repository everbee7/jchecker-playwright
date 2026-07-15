import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("jobChecker", {
  saveMongoUri: (uri: string) => ipcRenderer.invoke("save-mongo-uri", uri),
});
