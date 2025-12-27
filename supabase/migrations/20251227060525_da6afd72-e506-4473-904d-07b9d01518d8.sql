-- Update app_role enum to include new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'field_worker';