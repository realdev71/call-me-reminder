'use client';

import { useState, useEffect } from 'react';
import { differenceInSeconds, intervalToDuration, formatDuration } from 'date-fns';

export function useCountdown(targetDate: string | Date) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const target = new Date(targetDate);

        const update = () => {
            const now = new Date();
            const seconds = differenceInSeconds(target, now);

            if (seconds <= 0) {
                setTimeLeft('Due now');
                return;
            }

            const duration = intervalToDuration({ start: now, end: target });
            setTimeLeft(formatDuration(duration, {
                format: ['hours', 'minutes', 'seconds'],
                delimiter: ', '
            }));
        };

        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
}
