-- Bill pressure campaigns: track user stance + action on each bill
CREATE TABLE bill_pressures (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id      text NOT NULL,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE,
  session_id   text,
  stance       text NOT NULL CHECK (stance IN ('support', 'oppose')),
  action_type  text NOT NULL CHECK (action_type IN ('stance', 'email', 'share', 'campaign')),
  electorate   text,
  created_at   timestamptz DEFAULT now() NOT NULL
);

-- One stance per authenticated user per bill
CREATE UNIQUE INDEX bill_pressures_user_bill
  ON bill_pressures (bill_id, user_id)
  WHERE user_id IS NOT NULL;

-- One stance per anonymous session per bill
CREATE UNIQUE INDEX bill_pressures_session_bill
  ON bill_pressures (bill_id, session_id)
  WHERE session_id IS NOT NULL;

-- Efficient aggregation queries
CREATE INDEX bill_pressures_bill_id ON bill_pressures (bill_id);
CREATE INDEX bill_pressures_created_at ON bill_pressures (created_at);
CREATE INDEX bill_pressures_electorate ON bill_pressures (bill_id, electorate) WHERE electorate IS NOT NULL;

-- RLS
ALTER TABLE bill_pressures ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregate data (used for public pressure counts)
CREATE POLICY "public read bill_pressures"
  ON bill_pressures FOR SELECT
  USING (true);

-- Authenticated users can insert their own records
CREATE POLICY "auth insert bill_pressures"
  ON bill_pressures FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Authenticated users can update their own stance
CREATE POLICY "auth update bill_pressures"
  ON bill_pressures FOR UPDATE
  USING (auth.uid() = user_id);
