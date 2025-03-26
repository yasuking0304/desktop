import { mock } from 'node:test'

mock.module('electron', {
  namedExports: {
    shell: {
      trashItem: mock.fn(async () => {}),
    },
    remote: {
      app: {
        on: mock.fn(() => {}),
      },
      autoUpdater: {
        on: mock.fn(() => {}),
      },
      nativeTheme: {
        addListener: mock.fn(() => {}),
        removeAllListeners: mock.fn(() => {}),
        shouldUseDarkColors: true,
      },
    },
    ipcRenderer: {
      on: mock.fn(x => {}),
      send: mock.fn(() => {}),
      invoke: mock.fn(() => {}),
    },
  },
})
