import {Schedule} from "./schedule";

export enum NotificationType {
  Notification = "NOTIFICATION",
  Popup = "POPUP",
}

export interface Settings {
  autoLaunch: boolean;
  breaksEnabled: boolean;
  notificationType: NotificationType;
  breakFrequency: Date;
  breakLength: Date;
  postponeLength: Date;
  postponeLimit: number;
  workingHoursEnabled: boolean;
  workingHoursFrom: Date;
  workingHoursTo: Date;
  workingHoursMonday: boolean;
  workingHoursMondaySchedules: Schedule[];
  workingHoursTuesday: boolean;
  workingHoursTuesdaySchedules: Schedule[];
  workingHoursWednesday: boolean;
  workingHoursWednesdaySchedules: Schedule[];
  workingHoursThursday: boolean;
  workingHoursThursdaySchedules: Schedule[];
  workingHoursFriday: boolean;
  workingHoursFridaySchedules: Schedule[];
  workingHoursSaturday: boolean;
  workingHoursSaturdaySchedules: Schedule[];
  workingHoursSunday: boolean;
  workingHoursSundaySchedules: Schedule[];
  idleResetEnabled: boolean;
  idleResetLength: Date;
  idleResetNotification: boolean;
  gongEnabled: boolean;
  breakTitle: string;
  breakMessage: string;
  backgroundColor: string;
  textColor: string;
  showBackdrop: boolean;
  backdropColor: string;
  backdropOpacity: number;
  endBreakEnabled: boolean;
  skipBreakEnabled: boolean;
  postponeBreakEnabled: boolean;
}
