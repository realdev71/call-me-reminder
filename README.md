# Call Me Reminder App

A modern, full-stack reminder application featuring automated AI voice calls. Built with **Next.js 14 (App Router)**, **FastAPI**, and **Vapi.ai**.



## Features

- 🎙️ **AI Voice Calls**: Automated calls reminding you of your tasks.
- 🎨 **Premium UI**: Dark-mode first design with shadcn/ui and Tailwind CSS.
- ⚡ **Real-time Status**: Live updates for Scheduled, Completed, and Failed reminders.
- 🔍 **Search & Filter**: Find reminders instantly.
- ⏱️ **Countdowns**: Live timers for upcoming calls.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy (Async), SQLite/PostgreSQL
- **AI/Voice**: Vapi.ai Integration

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Vapi.ai Account (for voice calls)
    - *Note: You do NOT need a Twilio API key in this app. Configure your Twilio numbers directly in the Vapi Dashboard.*

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
# Edit .env with your VAPI_API_KEY
```

Run the server:
```bash
python -m uvicorn main:app --reload
```
API Docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Configure Environment (Optional dev defaults work out of the box)
cp .env.example .env.local
```

Run the development server:
```bash
npm run dev
```
Open `http://localhost:3000` (or 3001 if 3000 is taken).

## Local Testing Flow

We have implemented a **Mock Mode** to verify the end-to-end flow without making actual calls/spending credits.

1.  **Configure Mock Key**:
    In `backend/.env`, set:
    ```env
    VAPI_API_KEY=your_vapi_api_key_here
    ```
    *The backend detects this specific placeholder string and simulates a successful call.*

2.  **Start Servers**:
    Ensure both backend (`uvicorn`) and frontend (`npm run dev`) are running.

3.  **Create Reminder**:
    -   Go to the dashboard.
    -   Click **New Reminder**.
    -   Set title to "Test Flow", Phone to `+15555555555`.
    -   Set time to **2 minutes from now**.
    -   Click **Create**.

4.  **Verify**:
    -   See the reminder in the **Scheduled** tab.
    -   Wait 2 minutes.
    -   The status will automatically change to **Completed** (green badge).
    -   (Optional) Check backend logs to see: `MOCK CALL TRIGGERED: To +15555555555...`

## Configuration

### Environment Variables

**Backend (`backend/.env`):**
- `VAPI_API_KEY`: Your Vapi.ai private API key.
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g., `http://localhost:3000`).

**Frontend (`frontend/.env.local`):**
- `BACKEND_URL`: URL of the FastAPI backend (default: `http://localhost:8000`).

## Deployment

### Backend (Docker/Render/Railway)

1.  **Build**: Use a `Dockerfile` to containerize the FastAPI app.
2.  **Env Vars**: Set `VAPI_API_KEY` and `CORS_ORIGINS` in your cloud provider.
3.  **Run**: Expose port 8000.

### Frontend (Vercel/Netlify)

1.  **Build**: Connect your repo to Vercel.
2.  **Env Vars**: Set `BACKEND_URL` to your deployed backend URL (e.g., `https://my-api.onrender.com`).
3.  **Deploy**: Vercel handles the build and edge routing automatically.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
