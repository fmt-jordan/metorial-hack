/*
  # Fix Agent Performance Function - Assistant ID Matching

  ## Overview
  Fixes the `get_agent_performance()` function to correctly match webhook events
  with assistants by comparing the Vapi assistant IDs instead of internal database IDs.

  ## Changes
  - Updates JOIN condition to match `webhook_events.assistant_id` with `assistants.assistant_id`
  - Previously was incorrectly matching with `assistants.id::text`

  ## Impact
  This fix ensures that call metrics are properly attributed to the correct agents
  based on their Vapi assistant IDs.
*/

-- Drop and recreate the function with corrected JOIN condition
DROP FUNCTION IF EXISTS get_agent_performance();

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
  last_call_at timestamptz,
  total_quotes bigint,
  quotes_won bigint,
  quotes_lost bigint,
  quotes_pending bigint,
  win_rate numeric,
  total_quote_value numeric
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    a.id,
    a.name as assistant_name,
    a.assistant_id,
    a.profile_image_url,
    COUNT(DISTINCT we.call_id) FILTER (WHERE we.call_id IS NOT NULL) as total_calls,
    COUNT(DISTINCT CASE WHEN we.call_status = 'completed' THEN we.call_id END) as completed_calls,
    COALESCE(AVG(we.call_duration) FILTER (WHERE we.call_duration IS NOT NULL), 0) as avg_duration,
    COALESCE(SUM(we.cost) FILTER (WHERE we.cost IS NOT NULL), 0) as total_cost,
    MAX(we.created_at) as last_call_at,
    COUNT(DISTINCT CASE WHEN EXISTS (
      SELECT 1 FROM quote_line_items qli WHERE qli.webhook_event_id = we.id
    ) THEN we.id END) as total_quotes,
    COUNT(DISTINCT CASE WHEN we.quote_status = 'won' THEN we.id END) as quotes_won,
    COUNT(DISTINCT CASE WHEN we.quote_status = 'lost' THEN we.id END) as quotes_lost,
    COUNT(DISTINCT CASE WHEN we.quote_status = 'pending' THEN we.id END) as quotes_pending,
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN we.quote_status IN ('won', 'lost') THEN we.id END) > 0
      THEN ROUND(
        (COUNT(DISTINCT CASE WHEN we.quote_status = 'won' THEN we.id END)::numeric / 
         COUNT(DISTINCT CASE WHEN we.quote_status IN ('won', 'lost') THEN we.id END)::numeric) * 100,
        1
      )
      ELSE 0
    END as win_rate,
    COALESCE(
      (SELECT SUM(qli.item_price * qli.qty)
       FROM quote_line_items qli
       JOIN webhook_events we2 ON qli.webhook_event_id = we2.id
       WHERE we2.assistant_id = a.assistant_id AND we2.quote_status = 'won'),
      0
    ) as total_quote_value
  FROM assistants a
  LEFT JOIN webhook_events we ON we.assistant_id = a.assistant_id
  WHERE a.is_active = true
  GROUP BY a.id, a.name, a.assistant_id, a.profile_image_url
  ORDER BY total_calls DESC;
$$;
