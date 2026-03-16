-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMs
CREATE TYPE task_status AS ENUM ('not_started','in_progress','blocked','review','completed','deployed');
CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE note_type AS ENUM ('blocker','note','update');

-- categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status task_status NOT NULL DEFAULT 'not_started',
  priority task_priority NOT NULL DEFAULT 'medium',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  deployment_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- task_notes
CREATE TABLE task_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type note_type NOT NULL DEFAULT 'note',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_deployment_date ON tasks(deployment_date);
CREATE INDEX idx_task_notes_task_id ON task_notes(task_id);

-- RLS policies (permissive for now, no auth)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on task_notes" ON task_notes FOR ALL USING (true) WITH CHECK (true);

-- Seed data: default categories
INSERT INTO categories (name, color, sort_order) VALUES
  ('프론트엔드', '#3b82f6', 0),
  ('백엔드', '#10b981', 1),
  ('인프라', '#f59e0b', 2),
  ('디자인', '#8b5cf6', 3),
  ('기타', '#6b7280', 4);
