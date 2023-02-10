import * as React from "react";
import {Button, Card, Switch} from "@blueprintjs/core";
import {TimePicker} from "@blueprintjs/datetime";
import {BreaksMode, Settings} from "../../types/settings";
import {Schedule} from "../../types/schedule";
import styles from "./ScheduleForm.scss";

export interface Props {
    dayOfWeek: string;
    settingsDraft: Settings;
    handleSchedulesChange: (field: string, newVal: Schedule[]) => void;
    handleSwitchChange: (field: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ScheduleForm(props: Props): JSX.Element {
    const settingsPath = 'workingHours' + props.dayOfWeek;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const schedules: Schedule[] = typeof (props.settingsDraft as any)[settingsPath + 'Schedules'] != 'undefined' ? (props.settingsDraft as any)[settingsPath + 'Schedules'] : [];
    const schedulesSettingsPath = settingsPath + 'Schedules';
    const addSchedule = (): void => {
        if (props.settingsDraft !== null) {
            const schedule: Schedule = {
                startTime: new Date(0, 0, 0, 0, 0, 0, 0),
                endTime: new Date(0, 0, 0, 0, 0, 0, 0)
            };
            schedules.push(schedule)
            props.handleSchedulesChange(schedulesSettingsPath, schedules);
        }
    }

    const handleScheduleChange = (field: string, index: number, newVal: Date): void => {
        const schedule = schedules[index];
        (schedule as any)[field] = newVal;
        switch (field) {
            case 'startTime':
                if (schedule.startTime > schedule.endTime) {
                    schedule.endTime = schedule.startTime;
                }
                break;
            case 'endTime':
                if (schedule.startTime < schedule.endTime) {
                    schedule.startTime = schedule.endTime;
                }
                break;
        }
        const newSchedules = schedules;
        newSchedules[index] = schedule;
        props.handleSchedulesChange(schedulesSettingsPath, newSchedules);
    }

    const handleScheduleRemove = (index: number): void => {
        schedules.splice(index, 1);
        props.handleSchedulesChange(schedulesSettingsPath, schedules);
    }

    return (
        <>
            {props.settingsDraft !== null ?
                <>
                    <Switch
                        label={props.dayOfWeek}
                        /* eslint-disable @typescript-eslint/no-explicit-any */
                        checked={(props.settingsDraft as any)[settingsPath]}
                        onChange={props.handleSwitchChange.bind(
                            null,
                            settingsPath
                        )}
                        disabled={
                            !props.settingsDraft.breaksEnabled ||
                            !props.settingsDraft.workingHoursEnabled
                        }
                    />

                    {
                        /* eslint-disable @typescript-eslint/no-explicit-any */
                        (props.settingsDraft as any)[settingsPath] && props.settingsDraft.breaksMode === BreaksMode.Schedule ?
                            <>
                                <Card className={styles.schedulesCard}>
                                    {schedules.map((schedule, i) => {
                                        return (
                                            <div className={styles.scheduleWrap} key={settingsPath + 'Schedule' + i}>
                                                <TimePicker
                                                    value={new Date(schedule.startTime)}
                                                    onChange={handleScheduleChange.bind(null, 'startTime', i)}
                                                    selectAllOnFocus
                                                />
                                                <TimePicker
                                                    value={new Date(schedule.endTime)}
                                                    onChange={handleScheduleChange.bind(null, 'endTime', i)}
                                                    selectAllOnFocus
                                                />
                                                <Button onClick={handleScheduleRemove.bind(null, i)}>-</Button>
                                            </div>
                                        )
                                    })}
                                    <Button className={styles.addSchedule} onClick={addSchedule}>+</Button>
                                </Card>
                            </>
                            :
                            ''
                    }
                </>
                :
                ''
            }
        </>
    );
}
