-- Add user_id to tasks
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Add user_id to categories
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all on task_notes" ON task_notes;

-- New user-scoped RLS policies for tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE USING (auth.uid() = user_id);

-- New user-scoped RLS policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE USING (auth.uid() = user_id);

-- task_notes: accessible if user owns the parent task
CREATE POLICY "Users can view own task notes"
  ON task_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_notes.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can insert own task notes"
  ON task_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_notes.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete own task notes"
  ON task_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_notes.task_id AND tasks.user_id = auth.uid()));
