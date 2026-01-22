from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from contextlib import asynccontextmanager
import os

from . import models, schemas, database, scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.init_db()
    scheduler.start_scheduler()
    yield
    # Shutdown
    if scheduler.scheduler.running:
        scheduler.scheduler.shutdown()

app = FastAPI(title="Call Me Reminder API", lifespan=lifespan)

# Get origins from env (comma separated) or default to localhost
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/reminders/", response_model=List[schemas.Reminder])
async def read_reminders(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[schemas.ReminderStatus] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db)
):
    query = select(models.Reminder)
    if status:
        query = query.where(models.Reminder.status == status)
    if search:
        query = query.where(
            (models.Reminder.title.ilike(f"%{search}%")) | 
            (models.Reminder.message.ilike(f"%{search}%"))
        )
    
    query = query.order_by(models.Reminder.remind_at.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    reminders = result.scalars().all()
    return reminders

@app.put("/reminders/{reminder_id}", response_model=schemas.Reminder)
async def update_reminder(reminder_id: int, reminder_update: schemas.ReminderUpdate, db: AsyncSession = Depends(database.get_db)):
    db_reminder = await db.get(models.Reminder, reminder_id)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    update_data = reminder_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_reminder, key, value)
    
    await db.commit()
    await db.refresh(db_reminder)
    return db_reminder

@app.post("/reminders/", response_model=schemas.Reminder, status_code=status.HTTP_201_CREATED)
async def create_reminder(reminder: schemas.ReminderCreate, db: AsyncSession = Depends(database.get_db)):
    db_reminder = models.Reminder(**reminder.model_dump())
    db.add(db_reminder)
    await db.commit()
    await db.refresh(db_reminder)
    return db_reminder

@app.get("/reminders/{reminder_id}", response_model=schemas.Reminder)
async def read_reminder(reminder_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Reminder).filter(models.Reminder.id == reminder_id))
    db_reminder = result.scalars().first()
    if db_reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return db_reminder

@app.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(reminder_id: int, db: AsyncSession = Depends(database.get_db)):
    db_reminder = await db.get(models.Reminder, reminder_id)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    await db.delete(db_reminder)
    await db.commit()
    return None

@app.get("/")
async def root():
    return {"message": "Welcome to Call Me Reminder API"}
