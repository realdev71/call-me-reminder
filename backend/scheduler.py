from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
from sqlalchemy.future import select
from . import models, database
from .vapi_service import VapiService
import asyncio

scheduler = AsyncIOScheduler()

async def check_reminders():
    async with database.async_session() as session:
        # Find reminders where remind_at <= now and status is SCHEDULED
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        query = select(models.Reminder).where(
            models.Reminder.remind_at <= now,
            models.Reminder.status == models.ReminderStatus.SCHEDULED
        )
        result = await session.execute(query)
        reminders = result.scalars().all()

        for reminder in reminders:
            print(f"Triggering reminder: {reminder.title}")
            result = await asyncio.to_thread(VapiService.trigger_call,
                phone_number=reminder.phone_number,
                message=reminder.message
            )
            
            if result.get("status") != "error":
                reminder.status = models.ReminderStatus.COMPLETED
            else:
                reminder.status = models.ReminderStatus.FAILED
            
            session.add(reminder) # Add the modified reminder to the session
            await session.commit() # Commit after each reminder is processed

def start_scheduler():
    scheduler.add_job(check_reminders, "interval", seconds=30)
    scheduler.start()
