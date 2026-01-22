from pydantic import BaseModel, Field, field_validator, ConfigDict
import enum
from datetime import datetime
from typing import Optional, List
import re

class ReminderStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    FAILED = "failed"

class ReminderBase(BaseModel):
    title: str = Field(..., max_length=100)
    message: str
    phone_number: str
    remind_at: datetime
    timezone: str

class ReminderCreate(ReminderBase):
    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str):
        if not re.match(r"^\+\d{10,15}$", v):
            raise ValueError("Phone number must be in E.164 format (e.g., +14155552671)")
        return v

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    message: Optional[str] = None
    phone_number: Optional[str] = None
    remind_at: Optional[datetime] = None
    timezone: Optional[str] = None
    status: Optional[ReminderStatus] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]):
        if v is not None and not re.match(r"^\+\d{10,15}$", v):
            raise ValueError("Phone number must be in E.164 format (e.g., +14155552671)")
        return v

class Reminder(ReminderBase):
    id: int
    status: ReminderStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    api_key: str

class TenantResponse(TenantBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
