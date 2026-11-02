-- ============================================================================
-- URBAN BIKE POOLING PLATFORM (TwoShare)
-- PostgreSQL 16 + PostGIS Production Database Schema DDL
-- ============================================================================
-- Architecture: Fully Normalized (3NF), Spatial-Indexed, ACID Compliant
-- Extensions Required: uuid-ossp, postgis, btree_gist
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 1. CUSTOM DOMAINS AND ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_gender AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('COMMUTER', 'RIDER', 'ADMIN', 'SUPPORT_AGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kyc_verification_status AS ENUM ('UNVERIFIED', 'SUBMITTED', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ride_status AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('REQUESTED', 'CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('INITIATED', 'AUTHORIZED', 'CAPTURED', 'TRANSFERRED', 'REFUNDED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway_type AS ENUM ('RAZORPAY', 'COMMUTE_WALLET', 'UPI_DIRECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE wallet_transaction_type AS ENUM ('TOPUP', 'RIDE_PAYMENT_ESCROW', 'RIDE_PAYMENT_SETTLED', 'RIDER_PAYOUT', 'REFUND', 'PENALTY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('IN_APP', 'PUSH', 'SMS', 'WHATSAPP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('RIDE_REQUESTED', 'RIDE_CONFIRMED', 'RIDER_ARRIVED', 'RIDE_STARTED', 'RIDE_COMPLETED', 'PAYMENT_SUCCESS', 'SOS_ALERT', 'GENERAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    gender user_gender NOT NULL,
    avatar_url TEXT,
    bio VARCHAR(255),
    role user_role DEFAULT 'COMMUTER' NOT NULL,
    kyc_status kyc_verification_status DEFAULT 'UNVERIFIED' NOT NULL,
    rating_avg NUMERIC(3, 2) DEFAULT 5.00 NOT NULL CHECK (rating_avg >= 1.00 AND rating_avg <= 5.00),
    rating_count INT DEFAULT 0 NOT NULL CHECK (rating_count >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_phone_format CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- ----------------------------------------------------------------------------
-- 2.2 RIDER PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driving_license_no VARCHAR(50) UNIQUE NOT NULL,
    license_expiry_date DATE NOT NULL,
    license_doc_front_url TEXT NOT NULL,
    license_doc_back_url TEXT,
    verification_status kyc_verification_status DEFAULT 'SUBMITTED' NOT NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    total_trips_offered INT DEFAULT 0 NOT NULL CHECK (total_trips_offered >= 0),
    total_trips_completed INT DEFAULT 0 NOT NULL CHECK (total_trips_completed >= 0),
    safety_rating_avg NUMERIC(3, 2) DEFAULT 5.00 NOT NULL CHECK (safety_rating_avg >= 1.00 AND safety_rating_avg <= 5.00),
    is_eligible_for_pooling BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_license_expiry CHECK (license_expiry_date > CURRENT_DATE)
);

-- ----------------------------------------------------------------------------
-- 2.3 VEHICLES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_profile_id UUID NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    engine_cc INT NOT NULL CHECK (engine_cc BETWEEN 50 AND 1200),
    color VARCHAR(30) NOT NULL,
    rc_number VARCHAR(50) UNIQUE NOT NULL,
    rc_document_url TEXT NOT NULL,
    insurance_policy_no VARCHAR(60) NOT NULL,
    insurance_expiry_date DATE NOT NULL,
    insurance_doc_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_insurance_validity CHECK (insurance_expiry_date > CURRENT_DATE)
);

-- ----------------------------------------------------------------------------
-- 2.4 EMERGENCY CONTACTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(40) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_emergency_phone CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- ----------------------------------------------------------------------------
-- 2.5 WALLETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    current_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (current_balance >= 0.00),
    locked_escrow_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (locked_escrow_balance >= 0.00),
    is_frozen BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2.6 WALLET TRANSACTIONS (LEDGER) TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    transaction_type wallet_transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount != 0.00),
    balance_after NUMERIC(10, 2) NOT NULL CHECK (balance_after >= 0.00),
    reference_id UUID,
    reference_table VARCHAR(50),
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2.7 RIDES (RIDE OFFERS) TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_profile_id UUID NOT NULL REFERENCES rider_profiles(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    origin_point GEOMETRY(Point, 4326) NOT NULL,
    destination_point GEOMETRY(Point, 4326) NOT NULL,
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    route_polyline GEOMETRY(LineString, 4326) NOT NULL,
    scheduled_departure TIMESTAMPTZ NOT NULL,
    buffer_minutes INT DEFAULT 10 NOT NULL CHECK (buffer_minutes BETWEEN 0 AND 30),
    available_seats INT DEFAULT 1 NOT NULL CHECK (available_seats IN (0, 1)),
    helmet_provided BOOLEAN DEFAULT TRUE NOT NULL,
    is_women_only BOOLEAN DEFAULT FALSE NOT NULL,
    per_km_cost_share NUMERIC(6, 2) NOT NULL CHECK (per_km_cost_share > 0),
    estimated_distance_meters INT NOT NULL CHECK (estimated_distance_meters > 0),
    estimated_duration_seconds INT NOT NULL CHECK (estimated_duration_seconds > 0),
    status ride_status DEFAULT 'SCHEDULED' NOT NULL,
    recurring_cron VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2.8 BOOKINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE RESTRICT,
    passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pickup_point GEOMETRY(Point, 4326) NOT NULL,
    dropoff_point GEOMETRY(Point, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_otp VARCHAR(4) NOT NULL CHECK (pickup_otp ~ '^\d{4}$'),
    status booking_status DEFAULT 'REQUESTED' NOT NULL,
    fare_fuel_share NUMERIC(8, 2) NOT NULL CHECK (fare_fuel_share >= 0),
    platform_fee NUMERIC(8, 2) NOT NULL CHECK (platform_fee >= 0),
    insurance_fee NUMERIC(8, 2) NOT NULL CHECK (insurance_fee >= 0),
    total_fare NUMERIC(8, 2) NOT NULL CHECK (total_fare = fare_fuel_share + platform_fee + insurance_fee),
    detour_distance_meters INT DEFAULT 0 NOT NULL CHECK (detour_distance_meters >= 0),
    detour_duration_seconds INT DEFAULT 0 NOT NULL CHECK (detour_duration_seconds >= 0),
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2.9 PAYMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    gateway_order_id VARCHAR(100) UNIQUE NOT NULL,
    gateway_payment_id VARCHAR(100) UNIQUE,
    gateway_transfer_id VARCHAR(100) UNIQUE,
    payment_method payment_gateway_type DEFAULT 'RAZORPAY' NOT NULL,
    total_amount NUMERIC(8, 2) NOT NULL CHECK (total_amount > 0),
    platform_cut NUMERIC(8, 2) NOT NULL CHECK (platform_cut >= 0),
    rider_payout NUMERIC(8, 2) NOT NULL CHECK (rider_payout >= 0),
    insurance_premium NUMERIC(8, 2) DEFAULT 0.00 NOT NULL CHECK (insurance_premium >= 0),
    status payment_status DEFAULT 'INITIATED' NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    captured_at TIMESTAMPTZ,
    transferred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_payment_breakdown CHECK (total_amount = platform_cut + rider_payout + insurance_premium)
);

-- ----------------------------------------------------------------------------
-- 2.10 REVIEWS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    safety_tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    comment VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_booking_reviewer UNIQUE(booking_id, reviewer_id),
    CONSTRAINT check_reviewer_distinct CHECK (reviewer_id <> reviewee_id)
);

-- ----------------------------------------------------------------------------
-- 2.11 NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    channel notification_channel DEFAULT 'IN_APP' NOT NULL,
    notification_type notification_type DEFAULT 'GENERAL' NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2.12 AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(60) NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_state JSONB,
    new_state JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 3. INDEXES (B-Tree, GiST Spatial, Composite, and Partial)
-- ============================================================================

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_kyc ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Rider Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_rider_profiles_user ON rider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_rider_profiles_dl ON rider_profiles(driving_license_no);
CREATE INDEX IF NOT EXISTS idx_rider_profiles_pooling_ready ON rider_profiles(is_eligible_for_pooling) WHERE is_eligible_for_pooling = TRUE;

-- Vehicles Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_profile ON vehicles(rider_profile_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_verified_active ON vehicles(is_verified, is_active);

-- Emergency Contacts Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(user_id, is_primary) WHERE is_primary = TRUE;

-- Wallets & Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_wallet_date ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_ref ON wallet_transactions(reference_id, reference_table);

-- Rides (Spatial & Query Acceleration) Indexes
CREATE INDEX IF NOT EXISTS idx_rides_route_spatial ON rides USING GIST(route_polyline);
CREATE INDEX IF NOT EXISTS idx_rides_origin_spatial ON rides USING GIST(origin_point);
CREATE INDEX IF NOT EXISTS idx_rides_dest_spatial ON rides USING GIST(destination_point);
CREATE INDEX IF NOT EXISTS idx_rides_active_sched ON rides(scheduled_departure, status) WHERE status = 'SCHEDULED';
CREATE INDEX IF NOT EXISTS idx_rides_rider_status ON rides(rider_profile_id, status);

-- Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_ride ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_spatial ON bookings USING GIST(pickup_point);
CREATE INDEX IF NOT EXISTS idx_bookings_dropoff_spatial ON bookings USING GIST(dropoff_point);
CREATE INDEX IF NOT EXISTS idx_bookings_active_pass ON bookings(passenger_id, status) WHERE status IN ('REQUESTED', 'CONFIRMED', 'STARTED');

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_recipient ON payments(recipient_id);

-- Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(reviewee_id, rating);

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_rec ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- ============================================================================
-- 4. DATABASE TRIGGERS & PROCEDURES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Generic Trigger Function: Automatic `updated_at` Refresh
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all mutable tables
CREATE OR REPLACE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_rider_profiles_updated_at BEFORE UPDATE ON rider_profiles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE OR REPLACE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ----------------------------------------------------------------------------
-- 4.2 Trigger Function: Recalculate User & Rider Average Rating
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recompute_user_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    new_avg NUMERIC(3, 2);
    new_count INT;
BEGIN
    target_user_id := NEW.reviewee_id;

    SELECT 
        COALESCE(ROUND(AVG(rating), 2), 5.00),
        COUNT(id)
    INTO 
        new_avg,
        new_count
    FROM reviews
    WHERE reviewee_id = target_user_id;

    -- Update Users table
    UPDATE users
    SET rating_avg = new_avg,
        rating_count = new_count
    WHERE id = target_user_id;

    -- If the reviewee is a Rider, also update their Rider Profile
    UPDATE rider_profiles
    SET safety_rating_avg = new_avg
    WHERE user_id = target_user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recompute_rating_on_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_recompute_user_rating();

-- ----------------------------------------------------------------------------
-- 4.3 Trigger Function: Auto-Manage Ride Available Seats
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_ride_seats()
RETURNS TRIGGER AS $$
BEGIN
    -- When a booking transitions to 'CONFIRMED'
    IF (TG_OP = 'INSERT' AND NEW.status = 'CONFIRMED') OR 
       (TG_OP = 'UPDATE' AND OLD.status != 'CONFIRMED' AND NEW.status = 'CONFIRMED') THEN
        UPDATE rides
        SET available_seats = 0
        WHERE id = NEW.ride_id;
    END IF;

    -- When a confirmed booking is 'CANCELLED' or 'REJECTED'
    IF TG_OP = 'UPDATE' AND OLD.status = 'CONFIRMED' AND NEW.status IN ('CANCELLED', 'REJECTED') THEN
        UPDATE rides
        SET available_seats = 1
        WHERE id = NEW.ride_id AND status = 'SCHEDULED';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_manage_ride_seats
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_sync_ride_seats();

-- ----------------------------------------------------------------------------
-- 4.4 Trigger Function: Ensure Wallet Balance Consistency
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_verify_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
    target_wallet_balance NUMERIC(10, 2);
BEGIN
    SELECT current_balance INTO target_wallet_balance
    FROM wallets
    WHERE id = NEW.wallet_id;

    IF target_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Target wallet ID % does not exist', NEW.wallet_id;
    END IF;

    -- Ensure balance_after matches current_balance
    IF NEW.balance_after <> (target_wallet_balance + NEW.amount) THEN
        RAISE EXCEPTION 'Ledger inconsistency: balance_after (%) must equal current_balance (%) + amount (%)',
            NEW.balance_after, target_wallet_balance, NEW.amount;
    END IF;

    -- Update parent wallet's current_balance atomically
    UPDATE wallets
    SET current_balance = NEW.balance_after
    WHERE id = NEW.wallet_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_wallet_balance_guard
BEFORE INSERT ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION fn_verify_wallet_balance();

-- ----------------------------------------------------------------------------
-- 4.5 Generic Trigger Function: Change Data Capture / Audit Log
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_capture_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_record_id UUID;
    v_action audit_action;
    v_old JSONB := NULL;
    v_new JSONB := NULL;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_record_id := NEW.id;
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_record_id := NEW.id;
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_record_id := OLD.id;
        v_old := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_logs (table_name, record_id, action, old_state, new_state, changed_at)
    VALUES (TG_TABLE_NAME::TEXT, v_record_id, v_action, v_old, v_new, CURRENT_TIMESTAMP);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply Audit Log Capture to high-sensitivity transactional tables
CREATE OR REPLACE TRIGGER trg_audit_bookings AFTER INSERT OR UPDATE OR DELETE ON bookings FOR EACH ROW EXECUTE FUNCTION fn_capture_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION fn_capture_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_wallets AFTER INSERT OR UPDATE OR DELETE ON wallets FOR EACH ROW EXECUTE FUNCTION fn_capture_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_rides AFTER INSERT OR UPDATE OR DELETE ON rides FOR EACH ROW EXECUTE FUNCTION fn_capture_audit_log();

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
