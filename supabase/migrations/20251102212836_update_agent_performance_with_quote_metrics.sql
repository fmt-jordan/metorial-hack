/*
  # Update Agent Performance Function with Quote Metrics

  ## Changes
  Updates the `get_agent_performance()` function to include quote-related metrics:
  - Total quotes generated
  - Quotes won
  - Quotes lost
  - Quotes pending
  - Win rate percentage
  - Total quote value (sum of all line items for won quotes)
  
  ## Performance Metrics
  - `total_quotes`: Count of events with quote line items
  - `quotes_won`: Count of quotes with 'won' status
  - `quotes_lost`: Count of quotes with 'lost' status
  - `quotes_pending`: Count of quotes with 'pending' status
  - `win_rate`: Percentage of won quotes (won / (won + lost))
  - `total_quote_value`: Sum of all line items for won quotes
*/

-- Drop existing function first
DROP FUNCTION IF EXISTS get_agent_performance();

-- Recreate with new columns
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
    COUNT(DISTINCT we.call_id) as total_calls,
    COUNT(DISTINCT CASE WHEN we.call_status = 'completed' THEN we.call_id END) as completed_calls,
    COALESCE(AVG(we.call_duration), 0) as avg_duration,
    COALESCE(SUM(we.cost), 0) as total_cost,
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
       WHERE we2.assistant_id = a.id::text AND we2.quote_status = 'won'),
      0
    ) as total_quote_value
  FROM assistants a
  LEFT JOIN webhook_events we ON we.assistant_id = a.id::text
  WHERE a.is_active = true
  GROUP BY a.id, a.name, a.assistant_id, a.profile_image_url
  ORDER BY total_calls DESC;
$$;