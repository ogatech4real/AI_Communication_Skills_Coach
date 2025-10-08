/*
  # AI Life Coach - Complete Database Schema

  ## Overview
  Creates the complete database structure for an AI-powered communication training platform
  that enables interactive role-play sessions with real-time feedback and progress tracking.

  ## New Tables

  ### 1. app_user
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email for authentication
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. scenario
  - `id` (uuid, primary key) - Unique scenario identifier
  - `title` (text) - Display title of the practice scenario
  - `description` (text) - Detailed description of what user will practice
  - `objective` (text) - Learning objectives for the scenario
  - `rubric` (jsonb) - JSON structure defining evaluation criteria
  - `ai_persona` (text) - Description of AI character role
  - `icon` (text) - Icon identifier for UI display
  - `created_at` (timestamptz) - Scenario creation timestamp

  ### 3. scenario_doc
  - `id` (bigserial, primary key) - Auto-incrementing identifier
  - `scenario_id` (uuid, foreign key) - References parent scenario
  - `content` (text) - Text content for RAG context
  - `embedding` (vector(1536)) - OpenAI embedding for similarity search
  - `metadata` (jsonb) - Additional metadata about the document

  ### 4. session
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, foreign key) - References app_user
  - `scenario_id` (uuid, foreign key) - References scenario
  - `started_at` (timestamptz) - Session start time
  - `ended_at` (timestamptz, nullable) - Session end time
  - `status` (text) - Current session status (active, completed, abandoned)

  ### 5. message
  - `id` (bigserial, primary key) - Auto-incrementing identifier
  - `session_id` (uuid, foreign key) - References session
  - `role` (text) - Message sender role (user or assistant)
  - `content` (text) - Message content
  - `created_at` (timestamptz) - Message timestamp

  ### 6. feedback
  - `id` (bigserial, primary key) - Auto-incrementing identifier
  - `session_id` (uuid, foreign key) - References session
  - `summary` (text) - AI-generated feedback summary
  - `scores` (jsonb) - Structured scores (clarity, empathy, assertiveness)
  - `recommendations` (text) - Actionable improvement suggestions
  - `created_at` (timestamptz) - Feedback generation timestamp

  ## Security
  - Enables Row Level Security (RLS) on all tables
  - Creates policies ensuring users can only access their own data
  - Allows public read access to scenario catalog
  - Authenticated users can create sessions and messages
  - Users can only view their own sessions, messages, and feedback

  ## Indexes
  - Creates indexes on foreign keys for optimal query performance
  - Adds vector similarity search index for RAG operations

  ## Extensions
  - Enables pgvector extension for embedding storage and similarity search
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Create app_user table
CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;

-- Create scenario table
CREATE TABLE IF NOT EXISTS scenario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  objective text NOT NULL,
  rubric jsonb DEFAULT '{}',
  ai_persona text NOT NULL,
  icon text DEFAULT 'message-circle',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenario ENABLE ROW LEVEL SECURITY;

-- Create scenario_doc table for RAG
CREATE TABLE IF NOT EXISTS scenario_doc (
  id bigserial PRIMARY KEY,
  scenario_id uuid REFERENCES scenario(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE scenario_doc ENABLE ROW LEVEL SECURITY;

-- Create session table
CREATE TABLE IF NOT EXISTS session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_user(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES scenario(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned'))
);

ALTER TABLE session ENABLE ROW LEVEL SECURITY;

-- Create message table
CREATE TABLE IF NOT EXISTS message (
  id bigserial PRIMARY KEY,
  session_id uuid REFERENCES session(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message ENABLE ROW LEVEL SECURITY;

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id bigserial PRIMARY KEY,
  session_id uuid REFERENCES session(id) ON DELETE CASCADE,
  summary text NOT NULL,
  scores jsonb NOT NULL,
  recommendations text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_scenario_id ON session(scenario_id);
CREATE INDEX IF NOT EXISTS idx_message_session_id ON message(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_scenario_doc_scenario_id ON scenario_doc(scenario_id);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_scenario_doc_embedding ON scenario_doc 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS Policies for app_user
CREATE POLICY "Users can view own profile"
  ON app_user FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON app_user FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for scenario (public read)
CREATE POLICY "Anyone can view scenarios"
  ON scenario FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for scenario_doc (public read for RAG)
CREATE POLICY "Anyone can view scenario docs"
  ON scenario_doc FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for session
CREATE POLICY "Users can view own sessions"
  ON session FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON session FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON session FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for message
CREATE POLICY "Users can view messages from own sessions"
  ON message FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session
      WHERE session.id = message.session_id
      AND session.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON message FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session
      WHERE session.id = message.session_id
      AND session.user_id = auth.uid()
    )
  );

-- RLS Policies for feedback
CREATE POLICY "Users can view feedback for own sessions"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session
      WHERE session.id = feedback.session_id
      AND session.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create feedback for own sessions"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session
      WHERE session.id = feedback.session_id
      AND session.user_id = auth.uid()
    )
  );