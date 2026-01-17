-- Migration: Add is_shared column to expenses table
-- This allows users to mark expenses as personal (private) or shared with household

-- Add the column with default value true (shared)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN expenses.is_shared IS 'true = visible to all household members, false = visible only to owner';

-- Update RLS policy to respect is_shared
-- First, drop the existing select policy
DROP POLICY IF EXISTS "Users can view expenses of their household" ON expenses;

-- Create new policy that respects is_shared
CREATE POLICY "Users can view household shared expenses and own expenses" ON expenses
  FOR SELECT
  USING (
    household_id IN (SELECT get_user_household_ids())
    AND (is_shared = true OR user_id = auth.uid())
  );

-- Keep existing insert/update/delete policies as they already check household membership
