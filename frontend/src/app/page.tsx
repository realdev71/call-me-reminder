'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Reminder, ReminderCreate, ReminderUpdate, ReminderStatus } from '@/types';
import { ReminderCard } from '@/components/reminder-card';
import { ReminderForm } from '@/components/reminder-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Plus, Search, Bell, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReminderStatus | 'all'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getReminders(
        status === 'all' ? undefined : status,
        search || undefined
      );
      setReminders(data);
    } catch (err) {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchReminders();
    // Poll for status updates
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const handleCreate = async (data: ReminderCreate) => {
    try {
      setSubmitting(true);
      await api.createReminder(data);
      toast.success('Reminder scheduled successfully');
      setIsCreateOpen(false);
      fetchReminders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: ReminderUpdate) => {
    if (!editingReminder) return;
    try {
      setSubmitting(true);
      await api.updateReminder(editingReminder.id, data);
      toast.success('Reminder updated');
      setEditingReminder(null);
      fetchReminders();
    } catch (err: any) {
      toast.error('Failed to update reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      toast.success('Reminder deleted');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Bell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Call Me</h1>
              <p className="text-muted-foreground">Smart AI Voice Reminders</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full px-6 shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all">
                <Plus className="mr-2 h-5 w-5" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Schedule Reminder</DialogTitle>
              </DialogHeader>
              <ReminderForm onSubmit={handleCreate} isLoading={submitting} />
            </DialogContent>
          </Dialog>
        </header>

        {/* Global Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by title or message..."
              className="pl-10 bg-card/30 border-border/50 focus:border-primary/50 transition-all rounded-xl h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 bg-card/30 border border-border/50 rounded-xl h-11 p-1">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">All</TabsTrigger>
              <TabsTrigger value="scheduled" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">Scheduled</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white">Done</TabsTrigger>
              <TabsTrigger value="failed" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {loading && reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Fetching your reminders...</p>
          </div>
        ) : reminders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={setEditingReminder}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-card/20 rounded-3xl border-2 border-dashed border-border/50 animate-in zoom-in-95 duration-500">
            <div className="bg-muted p-6 rounded-full mb-6">
              <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No reminders found</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-sm">
              {status === 'all'
                ? "You haven't created any reminders yet. Get started by clicking the 'New Reminder' button above."
                : `No ${status} reminders found.`}
            </p>
            {status !== 'all' && (
              <Button variant="outline" onClick={() => setStatus('all')}>
                Show All Reminders
              </Button>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingReminder} onOpenChange={(open) => !open && setEditingReminder(null)}>
          <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Reminder</DialogTitle>
            </DialogHeader>
            {editingReminder && (
              <ReminderForm
                initialData={editingReminder}
                onSubmit={handleUpdate}
                isLoading={submitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Toaster position="top-right" closeButton theme="dark" />
    </div>
  );
}
