🧠 AI Life Coach – Interactive Communication & Confidence Trainer

An AI-native learning platform designed to help young adults practice real-world communication and life skills through immersive, simulated conversations with intelligent AI personas.
Built for rapid prototyping, human-centered learning, and measurable social impact.

🚀 Overview

AI Life Coach uses conversational AI to simulate real-life scenarios — such as job interviews, conflict resolution, and public speaking — allowing users to practice, receive feedback, and track progress over time.

It combines Next.js 14, FastAPI, LangChain, and OpenAI GPT-4, all backed by Supabase (PostgreSQL + pgvector) for persistence and retrieval-augmented learning.

This MVP demonstrates the convergence of AI, full-stack engineering, and digital learning design — ready for scaling into a production-grade edtech solution.

🎯 Key Features
Feature	Description
🗣️ AI-Powered Simulation	Engage in natural, context-rich dialogues with AI personas trained to simulate real-world communication scenarios.
💬 Dynamic Conversation Engine	Uses LangChain and OpenAI GPT models with Retrieval-Augmented Generation (RAG) for contextual continuity.
🧩 Scenario Library	Includes pre-defined modules like “Job Interview,” “Conflict Resolution,” and “Public Speaking.”
📊 Personalized Feedback	Generates structured scoring (Clarity, Empathy, Assertiveness) and actionable improvement tips.
📈 Learning Dashboard	Tracks user progress, displays feedback history, and visualizes improvement trends over time.
🧠 Modular AI Orchestration	Clean separation between LLM orchestration, feedback logic, and persistence for extensibility.
☁️ Cloud-Native Stack	Deployed via Vercel (Frontend) + Supabase (Backend & DB) for full scalability and real-time sync.
🧱 System Architecture
                    ┌────────────────────────────┐
                    │        Frontend (Next.js)   │
                    │ - Chat & Feedback UI        │
                    │ - Scenario Dashboard        │
                    │ - Auth & Routing            │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │         FastAPI Backend     │
                    │ - Session & Scenario APIs   │
                    │ - LangChain Orchestration   │
                    │ - Feedback Scoring Engine   │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │        Supabase (Postgres)  │
                    │ - Users, Scenarios, Messages│
                    │ - pgvector for RAG Context  │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │         OpenAI / LangChain  │
                    │ - GPT-4 Conversational Model│
                    │ - Feedback & Evaluation LLM │
                    └────────────────────────────┘

⚙️ Tech Stack
Layer	Technology
Frontend	Next.js 14 (App Router, TypeScript, Tailwind CSS)
Backend	FastAPI (Python 3.11), LangChain
Database	Supabase (PostgreSQL + pgvector)
AI Engine	OpenAI GPT-4 / GPT-4o-mini
Deployment	Vercel (Frontend) + Supabase Functions (API)
Auth	Supabase Auth or Clerk (optional)
Analytics	Recharts / Chart.js (Frontend Visualization)
🧩 Data Model
Database Schema
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE
);

CREATE TABLE scenario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  objective TEXT,
  rubric JSONB
);

CREATE TABLE scenario_doc (
  id BIGSERIAL PRIMARY KEY,
  scenario_id UUID REFERENCES scenario(id),
  content TEXT,
  embedding vector(1536)
);

CREATE TABLE session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_user(id),
  scenario_id UUID REFERENCES scenario(id),
  started_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE message (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES session(id),
  role TEXT CHECK (role IN ('user','assistant')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE feedback (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES session(id),
  summary TEXT,
  scores JSONB,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

🤖 AI & Prompt Design
Conversation Prompt
You are a professional communication coach playing the role of {scenario_title}.
Engage the user naturally, challenge them constructively, and simulate a real interaction.
Guide them to express clarity, empathy, and confidence through the dialogue.

Feedback Prompt
Evaluate the user’s conversation using a 0–5 scale:
- Clarity: Structure and precision.
- Empathy: Emotional awareness and validation.
- Assertiveness: Confidence and boundary-setting.
Return a short summary, numeric scores, and three actionable recommendations.

🧠 Retrieval-Augmented Generation (RAG) Workflow

User sends input from frontend.

Backend retrieves top-3 related context chunks from scenario_doc using vector similarity.

LangChain composes prompt with system + user + context.

GPT-4 generates an assistant reply.

Messages saved to database; conversation persists.

When user requests feedback, LangChain runs feedback prompt on full transcript.

💡 Example Scenarios
Scenario	Objective	Example Context
Job Interview	Improve clarity and confidence under pressure.	STAR method, professional tone.
Conflict Resolution	Build empathy and emotional intelligence.	Workplace disagreement with peer.
Public Speaking	Develop assertiveness and self-expression.	Presenting ideas to a small audience.
🧰 Installation & Setup
1. Clone Repository
git clone https://github.com/<your-handle>/ai-life-coach.git
cd ai-life-coach

2. Frontend Setup
cd web
npm install


Create .env.local:

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

3. Backend Setup
cd api
pip install -r requirements.txt


Create .env:

OPENAI_API_KEY=sk-xxxx
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_KEY=<your-supabase-service-key>


Run locally:

uvicorn app.main:app --reload --port 8000

4. Database Setup

Create a new project in Supabase
.

Run SQL schema above in Supabase SQL editor.

Enable the pgvector extension:

CREATE EXTENSION IF NOT EXISTS vector;

5. Run Frontend
cd web
npm run dev


Visit: http://localhost:3000

🧪 API Endpoints
Method	Endpoint	Description
GET	/scenarios	Retrieve available scenarios.
POST	/session	Create a new learning session.
POST	/chat	Send message → LLM response with RAG context.
POST	/feedback	Generate performance feedback for session.
GET	/metrics	Fetch average scores and user progress.
📊 Dashboard Metrics

Displays aggregated feedback data:

Average Scores by category (Clarity, Empathy, Assertiveness).

Progress Trend over time.

Scenario-specific insights.

🔒 Security & Compliance

Supabase Auth integration (optional) for secure session management.

Minimal personally identifiable data stored (only email).

AI prompts sanitized for harmful or inappropriate content.

Configurable rate limiting to prevent LLM abuse.

☁️ Deployment

Frontend:

Deploy via Vercel
 → connect to GitHub repo.

Set environment variables in Vercel dashboard.

Backend:

Deploy FastAPI via Supabase Edge Functions
 or Render.

Add OPENAI_API_KEY and DATABASE_URL in environment settings.

Database:

Managed via Supabase (with automatic SSL, backups, and telemetry).

🧭 Roadmap
Phase	Description
✅ MVP	Chat, RAG, Feedback, Dashboard
🔄 Phase 2	Voice Interaction (STT + TTS), Multi-modal interface
🧑‍🏫 Phase 3	Educator Portal, Scenario Authoring
📈 Phase 4	Adaptive Learning, xAPI Integration, LTI 1.3
🧩 Phase 5	AI Persona Customization & Learning Analytics API
🧑‍💻 Contributing

Pull requests and feature ideas are welcome.
Please fork the repository and open a PR with detailed notes on improvements or optimizations.

🧾 License

MIT License © 2025 Adewale Ogabi

💬 Contact

Author: Adewale Ogabi
Email: ogabi.adewale@gmail.com

LinkedIn: linkedin.com/in/adewaleogabi