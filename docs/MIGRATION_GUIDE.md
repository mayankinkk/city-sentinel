# 🔄 City Sentinel - Data Migration Guide

Complete guide to migrate from Lovable Cloud to self-hosted infrastructure.

---

## 📋 Migration Overview

### What Gets Migrated

| Component | Source | Target | Method |
|-----------|--------|--------|--------|
| **Frontend Code** | GitHub/Lovable | Your servers | Git clone + build |
| **Database Schema** | Lovable Cloud | Your PostgreSQL | SQL migration script |
| **User Data** | Lovable Cloud | Your PostgreSQL | pg_dump export |
| **Stored Files** | Lovable Storage | Your S3/Storage | API export |
| **Edge Functions** | Lovable Cloud | Supabase/Custom | Manual deploy |

### Migration Timeline

```
Day 1-2: Environment Setup
Day 3-4: Schema Migration + Testing
Day 5-6: Data Migration + Validation
Day 7: DNS Cutover + Go-Live
Day 8-14: Monitoring + Stabilization
```

---

## 🚀 Step-by-Step Migration

### Phase 1: Prepare Target Environment

#### 1.1 Set Up PostgreSQL

```bash
# Install PostgreSQL 15
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15

# Create database
sudo -u postgres psql
CREATE DATABASE city_sentinel;
CREATE USER city_sentinel_admin WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE city_sentinel TO city_sentinel_admin;
\q
```

#### 1.2 Configure PostgreSQL for Production

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
```

```ini
# Performance tuning
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
```

#### 1.3 Install Required Extensions

```sql
-- Connect to city_sentinel database
\c city_sentinel

-- Install extensions (required by Supabase features)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- For text search
CREATE EXTENSION IF NOT EXISTS "postgis";      -- For geospatial (optional)
```

---

### Phase 2: Schema Migration

#### 2.1 Run Full Migration Script

The complete schema is in `public/city-sentinel-full-migration.sql`. This includes:

- All enum types
- All tables with constraints
- Row Level Security policies
- Functions and triggers
- Views

```bash
# Run migration
psql -h localhost -U city_sentinel_admin -d city_sentinel -f public/city-sentinel-full-migration.sql
```

#### 2.2 Verify Schema

```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Expected output:
-- admin_invites
-- departments
-- issue_comments
-- issue_follows
-- issue_images
-- issue_status_history
-- issue_upvotes
-- issues
-- notifications
-- profile_access_log
-- profiles
-- user_departments
-- user_roles
-- verification_history

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

---

### Phase 3: Data Export from Lovable Cloud

#### 3.1 Export Using Supabase API

Create `scripts/export-data.js`:

```javascript
// scripts/export-data.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES = [
  'departments',
  'profiles', 
  'user_roles',
  'user_departments',
  'issues',
  'issue_images',
  'issue_comments',
  'issue_upvotes',
  'issue_follows',
  'issue_status_history',
  'verification_history',
  'notifications',
  'admin_invites',
  'profile_access_log'
];

async function exportTable(tableName) {
  console.log(`Exporting ${tableName}...`);
  
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + batchSize - 1);
    
    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      break;
    }
    
    if (data.length === 0) break;
    
    allData = allData.concat(data);
    from += batchSize;
    
    if (data.length < batchSize) break;
  }
  
  fs.writeFileSync(
    `exports/${tableName}.json`,
    JSON.stringify(allData, null, 2)
  );
  
  console.log(`  Exported ${allData.length} records`);
  return allData.length;
}

async function exportAllData() {
  fs.mkdirSync('exports', { recursive: true });
  
  const summary = {};
  
  for (const table of TABLES) {
    summary[table] = await exportTable(table);
  }
  
  console.log('\n=== Export Summary ===');
  console.table(summary);
  
  fs.writeFileSync('exports/summary.json', JSON.stringify(summary, null, 2));
}

exportAllData();
```

```bash
# Run export
node scripts/export-data.js
```

#### 3.2 Export Storage Files

```javascript
// scripts/export-storage.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function exportStorage() {
  const bucket = 'issue-images';
  fs.mkdirSync(`exports/storage/${bucket}`, { recursive: true });
  
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list('', { limit: 10000 });
  
  if (error) {
    console.error('Error listing files:', error);
    return;
  }
  
  console.log(`Found ${files.length} files to export`);
  
  for (const file of files) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(file.name);
    
    const destPath = `exports/storage/${bucket}/${file.name}`;
    
    try {
      await downloadFile(data.publicUrl, destPath);
      console.log(`  Downloaded: ${file.name}`);
    } catch (err) {
      console.error(`  Failed: ${file.name}`, err.message);
    }
  }
}

exportStorage();
```

---

### Phase 4: Data Import to Target

#### 4.1 Import Table Data

Create `scripts/import-data.js`:

```javascript
// scripts/import-data.js
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'city_sentinel',
  user: 'city_sentinel_admin',
  password: process.env.DB_PASSWORD
});

// Import order matters due to foreign keys
const IMPORT_ORDER = [
  'departments',
  'profiles',
  'user_roles', 
  'user_departments',
  'issues',
  'issue_images',
  'issue_comments',
  'issue_upvotes',
  'issue_follows',
  'issue_status_history',
  'verification_history',
  'notifications',
  'admin_invites',
  'profile_access_log'
];

async function importTable(tableName) {
  const filePath = `exports/${tableName}.json`;
  
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${tableName} (no export file)`);
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.length === 0) {
    console.log(`  Skipping ${tableName} (no data)`);
    return 0;
  }
  
  console.log(`Importing ${tableName} (${data.length} records)...`);
  
  const columns = Object.keys(data[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const insertQuery = `
    INSERT INTO public.${tableName} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT DO NOTHING
  `;
  
  let imported = 0;
  
  for (const row of data) {
    const values = columns.map(col => row[col]);
    
    try {
      await client.query(insertQuery, values);
      imported++;
    } catch (err) {
      console.error(`  Error importing row:`, err.message);
    }
  }
  
  console.log(`  Imported ${imported}/${data.length} records`);
  return imported;
}

async function importAllData() {
  await client.connect();
  
  // Disable triggers during import for speed
  await client.query('SET session_replication_role = replica');
  
  const summary = {};
  
  for (const table of IMPORT_ORDER) {
    summary[table] = await importTable(table);
  }
  
  // Re-enable triggers
  await client.query('SET session_replication_role = DEFAULT');
  
  // Update sequences
  await client.query(`
    SELECT setval(pg_get_serial_sequence('public.issues', 'id'), 
                  COALESCE((SELECT MAX(id) FROM public.issues), 1));
  `);
  
  console.log('\n=== Import Summary ===');
  console.table(summary);
  
  await client.end();
}

importAllData();
```

#### 4.2 Migrate Auth Users

For Supabase Auth users, you'll need to either:

**Option A: Ask users to re-register** (simplest)
- Send email to all users with new registration link
- They create new accounts on your system

**Option B: Migrate using Supabase Admin API**

```javascript
// This requires service_role key and only works if staying on Supabase
const { data: users } = await supabase.auth.admin.listUsers();

// Export user data (excluding passwords)
const exportedUsers = users.users.map(u => ({
  id: u.id,
  email: u.email,
  phone: u.phone,
  created_at: u.created_at,
  email_confirmed_at: u.email_confirmed_at,
  user_metadata: u.user_metadata
}));

fs.writeFileSync('exports/auth_users.json', JSON.stringify(exportedUsers, null, 2));
```

**Option C: Use password reset flow**
- Import users without passwords
- Force password reset on first login

---

### Phase 5: Storage Migration

#### 5.1 Set Up MinIO (S3-compatible)

```bash
# Install MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create storage directory
sudo mkdir -p /data/city-sentinel-storage

# Start MinIO
MINIO_ROOT_USER=admin \
MINIO_ROOT_PASSWORD=your-secure-password \
minio server /data/city-sentinel-storage --console-address ":9001"
```

#### 5.2 Upload Exported Files

```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure client
mc alias set local http://localhost:9000 admin your-secure-password

# Create bucket
mc mb local/issue-images
mc policy set public local/issue-images

# Upload files
mc cp --recursive exports/storage/issue-images/ local/issue-images/
```

---

### Phase 6: Update Application Configuration

#### 6.1 Update Environment Variables

```bash
# .env.production
VITE_SUPABASE_URL=https://your-new-supabase-url.com
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# If using custom storage
VITE_STORAGE_URL=https://storage.your-domain.com
```

#### 6.2 Update Supabase Client (if self-hosting)

If not using Supabase, you'll need to replace `@supabase/supabase-js` with custom API calls. This requires significant code changes.

---

### Phase 7: Validation & Testing

#### 7.1 Data Validation Queries

```sql
-- Check row counts match
SELECT 'issues' as table_name, COUNT(*) as count FROM issues
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'departments', COUNT(*) FROM departments;

-- Verify foreign key integrity
SELECT COUNT(*) FROM issues i
LEFT JOIN profiles p ON i.reporter_id = p.user_id
WHERE i.reporter_id IS NOT NULL AND p.user_id IS NULL;
-- Should return 0

-- Check RLS is working
SET ROLE anon;
SELECT COUNT(*) FROM issues; -- Should see public issues
RESET ROLE;
```

#### 7.2 Application Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Issues can be created
- [ ] Images upload successfully
- [ ] Map displays issues correctly
- [ ] Admin dashboard accessible to admins
- [ ] Notifications are received
- [ ] Search functionality works
- [ ] Export features work

---

### Phase 8: DNS Cutover

#### 8.1 Prepare DNS Records

```
# Before cutover
city-sentinel.gov.in    A    old-server-ip (TTL: 3600)

# Reduce TTL 24 hours before cutover
city-sentinel.gov.in    A    old-server-ip (TTL: 60)

# Cutover
city-sentinel.gov.in    A    new-server-ip (TTL: 60)

# After stabilization
city-sentinel.gov.in    A    new-server-ip (TTL: 3600)
```

#### 8.2 Cutover Procedure

1. **T-24h**: Reduce DNS TTL to 60 seconds
2. **T-1h**: Final data sync from old to new
3. **T-0**: Update DNS to point to new server
4. **T+5m**: Verify new server receiving traffic
5. **T+1h**: Monitor for errors
6. **T+24h**: Increase DNS TTL back to 3600

---

## 🔄 Rollback Plan

If issues occur:

1. **Immediate (< 1 hour)**: Revert DNS to old server
2. **Data sync**: Copy any new data from new → old
3. **Root cause**: Investigate issue in staging
4. **Retry**: Schedule new cutover window

---

## 📞 Support During Migration

- Keep old system read-only during migration window
- Have database admin on standby
- Monitor error logs continuously
- Communicate maintenance window to users

---

**Document Version:** 1.0  
**Last Updated:** January 2025
