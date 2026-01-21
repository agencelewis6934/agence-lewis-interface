-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'pm', 'dev', 'designer');
CREATE TYPE client_status AS ENUM ('prospect', 'active', 'paused', 'lost');
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

-- PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'dev',
  full_name TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  status client_status NOT NULL DEFAULT 'prospect',
  ltv NUMERIC(15, 2) DEFAULT 0,
  pipeline_stage TEXT,
  conversion_probability NUMERIC(5, 2) DEFAULT 50.0, -- For weighted forecasting (0-100)
  first_contact TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  actual_end_date DATE, -- Track actual completion vs planned
  budget NUMERIC(15, 2) DEFAULT 0,
  budget_used NUMERIC(15, 2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJECT MEMBERS (Many-to-Many for Team access)
CREATE TABLE public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- optional specific project role
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Denormalized
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  is_recurring BOOLEAN DEFAULT FALSE, -- Identify MRR vs one-time revenue
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  estimated_hours NUMERIC(5, 2),
  spent_hours NUMERIC(5, 2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  dependencies UUID[] DEFAULT '{}', -- Array of Task IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TIMESHEETS
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  hours NUMERIC(5, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_hours CHECK (hours > 0)
);

-- AUDIT LOG (Optional but recommended for tracking critical changes)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ADD CHECK CONSTRAINTS
ALTER TABLE public.clients ADD CONSTRAINT positive_ltv CHECK (ltv >= 0);
ALTER TABLE public.projects ADD CONSTRAINT positive_budget CHECK (budget >= 0);
ALTER TABLE public.projects ADD CONSTRAINT budget_used_within_limit CHECK (budget_used >= 0 AND budget_used <= budget);
ALTER TABLE public.projects ADD CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
ALTER TABLE public.invoices ADD CONSTRAINT positive_amount CHECK (amount >= 0);
ALTER TABLE public.invoices ADD CONSTRAINT valid_invoice_dates CHECK (invoice_date IS NULL OR due_date IS NULL OR invoice_date <= due_date);
ALTER TABLE public.tasks ADD CONSTRAINT positive_estimated_hours CHECK (estimated_hours IS NULL OR estimated_hours > 0);
ALTER TABLE public.tasks ADD CONSTRAINT positive_spent_hours CHECK (spent_hours >= 0);

-- PERFORMANCE INDEXES
-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Clients indexes
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_company_name ON public.clients(company_name);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Projects indexes
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_priority ON public.projects(priority);
CREATE INDEX idx_projects_start_date ON public.projects(start_date);
CREATE INDEX idx_projects_end_date ON public.projects(end_date);
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);

-- Project Members indexes
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);

-- Invoices indexes
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON public.invoices(invoice_date);

-- Tasks indexes
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);

-- Timesheets indexes
CREATE INDEX idx_timesheets_user_id ON public.timesheets(user_id);
CREATE INDEX idx_timesheets_project_id ON public.timesheets(project_id);
CREATE INDEX idx_timesheets_task_id ON public.timesheets(task_id);
CREATE INDEX idx_timesheets_date ON public.timesheets(date);
CREATE INDEX idx_timesheets_user_date ON public.timesheets(user_id, date);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is PM
CREATE OR REPLACE FUNCTION public.is_pm()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'pm'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is member of a project
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value FROM public.profiles WHERE id = auth.uid();
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for audit logging
CREATE OR REPLACE FUNCTION public.log_audit(p_table_name TEXT, p_record_id UUID, p_action TEXT, p_old_data JSONB, p_new_data JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (p_table_name, p_record_id, p_action, p_old_data, p_new_data, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- PROFILES
-- Viewable by authenticated users (needed for team lists/assigning)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admins can insert profiles (for manual user creation)
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT WITH CHECK (public.is_admin());

-- CLIENTS
-- Admins see all
CREATE POLICY "Admins see all clients" 
ON public.clients FOR ALL USING (public.is_admin());

-- PMs & Members see clients ONLY if they have a project with them
CREATE POLICY "Members see assigned clients"
ON public.clients FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.project_members pm ON p.id = pm.project_id
    WHERE p.client_id = public.clients.id AND pm.user_id = auth.uid()
  )
);

-- PMs and Admins can create clients
CREATE POLICY "PMs can create clients"
ON public.clients FOR INSERT WITH CHECK (public.is_pm() OR public.is_admin());

-- PMs and Admins can update clients
CREATE POLICY "PMs can update clients"
ON public.clients FOR UPDATE USING (public.is_pm() OR public.is_admin());

-- PROJECTS
-- Admins see all
CREATE POLICY "Admins see all projects" 
ON public.projects FOR ALL USING (public.is_admin());

-- Members (PMs, Devs, Designers) see projects they are assigned to
CREATE POLICY "Members see assigned projects" 
ON public.projects FOR SELECT USING (
  public.is_project_member(id)
);

-- PMs can insert projects (and typically should double check they trigger membership or are admin)
-- But standard PM flow: create project -> become member/owner.
-- Allow PMs to insert.
CREATE POLICY "PMs can insert projects"
ON public.projects FOR INSERT WITH CHECK (public.is_pm());

-- PMs can update projects they are member of
CREATE POLICY "PMs can update assigned projects"
ON public.projects FOR UPDATE USING (
  public.is_pm() AND public.is_project_member(id)
);

-- PMs can delete projects they are member of (soft delete recommended)
CREATE POLICY "PMs can delete assigned projects"
ON public.projects FOR DELETE USING (
  public.is_pm() AND public.is_project_member(id)
);


-- PROJECT MEMBERS
-- Admins manage all members
CREATE POLICY "Admins manage all project members"
ON public.project_members FOR ALL USING (public.is_admin());

-- PMs manage members for their projects
CREATE POLICY "PMs manage members for their projects"
ON public.project_members FOR ALL USING (
  public.is_pm() AND (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
  )
);

-- Members can view who is in their projects
CREATE POLICY "Members view project colleagues"
ON public.project_members FOR SELECT USING (
  public.is_project_member(project_id)
);


-- INVOICES (Strict Access)
-- Admins Only
CREATE POLICY "Admins manage invoices" 
ON public.invoices FOR ALL USING (public.is_admin());


-- TASKS
-- Admins manage all tasks
CREATE POLICY "Admins manage all tasks" 
ON public.tasks FOR ALL USING (public.is_admin());

-- PMs manage tasks in their projects
CREATE POLICY "PMs manage tasks in their projects"
ON public.tasks FOR ALL USING (
  public.is_pm() AND public.is_project_member(project_id)
);

-- Members view tasks in their projects
CREATE POLICY "Members view project tasks" 
ON public.tasks FOR SELECT USING (
  public.is_project_member(project_id)
);

-- Assignees can update their own tasks (status, etc)
CREATE POLICY "Assignees update own tasks" 
ON public.tasks FOR UPDATE USING (assignee_id = auth.uid());

-- Members can create tasks in their projects (optional feature)
CREATE POLICY "Members can create tasks in their projects"
ON public.tasks FOR INSERT WITH CHECK (
  public.is_project_member(project_id)
);


-- TIMESHEETS
-- Admins and PMs view timesheets for their projects
CREATE POLICY "Admins and PMs view project timesheets" 
ON public.timesheets FOR SELECT USING (
  public.is_admin() 
  OR (public.is_pm() AND public.is_project_member(project_id))
);

-- Users manage their own timesheets
CREATE POLICY "Users manage own timesheets" 
ON public.timesheets FOR ALL USING (user_id = auth.uid());


-- AUDIT LOGS
-- Only admins can view audit logs
CREATE POLICY "Admins view audit logs"
ON public.audit_logs FOR SELECT USING (public.is_admin());


-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'dev'); -- Default role 'dev'
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================
-- ANALYTICS VIEWS AND FUNCTIONS
-- ==============================================
-- For analytics views, RPC functions, and forecasting:
-- Apply the analytics.sql file AFTER this main schema
-- Location: supabase/analytics.sql
