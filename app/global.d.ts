declare const ipcRenderer: {
  invokeBreakPostpone: () => Promise<void>;
  invokeGetAllowPostpone: () => Promise<boolean>;
  invokeGetBreakLength: () => Promise<Date>;
  invokeGetSettings: () => Promise<unknown>;
  invokeGongEndPlay: () => Promise<unknown>;
  invokeGongStartPlay: () => Promise<unknown>;
  invokeSkipBreak: () => Promise<void>;
  invokeSetSettings: (settings: unknown) => Promise<void>;
  invokeSetRequireAppRestart: () => Promise<unknown>;
  invokeIsRequireAppRestart: () => Promise<boolean>;
  onPlayEndGong: (cb: () => void) => Promise<void>;
  onPlayStartGong: (cb: () => void) => Promise<void>;
};

declare const processEnv: {
  [key: string]: string;
};

declare module "*.scss" {
  const content: { [className: string]: string };
  export = content;
}
