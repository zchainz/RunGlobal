/*
  # RaceMe Initial Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `full_name` (text)
      - `picture` (text)
      - `avg_speed` (numeric) - Average running speed
      - `avg_distance` (numeric) - Average running distance
      - `avg_duration` (numeric) - Average run duration
      - `rank` (integer) - User ranking
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `health_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `blood_type` (text)
      - `biological_sex` (text)
      - `total_flights` (integer)
      - `total_walk_run_distance` (numeric)
      - `total_steps` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `races`
      - `id` (uuid, primary key)
      - `challenger_id` (uuid, references profiles)
      - `opponent_id` (uuid, references profiles)
      - `challenger_data` (jsonb) - Contains speed, distance, duration, route info
      - `opponent_data` (jsonb) - Contains speed, distance, duration, route info
      - `status` (text) - pending, active, completed
      - `winner_id` (uuid, references profiles, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own profile and other users' public data
      - Update their own profile
      - Read their own health data
      - Create and view their own races
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  picture text,
  avg_speed numeric DEFAULT 0,
  avg_distance numeric DEFAULT 0,
  avg_duration numeric DEFAULT 0,
  rank integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create health_data table
CREATE TABLE IF NOT EXISTS health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blood_type text,
  biological_sex text,
  total_flights integer DEFAULT 0,
  total_walk_run_distance numeric DEFAULT 0,
  total_steps integer DEFAULT 0,
  daily_steps jsonb DEFAULT '[]'::jsonb,
  daily_distance jsonb DEFAULT '[]'::jsonb,
  daily_flights jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health data"
  ON health_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data"
  ON health_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health data"
  ON health_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opponent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  challenger_data jsonb DEFAULT '{}'::jsonb,
  opponent_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  winner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own races"
  ON races FOR SELECT
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create races"
  ON races FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update races they participate in"
  ON races FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_rank ON profiles(rank);
CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_races_challenger_id ON races(challenger_id);
CREATE INDEX IF NOT EXISTS idx_races_opponent_id ON races(opponent_id);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_data_updated_at BEFORE UPDATE ON health_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();