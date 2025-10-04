-- Update RLS policies for existing announcements table

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON announcements;
DROP POLICY IF EXISTS "Allow read access for everyone" ON announcements;
DROP POLICY IF EXISTS "Allow all operations for now" ON announcements;

-- Create policy for read access (public can read)
CREATE POLICY "Allow read access for everyone" ON announcements
  FOR SELECT USING (true);

-- Create policy for insert/update/delete (allow all for now - you can restrict this later)
CREATE POLICY "Allow all operations for now" ON announcements
  FOR ALL USING (true);