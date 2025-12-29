/*
  # Create Chat Matching System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `created_at` (timestamp)
      - `last_active` (timestamp)
    
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `room_code` (text, unique) - for invite feature
      - `user1_id` (uuid, references user_profiles)
      - `user2_id` (uuid, references user_profiles, nullable)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
    
    - `waiting_queue`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Policies for chat room access
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  user1_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their chat rooms"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their chat rooms"
  ON chat_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Waiting Queue Table
CREATE TABLE IF NOT EXISTS waiting_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view waiting queue"
  ON waiting_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add themselves to queue"
  ON waiting_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from queue"
  ON waiting_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_rooms WHERE expires_at < now() OR is_active = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;