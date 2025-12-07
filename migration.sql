-- ==========================================
-- SCRIPT DE REPARO TOTAL - AGENDA+
-- ==========================================

-- 1. ESTRUTURA: Adicionar colunas que faltam
-- Garante que o perfil tenha nome e a agenda tenha tipos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.schedule_config
ADD COLUMN IF NOT EXISTS morning_type text DEFAULT 'AGENDA',
ADD COLUMN IF NOT EXISTS afternoon_type text DEFAULT 'AGENDA';

-- 2. DADOS: Copiar Nomes do Auth.Users para Profiles
-- Corrige o problema do "Nome aparecendo como Email"
UPDATE public.profiles p
SET name = (
  SELECT raw_user_meta_data->>'name' 
  FROM auth.users u 
  WHERE u.id = p.id
)
WHERE p.name IS NULL OR p.name = '';

-- 3. DADOS: Criar Agenda para quem não tem (Backfill)
-- Corrige o problema "Agenda Travada" para usuários já criados
DO $$
DECLARE
  prof_rec RECORD;
  day_num INTEGER;
BEGIN
  -- Para cada perfil que NÃO tem agenda configurada
  FOR prof_rec IN 
    SELECT p.id FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.schedule_config s WHERE s.professional_id = p.id)
  LOOP
    -- Cria de Seg (1) a Sex (5)
    FOR day_num IN 1..5 LOOP
      INSERT INTO public.schedule_config (
        professional_id, weekday, interval_minutes,
        morning_start, morning_end, morning_type,
        afternoon_start, afternoon_end, afternoon_type
      ) VALUES (
        prof_rec.id, day_num, 30,
        '08:00', '12:00', 'AGENDA',
        '13:00', '17:00', 'AGENDA'
      );
    END LOOP;
  END LOOP;
END $$;

-- 4. AUTOMAÇÃO: Função para novos usuários
-- Garante que o problema não volte para novos cadastros
CREATE OR REPLACE FUNCTION public.handle_new_user_schedule() 
RETURNS TRIGGER AS $$
DECLARE
  day_num INTEGER;
BEGIN
  -- Copia nome do metadata
  UPDATE public.profiles SET name = new.raw_user_meta_data->>'name' WHERE id = new.id;
  
  -- Cria agenda padrão
  FOR day_num IN 1..5 LOOP
    INSERT INTO public.schedule_config (
      professional_id, weekday, interval_minutes,
      morning_start, morning_end, morning_type,
      afternoon_start, afternoon_end, afternoon_type
    ) VALUES (
      new.id, day_num, 30,
      '08:00', '12:00', 'AGENDA',
      '13:00', '17:00', 'AGENDA'
    );
  END LOOP;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. GATILHO: Ativar automação
DROP TRIGGER IF EXISTS on_auth_user_created_schedule ON auth.users;
CREATE TRIGGER on_auth_user_created_schedule
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_schedule();

-- FIM: Se rodou sem erro, tudo foi corrigido!
