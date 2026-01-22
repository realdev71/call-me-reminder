import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
import json

import backend.database as db_module
from backend.database import Base, get_db, init_db
from backend.main import app, lifespan, create_reminder, read_reminders, update_reminder, read_reminder, delete_reminder, root
from backend.scheduler import check_reminders, start_scheduler, scheduler
from backend.vapi_service import VapiService, settings
from backend import models, schemas

# Use a separate test database
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_reminders.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Call Me Reminder API"}

@pytest.mark.asyncio
async def test_crud_flow(client):
    # Create
    rem_data = {
        "title": "Test Title",
        "message": "Test Message",
        "phone_number": "+14155550000",
        "remind_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "timezone": "UTC"
    }
    response = await client.post("/reminders/", json=rem_data)
    assert response.status_code == 201
    reminder = response.json()
    assert reminder["title"] == "Test Title"
    assert reminder["status"] == "scheduled"
    reminder_id = reminder["id"]

    # Read All
    response = await client.get("/reminders/")
    assert response.status_code == 200
    assert any(r["id"] == reminder_id for r in response.json())

    # Read Search
    response = await client.get(f"/reminders/?search=Test")
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Read Status Filter
    response = await client.get(f"/reminders/?status=scheduled")
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Update
    update_data = {"title": "Updated Title", "status": "completed"}
    response = await client.put(f"/reminders/{reminder_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"
    assert response.json()["status"] == "completed"

    # Delete
    response = await client.delete(f"/reminders/{reminder_id}")
    assert response.status_code == 204

    # Delete Non-existent
    response = await client.delete(f"/reminders/{reminder_id}")
    assert response.status_code == 404

    # Update Non-existent
    response = await client.put(f"/reminders/999", json=update_data)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_scheduler_trigger():
    async with TestingSessionLocal() as session:
        reminder = models.Reminder(
            title="Past", message="Old", phone_number="+14155550000",
            remind_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1),
            timezone="UTC", status=models.ReminderStatus.SCHEDULED
        )
        session.add(reminder)
        await session.commit()
    
    with patch("backend.vapi_service.VapiService.trigger_call", return_value={"status": "mocked"}):
        with patch("backend.database.async_session", return_value=TestingSessionLocal()):
            await check_reminders()
    
    async with TestingSessionLocal() as session:
        res = await session.execute(select(models.Reminder).where(models.Reminder.title == "Past"))
        db_rem = res.scalars().first()
        assert db_rem.status == models.ReminderStatus.COMPLETED

@pytest.mark.asyncio
async def test_scheduler_trigger_failure():
    async with TestingSessionLocal() as session:
        reminder = models.Reminder(
            title="Fail", message="Fail", phone_number="+14155550001",
            remind_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1),
            timezone="UTC", status=models.ReminderStatus.SCHEDULED
        )
        session.add(reminder)
        await session.commit()
    
    with patch("backend.vapi_service.VapiService.trigger_call", return_value={"status": "error"}):
        with patch("backend.database.async_session", return_value=TestingSessionLocal()):
            await check_reminders()
    
    async with TestingSessionLocal() as session:
        res = await session.execute(select(models.Reminder).where(models.Reminder.title == "Fail"))
        db_rem = res.scalars().first()
        assert db_rem.status == models.ReminderStatus.FAILED

@pytest.mark.asyncio
async def test_vapi_service_real():
    # Mocking requests.post for VapiService
    with patch("backend.vapi_service.settings.vapi_api_key", "valid_key"):
        with patch("requests.post") as mock_post:
            mock_post.return_value.json.return_value = {"id": "call_123"}
            mock_post.return_value.raise_for_status = MagicMock()
            res = VapiService.trigger_call("+14155550000", "Hello")
            assert res["id"] == "call_123"

        with patch("requests.post", side_effect=Exception("API Error")):
            res = VapiService.trigger_call("+14155550000", "Hello")
            assert res["status"] == "error"

@pytest.mark.asyncio
async def test_direct_endpoints_full():
    async with TestingSessionLocal() as db:
        # Create
        rem_in = schemas.ReminderCreate(
            title="D", message="M", phone_number="+14155550000",
            remind_at=datetime.now(timezone.utc).replace(tzinfo=None), timezone="UTC"
        )
        rem = await create_reminder(rem_in, db)
        assert rem.id is not None

        # Read All with search/status
        all_rems = await read_reminders(db=db, search="D", status=schemas.ReminderStatus.SCHEDULED)
        assert len(all_rems) >= 1

        # Read One
        one = await read_reminder(rem.id, db)
        assert one.id == rem.id

        # Update
        upd = schemas.ReminderUpdate(title="New D")
        res_upd = await update_reminder(rem.id, upd, db)
        assert res_upd.title == "New D"

        # Delete
        await delete_reminder(rem.id, db)

@pytest.mark.asyncio
async def test_schema_validation_edges():
    # hit optional phone validator in ReminderUpdate
    schemas.ReminderUpdate(phone_number="+14155551111")
    with pytest.raises(ValueError):
        schemas.ReminderUpdate(phone_number="not-a-number")

@pytest.mark.asyncio
async def test_vapi_service_mock_hit():
    # Ensure placeholder key triggers mock print
    with patch("backend.vapi_service.settings.vapi_api_key", "your_vapi_api_key_here"):
        res = VapiService.trigger_call("+14155550000", "Mock Test")
        assert res["status"] == "mocked"

@pytest.mark.asyncio
async def test_lifespan():
    mock_app = MagicMock()
    m_sched = MagicMock()
    m_sched.running = True
    
    async def async_none(*args, **kwargs):
        return None

    with patch("backend.database.init_db", side_effect=async_none), \
         patch("backend.scheduler.start_scheduler"), \
         patch("backend.scheduler.scheduler", m_sched):
        async with lifespan(mock_app):
            pass
        m_sched.shutdown.assert_called_once()

@pytest.mark.asyncio
async def test_db_init():
    with patch.object(db_module, "engine", test_engine):
        await init_db()

def test_scheduler_start_wrapper():
    with patch("backend.scheduler.scheduler.start"), \
         patch("backend.scheduler.scheduler.add_job"):
        start_scheduler()

def test_pydantic_validation():
    with pytest.raises(ValueError):
        schemas.ReminderCreate(
            title="Short", message="Msg", phone_number="invalid",
            remind_at=datetime.now(), timezone="UTC"
        )
