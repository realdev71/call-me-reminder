'use client';

import { useState, useEffect } from 'react';
import { ReminderCreate, ReminderUpdate, Reminder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ReminderFormProps {
    initialData?: Reminder;
    onSubmit: (data: ReminderCreate | ReminderUpdate) => void;
    isLoading: boolean;
}

export function ReminderForm({ initialData, onSubmit, isLoading }: ReminderFormProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        message: initialData?.message || '',
        phone_number: initialData?.phone_number || '',
        remind_at: initialData?.remind_at
            ? new Date(initialData.remind_at).toISOString().slice(0, 16)
            : '',
        timezone: initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form data:', formData);

        // Validation
        if (!formData.title || !formData.message || !formData.phone_number) {
            toast.error('Please fill in required fields');
            return;
        }

        if (!formData.remind_at) {
            toast.error('Scheduled time is required');
            return;
        }

        if (new Date(formData.remind_at) <= new Date()) {
            toast.error('Date and time must be in the future');
            return;
        }

        if (!/^\+\d{10,15}$/.test(formData.phone_number)) {
            toast.error('Phone number must be in E.164 format (+14155552671)');
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    placeholder="e.g., Dentist Appointment"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">Spoken Message</Label>
                <Input
                    id="message"
                    placeholder="What will the AI say?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        placeholder="+14155552671"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="datetime">Date & Time</Label>
                    <Input
                        id="datetime"
                        type="datetime-local"
                        value={formData.remind_at}
                        onChange={(e) => setFormData({ ...formData, remind_at: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                    value={formData.timezone}
                    onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={formData.timezone}>{formData.timezone} (Auto-detected)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DialogFooter className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? 'Saving...' : initialData ? 'Update Reminder' : 'Create Reminder'}
                </Button>
            </DialogFooter>
        </form>
    );
}
