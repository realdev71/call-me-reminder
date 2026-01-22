'use client';

import { Reminder } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Phone, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCountdown } from '@/hooks/use-countdown';

interface ReminderCardProps {
    reminder: Reminder;
    onEdit: (reminder: Reminder) => void;
    onDelete: (id: number) => void;
}

const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ReminderCard({ reminder, onEdit, onDelete }: ReminderCardProps) {
    const countdown = useCountdown(reminder.remind_at);
    const isScheduled = reminder.status === 'scheduled';

    const maskPhone = (phone: string) => {
        return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1-***-***-$4');
    };

    return (
        <Card className="group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold tracking-tight">{reminder.title}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(reminder.remind_at), 'PPP p')}
                    </div>
                </div>
                <Badge className={statusColors[reminder.status]}>
                    {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center text-sm">
                        <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                        <p className="line-clamp-2 italic text-muted-foreground">"{reminder.message}"</p>
                    </div>
                    <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4 text-primary" />
                        <span>{maskPhone(reminder.phone_number)}</span>
                    </div>
                </div>

                {isScheduled && (
                    <div className="pt-2">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Time Remaining
                        </div>
                        <div className="text-sm font-mono text-primary animate-pulse">
                            {countdown}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(reminder)}
                        className="h-8 w-8 hover:text-primary"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(reminder.id)}
                        className="h-8 w-8 hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
