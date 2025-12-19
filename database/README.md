# Database Scripts

This folder contains all SQL scripts for the Ramirez Accounting database.

## Structure

### `/schema/`
Main database schema files:
- `database-schema.sql` - Core database schema (profiles, clients, documents, invoices, messages)
- `ONBOARDING_SCHEMA.sql` - Onboarding system schema (required_documents, quickbooks_connections)
- `ARCHIVE_SYSTEM.sql` - Archive system for data retention

### `/fixes/`
RLS (Row Level Security) policy fixes:
- `FIX_PROFILES_RLS.sql` - Fixes infinite recursion in profiles RLS
- `FIX_DOCUMENTS_RLS.sql` - Fixes document upload RLS issues
- `FIX_CLIENTS_UPDATE_RLS.sql` - Allows clients to update their own onboarding status
- `FIX_DOCUMENTS_DELETE_RLS.sql` - Allows clients to delete their own documents
- `FIX_STORAGE_BUCKET_RLS.sql` - Storage bucket RLS policies
- `DEBUG_RLS.sql` - Debugging tool for RLS issues

### `/setup/`
Setup and testing scripts:
- `CREATE_MOCK_DATA.sql` - Create mock data for testing
- `CREATE_MOCK_DATA_SIMPLE.sql` - Simplified mock data creation
- `SETUP_ARCHIVE_SIMPLE.sql` - Simple archive system setup

## Usage

1. **Initial Setup**: Run `schema/database-schema.sql` first, then `schema/ONBOARDING_SCHEMA.sql`
2. **If Issues**: Check `fixes/` folder for relevant RLS fixes
3. **Testing**: Use `setup/` scripts to create test data

