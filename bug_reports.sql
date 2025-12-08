-- Bug Reports Tablosu
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  bug_type TEXT NOT NULL CHECK (bug_type IN ('general', 'ui', 'performance', 'security', 'feature')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  steps TEXT,
  expected_result TEXT,
  actual_result TEXT,
  environment TEXT,
  browser TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Önce mevcut policy'leri kontrol et ve sil
DROP POLICY IF EXISTS "All authenticated users can view bug reports" ON bug_reports;
DROP POLICY IF EXISTS "All authenticated users can insert bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can delete bug reports" ON bug_reports;

-- RLS Policies
CREATE POLICY "All authenticated users can view bug reports" ON bug_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated users can insert bug reports" ON bug_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update bug reports" ON bug_reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@zentaira.com', 'developer@zentaira.com', 'support@zentaira.com', 'nazimpala5170@gmail.com')
  )
);
CREATE POLICY "Admins can delete bug reports" ON bug_reports FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@zentaira.com', 'developer@zentaira.com', 'support@zentaira.com', 'nazimpala5170@gmail.com')
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION handle_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_bug_reports_updated_at ON bug_reports;
CREATE TRIGGER handle_bug_reports_updated_at BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION handle_bug_reports_updated_at();
