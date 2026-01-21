-- Migration: Add 'auto_closed' status to appointment_status enum
-- Run this in the Supabase SQL Editor

ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'auto_closed';

-- Verify the update
SELECT enum_range(NULL::appointment_status);
