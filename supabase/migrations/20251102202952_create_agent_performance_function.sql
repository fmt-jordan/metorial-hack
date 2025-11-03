/*
  # Create Agent Performance Function

  ## Overview
  Creates a database function to efficiently retrieve agent performance metrics
  including call statistics, duration, and costs.

  ## New Functions
  
  ### `get_agent_performance()`
  Returns aggregated performance metrics for all active agents:
  - Total calls per agent
  - Completed calls per agent
  - Average call duration
  - Total cost per agent
  - Last call timestamp
  
  ## Security
  - Function is accessible to authenticated users
  - Uses existing RLS policies on underlying tables
*/

-- Create function to get agent performance metrics
CREATE OR REPLACE FUNCTION get_agent_performance()
RETURNS TABLE (
  id uuid,
  assistant_name text,
  assistant_id text,
  profile_image_url text,
  total_calls bigint,
  completed_calls bigint,
  avg_duration numeric,
  total_cost numeric,
  last_call_at timestamptz
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    a.id,
    a.name as assistant_name,
    a.assistant_id,
    a.profile_image_url,
    COUNT(DISTINCT we.call_id) as total_calls,
    COUNT(DISTINCT CASE WHEN we.call_status = 'completed' THEN we.call_id END) as completed_calls,
    COALESCE(AVG(we.call_duration), 0) as avg_duration,
    COALESCE(SUM(we.cost), 0) as total_cost,
    MAX(we.created_at) as last_call_at
  FROM assistants a
  LEFT JOIN webhook_events we ON we.assistant_id = a.id::text
  WHERE a.is_active = true
  GROUP BY a.id, a.name, a.assistant_id, a.profile_image_url
  ORDER BY total_calls DESC;
$$;
