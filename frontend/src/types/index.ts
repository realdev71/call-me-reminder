export type ReminderStatus = 'scheduled' | 'completed' | 'failed';

export interface Reminder {
    id: number;
    title: string;
    message: string;
    phone_number: string;
    remind_at: string; // ISO string
    timezone: string;
    status: ReminderStatus;
    created_at: string;
    updated_at: string;
}

export interface ReminderCreate {
    title: string;
    message: string;
    phone_number: string;
    remind_at: string;
    timezone: string;
}

export interface ReminderUpdate {
    title?: string;
    message?: string;
    phone_number?: string;
    remind_at?: string;
    timezone?: string;
    status?: ReminderStatus;
}
