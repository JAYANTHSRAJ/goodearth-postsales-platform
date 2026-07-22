-- ==============================================================================
-- GoodEarth Post-Sales Platform - Standalone Development Data Cleanup Script
-- ==============================================================================
-- Purpose: Safely delete all development / demo / sample application data
--          while preserving database schema, Liquibase migration history tables
--          (DATABASECHANGELOG, DATABASECHANGELOGLOCK), system reference tables
--          (stages, notification_templates, system_settings), and the primary
--          admin user (admin@goodearth.com).
-- ==============================================================================

BEGIN;

-- 1. WorkDrive Mock / Integrations Data
DELETE FROM workdrive_file_versions;
DELETE FROM workdrive_files;
DELETE FROM workdrive_folders;

-- 2. Document Annotations, Comments, & Attachments
DELETE FROM annotation_attachments;
DELETE FROM annotation_comments;
DELETE FROM annotations;

-- 3. Financial Quotes, Change Requests & History
DELETE FROM financial_quotes;
DELETE FROM change_request_history;
DELETE FROM change_requests;

-- 4. Payment Receipts & Schedules
DELETE FROM payment_receipts;
DELETE FROM payment_schedules;

-- 5. Project Construction Updates & Media
DELETE FROM project_update_media;
DELETE FROM project_updates;

-- 6. Customer Documents & Workflows
DELETE FROM documents;
DELETE FROM workflows;

-- 7. Buyer KYC Applications & Associations
DELETE FROM buyer_kyc_associations;
DELETE FROM kyc_modification_requests;
DELETE FROM kyc_applications;

-- 8. Client Profiles & Family Members
DELETE FROM client_profiles;
DELETE FROM family_members;

-- 9. Buyers & Projects Core Entities
DELETE FROM buyers;
DELETE FROM projects;

-- 10. User Notifications, Logs & Preferences
DELETE FROM user_notification_states;
DELETE FROM notification_delivery_logs;
DELETE FROM notifications;
DELETE FROM notification_preferences;

-- 11. User Auth & Webhook Records
DELETE FROM user_otps;
DELETE FROM refresh_tokens;
DELETE FROM webhook_events;

-- 12. System Users (Preserve ONLY admin@goodearth.com)
DELETE FROM users WHERE LOWER(email) <> 'admin@goodearth.com';

COMMIT;
