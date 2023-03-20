import * as React from "react";
import { Howl } from "howler";
import {Settings} from "../../types/settings";

export default function Sounds() {
  const playSound = (path: string): void => {
    const sound = new Howl({ src: [path] });
    sound.play();
  };

  React.useEffect(() => {
    (async () => {
      const settings = (await ipcRenderer.invokeGetSettings()) as Settings;
      ipcRenderer.onPlayStartGong(() => {
        playSound(settings.gongStartPath);
      });
      ipcRenderer.onPlayEndGong(() => {
        playSound(settings.gongEndPath);
      });
    })();
  }, []);

  return null;
}
