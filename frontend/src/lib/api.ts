import { Reminder, ReminderCreate, ReminderUpdate, ReminderStatus } from '@/types';

const API_BASE = '/api';

export const api = {
    async getReminders(status?: ReminderStatus, search?: string): Promise<Reminder[]> {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        const response = await fetch(`${API_BASE}/reminders/?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch reminders');
        return response.json();
    },

    async getReminder(id: number): Promise<Reminder> {
        const response = await fetch(`${API_BASE}/reminders/${id}`);
        if (!response.ok) throw new Error('Failed to fetch reminder');
        return response.json();
    },

    async createReminder(data: ReminderCreate): Promise<Reminder> {
        const response = await fetch(`${API_BASE}/reminders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create reminder');
        }
        return response.json();
    },

    async updateReminder(id: number, data: ReminderUpdate): Promise<Reminder> {
        const response = await fetch(`${API_BASE}/reminders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update reminder');
        return response.json();
    },

    async deleteReminder(id: number): Promise<void> {
        const response = await fetch(`${API_BASE}/reminders/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete reminder');
    }
};
