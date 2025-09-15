-- Enhanced AI Chat Platform Database Schema
-- This script creates the comprehensive schema for the enhanced AI platform

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS guardrail_logs CASCADE;
DROP TABLE IF EXISTS model_usage CASCADE;
DROP TABLE IF EXISTS artifacts CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS messages_enhanced CASCADE;
DROP TABLE IF EXISTS chats_enhanced CASCADE;
DROP TABLE IF EXISTS users_enhanced CASCADE;

-- Enhanced Users Table
CREATE TABLE users_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    token_usage BIGINT DEFAULT 0,
    settings JSONB DEFAULT '{}',
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    avatar_url TEXT,
    display_name VARCHAR(255)
);

-- Enhanced Chats Table
CREATE TABLE chats_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_enhanced(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'shared')),
    last_context JSONB DEFAULT '{}',
    model_id VARCHAR(100),
    system_prompt TEXT,
    metadata JSONB DEFAULT '{}',
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0.00,
    share_token UUID UNIQUE DEFAULT gen_random_uuid()
);

-- Enhanced Messages Table
CREATE TABLE messages_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats_enhanced(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    parts JSONB NOT NULL DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    token_count INTEGER DEFAULT 0,
    model_used VARCHAR(100),
    reasoning TEXT,
    tool_calls JSONB DEFAULT '[]',
    tool_results JSONB DEFAULT '[]',
    guardrail_applied BOOLEAN DEFAULT FALSE,
    response_time_ms INTEGER,
    cost DECIMAL(8,6) DEFAULT 0.00
);

-- Artifacts Table
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats_enhanced(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages_enhanced(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('code', 'image', 'document', 'data', 'chart')),
    content TEXT NOT NULL,
    language VARCHAR(50),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100)
);

-- Model Usage Tracking Table
CREATE TABLE model_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_enhanced(id) ON DELETE CASCADE,
    model_id VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(8,6) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    chat_id UUID REFERENCES chats_enhanced(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages_enhanced(id) ON DELETE SET NULL
);

-- Guardrail Logs Table
CREATE TABLE guardrail_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_enhanced(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats_enhanced(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages_enhanced(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('blocked', 'modified', 'allowed', 'flagged')),
    reason TEXT NOT NULL,
    original_content TEXT,
    modified_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    guardrail_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Integrations Table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_enhanced(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('search', 'image', 'email', 'storage', 'code', 'web')),
    provider VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api_key_encrypted TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Model Configurations Table
CREATE TABLE model_configs (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    description TEXT,
    capabilities JSONB NOT NULL DEFAULT '{}',
    pricing JSONB NOT NULL DEFAULT '{}',
    guardrail_strength VARCHAR(20) DEFAULT 'medium' CHECK (guardrail_strength IN ('low', 'medium', 'high')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_window INTEGER,
    max_output_tokens INTEGER,
    supports_vision BOOLEAN DEFAULT FALSE,
    supports_functions BOOLEAN DEFAULT FALSE,
    supports_streaming BOOLEAN DEFAULT TRUE
);

-- API Keys Table (encrypted storage)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_enhanced(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    enabled BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX idx_chats_user_id ON chats_enhanced(user_id);
CREATE INDEX idx_chats_created_at ON chats_enhanced(created_at DESC);
CREATE INDEX idx_messages_chat_id ON messages_enhanced(chat_id);
CREATE INDEX idx_messages_created_at ON messages_enhanced(created_at DESC);
CREATE INDEX idx_artifacts_chat_id ON artifacts(chat_id);
CREATE INDEX idx_artifacts_message_id ON artifacts(message_id);
CREATE INDEX idx_model_usage_user_id ON model_usage(user_id);
CREATE INDEX idx_model_usage_created_at ON model_usage(created_at DESC);
CREATE INDEX idx_guardrail_logs_user_id ON guardrail_logs(user_id);
CREATE INDEX idx_guardrail_logs_created_at ON guardrail_logs(created_at DESC);
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Create composite indexes for common queries
CREATE INDEX idx_messages_chat_role ON messages_enhanced(chat_id, role);
CREATE INDEX idx_model_usage_user_model ON model_usage(user_id, model_id);
CREATE INDEX idx_chats_user_updated ON chats_enhanced(user_id, updated_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_configs_updated_at BEFORE UPDATE ON model_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
