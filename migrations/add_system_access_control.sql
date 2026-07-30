-- Controle global de bloqueio do sistema.
-- Antes de executar, substitua owner@example.com pelo e-mail do administrador.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

INSERT INTO public.app_settings (key, value)
VALUES ('system_blocked', '{"isBlocked": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES ('payment_notice_visible', '{"isVisible": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read app settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only owner admin can insert app settings" ON public.app_settings;
CREATE POLICY "Only owner admin can insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'owner@example.com');

DROP POLICY IF EXISTS "Only owner admin can update app settings" ON public.app_settings;
CREATE POLICY "Only owner admin can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'owner@example.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'owner@example.com');

CREATE OR REPLACE FUNCTION public.set_app_settings_updated_by()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_app_settings_updated_by ON public.app_settings;
CREATE TRIGGER set_app_settings_updated_by
BEFORE INSERT OR UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_app_settings_updated_by();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
