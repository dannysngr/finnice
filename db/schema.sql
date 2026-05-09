-- ─────────────────────────────────────────────────────────────────
-- ФинНайс — схема базы данных
-- PostgreSQL 14+ / Supabase / Neon
-- ─────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- для быстрого поиска по телефону

-- ── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone             VARCHAR(15) NOT NULL UNIQUE,          -- +7XXXXXXXXXX
  telegram_chat_id  BIGINT      UNIQUE,                   -- ctx.from.id из /start
  full_name         VARCHAR(120),
  verified          BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone         ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id   ON users (telegram_chat_id);

-- ── Contracts (рассрочки) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_number VARCHAR(20) NOT NULL UNIQUE,             -- "2024-05"
  product_name    VARCHAR(255) NOT NULL,
  total_amount    NUMERIC(12,2) NOT NULL,
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','overdue','cancelled')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts (user_id);

-- ── Payments (график платежей) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  due_date    DATE        NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  paid_at     TIMESTAMPTZ,                                 -- NULL = не оплачен
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','paid','overdue'))
);

CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments (contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date    ON payments (due_date);

-- ── OTP attempts log (аудит, опционально) ─────────────────────────
CREATE TABLE IF NOT EXISTS otp_log (
  id          BIGSERIAL   PRIMARY KEY,
  phone       VARCHAR(15) NOT NULL,
  success     BOOLEAN     NOT NULL,
  ip          INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Автоочистка старых записей через 30 дней (требует pg_cron или внешний cron)
-- SELECT cron.schedule('0 3 * * *', $$DELETE FROM otp_log WHERE created_at < NOW() - INTERVAL '30 days'$$);
