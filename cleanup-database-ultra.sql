-- =====================================================
-- CLEANUP ULTRA - DELETA TUDO SEM ERROS
-- =====================================================
-- Script mais robusto que lida com funções duplicadas
-- =====================================================

-- Primeiro: Drop todas as funções com suas assinaturas completas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                r.schema_name, r.function_name, r.args);
        EXCEPTION WHEN OTHERS THEN
            -- Ignora erros e continua
            NULL;
        END;
    END LOOP;
END $$;

-- Segundo: Drop todos os triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE',
                r.trigger_name, r.event_object_table);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Terceiro: Drop todas as views
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.table_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Quarto: Drop todas as tabelas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Quinto: Drop todas as sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', r.sequence_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Sexto: Drop tipos customizados
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT typname
        FROM pg_type
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'  -- enums
    ) LOOP
        BEGIN
            EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Confirmar limpeza
SELECT 'Database cleanup ULTRA completed! Everything dropped.' AS status;
