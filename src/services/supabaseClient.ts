
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aWttb25qZm51bGh1aHVpb2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTk3MDIsImV4cCI6MjA4MDYzNTcwMn0.zdq9BLquLoLI36EAWB1XC5al9iBRND-5pK7T3SR6ouc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
