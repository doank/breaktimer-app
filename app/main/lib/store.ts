import Store from "electron-store";
import {Settings, NotificationType, BreaksMode} from "../../types/settings";
import { setAutoLauch } from "./auto-launch";
import { initBreaks } from "./breaks";

const defaultSettings: Settings = {
  autoLaunch: true,
  breaksEnabled: true,
  breaksMode: BreaksMode.Default,
  notificationType: NotificationType.Popup,
  breakFrequency: new Date(0, 0, 0, 0, 28),
  breakLength: new Date(0, 0, 0, 0, 2),
  postponeLength: new Date(0, 0, 0, 0, 3),
  postponeLimit: 0,
  workingHoursEnabled: true,
  workingHoursFrom: new Date(0, 0, 0, 9),
  workingHoursTo: new Date(0, 0, 0, 18),
  workingHoursMonday: true,
  workingHoursMondaySchedules: [],
  workingHoursTuesday: true,
  workingHoursTuesdaySchedules: [],
  workingHoursWednesday: true,
  workingHoursWednesdaySchedules: [],
  workingHoursThursday: true,
  workingHoursThursdaySchedules: [],
  workingHoursFriday: true,
  workingHoursFridaySchedules: [],
  workingHoursSaturday: false,
  workingHoursSaturdaySchedules: [],
  workingHoursSunday: false,
  workingHoursSundaySchedules: [],
  idleResetEnabled: true,
  idleResetLength: new Date(0, 0, 0, 0, 5),
  idleResetNotification: false,
  gongEnabled: true,
  gongStartPath: '../../renderer/sounds/gong_start.wav',
  gongEndPath: '../../renderer/sounds/gong_start.wav',
  breakTitle: "Time for a break!",
  breakMessage: "Rest your eyes. Stretch your legs. Breathe. Relax.",
  backgroundColor: "#16a085",
  backdropColor: "#001914",
  textColor: "#ffffff",
  showBackdrop: true,
  backdropOpacity: 0.7,
  endBreakEnabled: true,
  skipBreakEnabled: false,
  postponeBreakEnabled: true,
  backgroundImage: ''
};

const store = new Store<{
  settings: Settings;
  appInitialized: boolean;
  requireAppRestart: boolean;
}>({
  defaults: {
    settings: defaultSettings,
    appInitialized: false,
    requireAppRestart: false,
  },
});

export function getSettings(): Settings {
  return Object.assign(defaultSettings, store.get("settings")) as Settings;
}

export function setSettings(settings: Settings, resetBreaks = true): void {
  const currentSettings = getSettings();

  if (currentSettings.autoLaunch !== settings.autoLaunch) {
    setAutoLauch(settings.autoLaunch);
  }

  store.set({ settings });

  if (resetBreaks) {
    initBreaks();
  }
}

export function getAppInitialized(): boolean {
  return store.get("appInitialized") as boolean;
}

export function setAppInitialized(): void {
  store.set({ appInitialized: true });
}

export function initializeRequireAppRestart(): void {
  store.set({requireAppRestart: false});
}

export function setRequireAppRestart(): void {
  store.set({requireAppRestart: true});
}

export function isRequireAppRestart(): boolean {
  return store.get("requireAppRestart") as boolean;
}

export function setBreaksEnabled(breaksEnabled: boolean): void {
  const settings: Settings = getSettings();
  setSettings({ ...settings, breaksEnabled }, false);
}
