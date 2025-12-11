-- =====================================================
-- CLEANUP SIMPLES - DELETA TUDO DO SCHEMA PUBLIC
-- =====================================================
-- Este script deleta TUDO do schema public de uma vez
-- Mais simples e funciona sempre!
-- =====================================================

-- Drop tudo de uma vez com CASCADE
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop todas as tabelas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop todas as sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;

    -- Drop todas as views
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;

    -- Drop todas as functions
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;

-- Confirmar limpeza
SELECT 'Database cleanup completed! All objects in public schema dropped.' AS status;
