-- ============================================
-- HOUSY - Sistema Punti per Turni
-- ============================================
-- Esegui questo script dopo schema.sql
-- ============================================

-- 1. Aggiungi colonna points alla tabella chores
ALTER TABLE public.chores
ADD COLUMN IF NOT EXISTS points integer DEFAULT 1 CHECK (points >= 1 AND points <= 10);

-- 2. Aggiungi colonna is_active alla tabella chores (se non esiste)
ALTER TABLE public.chores
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 3. Crea tabella chore_completions per tracciare i completamenti
CREATE TABLE IF NOT EXISTS public.chore_completions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  chore_id uuid REFERENCES public.chores(id) ON DELETE CASCADE NOT NULL,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  points_earned integer NOT NULL CHECK (points_earned >= 0),
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Abilita RLS sulla nuova tabella
ALTER TABLE public.chore_completions ENABLE ROW LEVEL SECURITY;

-- 5. Policy per chore_completions
CREATE POLICY "Members can view completions"
  ON public.chore_completions FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add completions"
  ON public.chore_completions FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- 6. Indici per performance
CREATE INDEX IF NOT EXISTS idx_chore_completions_household
  ON public.chore_completions(household_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_user
  ON public.chore_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date
  ON public.chore_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_chore_completions_chore
  ON public.chore_completions(chore_id);

-- 7. Funzione helper per ottenere i punti totali di un utente in un periodo
CREATE OR REPLACE FUNCTION public.get_user_chore_points(
  p_user_id uuid,
  p_household_id uuid,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  total_points integer;
BEGIN
  SELECT COALESCE(SUM(points_earned), 0)
  INTO total_points
  FROM public.chore_completions
  WHERE user_id = p_user_id
    AND household_id = p_household_id
    AND (p_start_date IS NULL OR completed_at >= p_start_date)
    AND (p_end_date IS NULL OR completed_at <= p_end_date);

  RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 8. Funzione per completare un turno (aggiorna chore e crea completion)
CREATE OR REPLACE FUNCTION public.complete_chore(p_chore_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_chore RECORD;
  v_next_assignee uuid;
  v_current_index integer;
  v_completion_id uuid;
BEGIN
  -- Ottieni il turno
  SELECT * INTO v_chore FROM public.chores WHERE id = p_chore_id;

  IF v_chore IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Turno non trovato');
  END IF;

  -- Verifica che l'utente sia l'assegnatario corrente
  IF v_chore.current_assignee != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non sei l''assegnatario di questo turno');
  END IF;

  -- Crea il record di completamento
  INSERT INTO public.chore_completions (chore_id, household_id, user_id, points_earned)
  VALUES (p_chore_id, v_chore.household_id, auth.uid(), v_chore.points)
  RETURNING id INTO v_completion_id;

  -- Calcola il prossimo assegnatario (rotazione)
  IF array_length(v_chore.rotation_order, 1) > 0 THEN
    -- Trova l'indice corrente nella rotazione
    SELECT array_position(v_chore.rotation_order, v_chore.current_assignee) INTO v_current_index;

    IF v_current_index IS NULL OR v_current_index >= array_length(v_chore.rotation_order, 1) THEN
      v_next_assignee := v_chore.rotation_order[1];
    ELSE
      v_next_assignee := v_chore.rotation_order[v_current_index + 1];
    END IF;
  ELSE
    v_next_assignee := v_chore.current_assignee;
  END IF;

  -- Aggiorna il turno
  UPDATE public.chores
  SET
    last_completed = NOW(),
    current_assignee = v_next_assignee,
    next_due = CASE v_chore.frequency
      WHEN 'daily' THEN NOW() + INTERVAL '1 day'
      WHEN 'weekly' THEN NOW() + INTERVAL '7 days'
      WHEN 'monthly' THEN NOW() + INTERVAL '1 month'
      ELSE NOW() + INTERVAL '7 days'
    END
  WHERE id = p_chore_id;

  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'points_earned', v_chore.points,
    'next_assignee', v_next_assignee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
