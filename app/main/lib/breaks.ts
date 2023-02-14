import moment, {Moment} from "moment";
import {PowerMonitor} from "electron";
import {Settings, NotificationType, BreaksMode} from "../../types/settings";
import {BreakTime} from "../../types/breaks";
import {IpcChannel} from "../../types/ipc";
import {sendIpc} from "./ipc";
import {getSettings} from "./store";
import {buildTray} from "./tray";
import {showNotification} from "./notifications";
import {createBreakWindows} from "./windows";
import {Schedule} from "../../types/schedule";

let powerMonitor: PowerMonitor;
let nextSchedule: Schedule | null = null;
let breakTime: BreakTime = null;
let havingBreak = false;
let postponedCount = 0;
let idleStart: Date | null = null;
let lockStart: Date | null = null;
let lastTick: Date | null = null;
let lastSkippedSchedule: Schedule | null = null;

export function getBreakTime(): BreakTime {
  return breakTime;
}

export function getBreakLength(): Date {
  const settings: Settings = getSettings();
  if (settings.breaksMode === BreaksMode.Schedule && nextSchedule !== null) {
    return new Date(0, 0, 0, nextSchedule.endTime.getHours() - nextSchedule.startTime.getHours(), nextSchedule.endTime.getMinutes() - nextSchedule.startTime.getMinutes(), 0);
  }
  return settings.breakLength;
}

function zeroPad(n: number) {
  const nStr = String(n);
  return nStr.length === 1 ? `0${nStr}` : nStr;
}

function getSeconds(date: Date): number {
  return (
    date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds() || 1
  ); // can't be 0
}

function getIdleResetSeconds(): number {
  const settings: Settings = getSettings();
  return getSeconds(new Date(settings.idleResetLength));
}

function getBreakSeconds(): number {
  const settings: Settings = getSettings();
  return getSeconds(new Date(settings.breakFrequency));
}

function createIdleNotification() {
  const settings: Settings = getSettings();

  if (!settings.idleResetEnabled || idleStart === null) {
    return;
  }

  let idleSeconds = Number(((+new Date() - +idleStart) / 1000).toFixed(0));
  let idleMinutes = 0;
  let idleHours = 0;

  if (idleSeconds > 60) {
    idleMinutes = Math.floor(idleSeconds / 60);
    idleSeconds -= idleMinutes * 60;
  }

  if (idleMinutes > 60) {
    idleHours = Math.floor(idleMinutes / 60);
    idleMinutes -= idleHours * 60;
  }

  if (settings.idleResetNotification) {
    showNotification(
      "Break countdown reset",
      `Idle for ${zeroPad(idleHours)}:${zeroPad(idleMinutes)}:${zeroPad(
        idleSeconds
      )}`
    );
  }
}

export function createBreak(isPostpone = false): void {
  const settings: Settings = getSettings();

  if (idleStart) {
    createIdleNotification();
    idleStart = null;
    postponedCount = 0;
  }

  if (isPostpone) {
    const freq = new Date(settings.postponeLength);

    breakTime = moment()
      .add(freq.getHours(), "hours")
      .add(freq.getMinutes(), "minutes")
      .add(freq.getSeconds(), "seconds");
    return;
  }

  switch (settings.breaksMode) {
    case BreaksMode.Schedule:
      let foundNextSchedule = false;
      const now = moment();
      const dayString = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const daySchedules = (settings as any)['workingHours' + dayString[now.day() as keyof Days] + 'Schedules'] as Schedule[];

      // Ensure that startTime and endTime is a Date
      daySchedules.map((schedule) => {
        if (typeof schedule.startTime === 'string') schedule.startTime = new Date(schedule.startTime);
        if (typeof schedule.endTime === 'string') schedule.endTime = new Date(schedule.endTime);
        return schedule;
      });

      daySchedules.sort((a, b) => {
        return a.startTime.getTime() - b.startTime.getTime();
      });

      daySchedules.forEach((schedule) => {
        if (!foundNextSchedule) {
          const scheduleStart = moment();
          scheduleStart.set('hour', schedule.startTime.getHours());
          scheduleStart.set('minute', schedule.startTime.getMinutes());
          scheduleStart.set('second', 0);

          const scheduleEnd = moment();
          scheduleEnd.set('hour', schedule.endTime.getHours());
          scheduleEnd.set('minute', schedule.endTime.getMinutes());
          scheduleEnd.set('second', 0);

          if (now < scheduleStart || (now > scheduleStart && now < scheduleEnd)) {
            if (lastSkippedSchedule === null ||
              (
                lastSkippedSchedule &&
                lastSkippedSchedule.startTime.getTime() !== schedule.startTime.getTime() &&
                lastSkippedSchedule.endTime.getTime() !== schedule.endTime.getTime()
              )
            ) {
              lastSkippedSchedule = null;
              nextSchedule = schedule;
              breakTime = scheduleStart;
              foundNextSchedule = true;
            }
          }
        }
      });
      break;
    default:
      const freq = new Date(
        isPostpone ? settings.postponeLength : settings.breakFrequency
      );

      breakTime = moment()
        .add(freq.getHours(), "hours")
        .add(freq.getMinutes(), "minutes")
        .add(freq.getSeconds(), "seconds");
      break;
  }

  buildTray();
}

export function endPopupBreak(): void {
  if (breakTime !== null && breakTime < moment()) {
    breakTime = null;
    havingBreak = false;
    postponedCount = 0;
  }
}

export function getAllowPostpone(): boolean {
  const settings = getSettings();
  return !settings.postponeLimit || postponedCount < settings.postponeLimit;
}

export function postponeBreak(): void {
  postponedCount++;
  havingBreak = false;
  createBreak(true);
}

function doBreak(): void {
  havingBreak = true;

  const settings: Settings = getSettings();

  if (settings.notificationType === NotificationType.Notification) {
    showNotification(settings.breakTitle, settings.breakMessage);
    if (settings.gongEnabled) {
      sendIpc(IpcChannel.GongStartPlay);
    }
    havingBreak = false;
    createBreak();
  }

  if (settings.notificationType === NotificationType.Popup) {
    createBreakWindows();
  }
}

interface Days {
  0: boolean;
  1: boolean;
  2: boolean;
  3: boolean;
  4: boolean;
  5: boolean;
  6: boolean;
}

export function checkInWorkingHours(): boolean {
  const settings: Settings = getSettings();

  if (!settings.workingHoursEnabled) {
    return false;
  }

  const now = moment();

  const days: Days = getDays();

  const isWorkingDay = days[now.day() as keyof Days];

  if (!isWorkingDay) {
    return false;
  }

  switch (settings.breaksMode) {
    case BreaksMode.Schedule:
      break;
    default:
      let hoursFrom: Date | Moment = new Date(settings.workingHoursFrom);
      let hoursTo: Date | Moment = new Date(settings.workingHoursTo);
      hoursFrom = moment()
        .set("hours", hoursFrom.getHours())
        .set("minutes", hoursFrom.getMinutes())
        .set("seconds", 0);
      hoursTo = moment()
        .set("hours", hoursTo.getHours())
        .set("minutes", hoursTo.getMinutes())
        .set("seconds", 0);

      if (now < hoursFrom) {
        return false;
      }

      if (now > hoursTo) {
        return false;
      }
      break;
  }

  return true;
}

export function getDays(): Days {
  const settings: Settings = getSettings();

  return {
    0: settings.workingHoursSunday,
    1: settings.workingHoursMonday,
    2: settings.workingHoursTuesday,
    3: settings.workingHoursWednesday,
    4: settings.workingHoursThursday,
    5: settings.workingHoursFriday,
    6: settings.workingHoursSaturday,
  };
}

enum IdleState {
  Active = "active",
  Idle = "idle",
  Locked = "locked",
  Unknown = "unknown",
}

export function checkIdle(): boolean {
  const settings: Settings = getSettings();

  const state: IdleState = powerMonitor.getSystemIdleState(
    getIdleResetSeconds()
  ) as IdleState;

  if (state === IdleState.Locked) {
    if (!lockStart) {
      lockStart = new Date();
      return false;
    } else {
      const lockSeconds = Number(
        ((+new Date() - +lockStart) / 1000).toFixed(0)
      );
      return lockSeconds > getIdleResetSeconds();
    }
  }

  lockStart = null;

  if (!settings.idleResetEnabled) {
    return false;
  }

  return state === IdleState.Idle;
}

function checkShouldHaveBreak(): boolean {
  const settings: Settings = getSettings();
  const inWorkingHours = checkInWorkingHours();
  const idle = checkIdle();

  return !havingBreak && settings.breaksEnabled && inWorkingHours && !idle;
}

function checkBreak(): void {
  const now = moment();

  if (breakTime !== null && now > breakTime) {
    doBreak();
  }
}

export function startBreakNow(): void {
  breakTime = moment();
}

function tick(): void {
  try {
    const shouldHaveBreak = checkShouldHaveBreak();

    // This can happen if the computer is put to sleep. In this case, we want
    // to skip the break if the time the computer was unresponsive was greater
    // than the idle reset.
    const secondsSinceLastTick = lastTick
      ? Math.abs(+new Date() - +lastTick) / 1000
      : 0;
    const breakSeconds = getBreakSeconds();
    const lockSeconds = lockStart && Math.abs(+new Date() - +lockStart) / 1000;

    if (lockStart && lockSeconds !== null && lockSeconds > breakSeconds) {
      // The computer has been locked for longer than the break period. In this
      // case, it's not particularly helpful to show an idle reset
      // notification, so unset idle start
      idleStart = null;
      lockStart = null;
    } else if (secondsSinceLastTick > breakSeconds) {
      // The computer has been slept for longer than the break period. In this
      // case, it's not particularly helpful to show an idle reset
      // notification, so just reset the break
      lockStart = null;
      breakTime = null;
    } else if (secondsSinceLastTick > getIdleResetSeconds()) {
      //  If idleStart exists, it means we were idle before the computer slept.
      //  If it doesn't exist, count the computer going unresponsive as the
      //  start of the idle period.
      if (!idleStart) {
        lockStart = null;
        idleStart = lastTick;
      }
      createBreak();
    }

    if (!shouldHaveBreak && !havingBreak && breakTime) {
      if (checkIdle()) {
        idleStart = new Date();
      }
      breakTime = null;
      buildTray();
      return;
    }

    if (shouldHaveBreak && !breakTime) {
      createBreak();
      return;
    }

    if (shouldHaveBreak) {
      checkBreak();
    }
  } finally {
    lastTick = new Date();
  }
}

let tickInterval: NodeJS.Timeout;

export function initBreaks(): void {
  powerMonitor = require("electron").powerMonitor;

  const settings: Settings = getSettings();

  if (settings.breaksEnabled) {
    createBreak();
  }

  if (tickInterval) {
    clearInterval(tickInterval);
  }

  tickInterval = setInterval(tick, 1000);
}

export function skipBreak(): void {
  lastSkippedSchedule = nextSchedule;
  havingBreak = false;
  breakTime = null;
  createBreak();
  buildTray();
}
