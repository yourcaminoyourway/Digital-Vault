# Digital Vault Test Setup Guide

This guide provides step-by-step instructions for setting up test data and manually testing the Digital Vault application.

## Prerequisites

- Supabase project set up
- Database migrations applied (profiles, user_roles, documents, categories)
- Storage bucket "documents" created
- Application running locally

## Step 1: Create Test Users

### Method 1: Using Supabase Auth Dashboard

1. Go to your Supabase project → **Authentication** → **Users**
2. Click **Add User**
3. Create the following test users:

#### Test User 1 (Admin)
- Email: `admin@example.com`
- Password: `Admin123!`
- Confirm password: `Admin123!`

#### Test User 2 (Regular User)
- Email: `user@example.com`
- Password: `User123!`
- Confirm password: `User123!`

#### Test User 3 (Another User - for RLS testing)
- Email: `other@example.com`
- Password: `Other123!`
- Confirm password: `Other123!`

### Method 2: Using Application Registration

1. Navigate to application login page
2. Click **Register**
3. Fill in credentials and register
4. Repeat for multiple test users

## Step 2: Create User Profiles

In Supabase SQL Editor, run:

```sql
-- Add profiles for test users
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1)
from auth.users
where email in ('admin@example.com', 'user@example.com', 'other@example.com')
on conflict (id) do nothing;

-- Verify profiles were created
select id, email, full_name, created_at from public.profiles;
```

## Step 3: Set User Roles

In Supabase SQL Editor, run:

```sql
-- Set admin role for admin@example.com
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do nothing;

-- Set user role for other users
insert into public.user_roles (user_id, role)
select id, 'user'
from auth.users
where email in ('user@example.com', 'other@example.com')
on conflict (user_id) do nothing;

-- Verify roles were created
select ur.user_id, u.email, ur.role 
from public.user_roles ur
join auth.users u on ur.user_id = u.id;
```

## Step 4: Create Sample Documents

### Via Application UI

1. Log in as `user@example.com` / `User123!`
2. Click **+ Add Document**
3. Fill in form with sample data:
   - **Title**: Laptop Warranty
   - **Description**: Dell XPS 15 warranty document
   - **Category**: Warranty
   - **Item Name**: Dell XPS 15 Laptop
   - **Brand**: Dell
   - **Purchase Date**: 2024-06-15
   - **Warranty Expiry**: 2027-06-15
   - **File**: Upload any PDF or image

4. Click **Save Document**

5. Repeat with different documents:
   - iPhone Warranty
   - Receipt for recent purchase
   - Manual for kitchen appliance
   - Insurance document

### Via SQL (Direct Database Insert)

In Supabase SQL Editor, run:

```sql
-- First, get user_id for user@example.com
select id from auth.users where email = 'user@example.com';

-- Replace USER_ID_HERE with the actual UUID, then run:
insert into public.documents (
  user_id,
  title,
  description,
  category,
  item_name,
  item_brand,
  purchase_date,
  warranty_expiry,
  file_path
) values
  (
    'USER_ID_HERE',
    'Laptop Warranty',
    'Dell XPS 15 warranty coverage document',
    'warranty',
    'Dell XPS 15 Laptop',
    'Dell',
    '2024-06-15'::date,
    '2027-06-15'::date,
    'USER_ID_HERE/sample_warranty.pdf'
  ),
  (
    'USER_ID_HERE',
    'iPhone Receipt',
    'Purchase receipt from Apple Store',
    'receipt',
    'iPhone 15 Pro',
    'Apple',
    '2024-09-20'::date,
    null,
    'USER_ID_HERE/iphone_receipt.pdf'
  ),
  (
    'USER_ID_HERE',
    'Microwave Manual',
    'User manual for kitchen microwave',
    'manual',
    'Microwave Oven',
    'LG',
    '2023-03-10'::date,
    null,
    'USER_ID_HERE/microwave_manual.pdf'
  );

-- Verify documents were created
select id, user_id, title, category, created_at 
from public.documents 
order by created_at desc;
```

## Step 5: Test File Upload

### Testing Upload via Application

1. Log in as a test user
2. Go to **Add Document**
3. Select a file (PDF, JPG, or PNG)
4. Fill in other fields
5. Click **Save Document**
6. Verify:
   - File appears in Supabase Storage under `documents/{user_id}/` folder
   - Document record created in database
   - File path stored correctly

### Verify Files in Storage

In Supabase dashboard:
1. Go to **Storage** → **documents**
2. You should see folders for each user: `UUID/timestamp_filename.pdf`
3. Click on a file to verify it's accessible

## Step 6: Test RLS Policies

### Test 1: User Can View Own Documents

```sql
-- Logged in as user@example.com, run:
select id, title, user_id from public.documents 
where user_id = auth.uid();

-- Expected: Should see only their documents
```

### Test 2: User Cannot View Other Users' Documents

```sql
-- As user@example.com, try to access other user's documents
-- Get other_user_id first:
select id from auth.users where email = 'other@example.com';

-- Then try to select their documents (replace OTHER_USER_ID):
select * from public.documents 
where user_id = 'OTHER_USER_ID'::uuid;

-- Expected: Error - permission denied (RLS policy blocks)
```

### Test 3: User Cannot Modify Other Users' Documents

```sql
-- Try to update another user's document
update public.documents 
set title = 'Hacked' 
where user_id != auth.uid();

-- Expected: No rows affected (RLS blocks update)
```

### Test 4: Storage RLS Policy

1. Get a file path from another user's document
2. Try to download it through the application
3. Expected: Access denied error

## Step 7: Test CRUD Operations

### Create (Create New Document)
```
✓ Fill form with valid data
✓ Upload file
✓ Click save
✓ Verify appears in document list
✓ Verify file in storage
✓ Verify record in database
```

### Read (View Document Details)
```
✓ Click on document in list
✓ View all details displayed correctly
✓ Download button works
✓ Warranty expiry shows in red if < 30 days
```

### Update (Edit Document) - *If implemented*
```
✓ Click Edit button
✓ Change title/description
✓ Change warranty date
✓ Save changes
✓ Verify updated in list and database
```

### Delete (Remove Document)
```
✓ Click Delete button
✓ Confirm deletion dialog
✓ Document removed from list
✓ File removed from storage
✓ Database record deleted
```

## Step 8: Test Edge Cases

### Warranty Expiry Dates
1. Create document with warranty expiry today
   - Expected: Red highlight on dashboard
2. Create document with warranty expiry 25 days from now
   - Expected: Yellow highlight on dashboard
3. Create document with warranty expiry 60 days from now
   - Expected: Normal display
4. Try to set warranty_expiry before purchase_date
   - Expected: Constraint error (if implemented)

### File Upload Limits
1. Try uploading file > 10MB
   - Expected: Error message
2. Try uploading unsupported file type (.exe, .zip)
   - Expected: Error message (file type validation)
3. Upload valid PDF < 10MB
   - Expected: Success

### Empty States
1. Log in as fresh user with no documents
   - Expected: "No documents yet" message
2. Delete all documents
   - Expected: Return to empty state message

## Step 9: Test Authentication Flow

### Signup
```
✓ Go to register page
✓ Enter valid email and password
✓ Confirm password
✓ Click register
✓ Redirect to login
✓ Try login with new credentials
```

### Login
```
✓ Enter correct email/password → Success
✓ Enter wrong password → Error
✓ Enter non-existent email → Error
✓ After login, redirect to dashboard
```

### Logout
```
✓ Click logout button
✓ Redirect to login page
✓ Cannot access dashboard without logging in again
```

## Test Data Summary

| Email | Password | Role | Documents |
|-------|----------|------|-----------|
| admin@example.com | Admin123! | admin | 0 (setup only) |
| user@example.com | User123! | user | 3-5 samples |
| other@example.com | Other123! | user | Optional |

## Performance Testing Checklist

- [ ] Load dashboard with 100+ documents
- [ ] Search/filter documents
- [ ] Pagination works (if implemented)
- [ ] File download completes without timeout
- [ ] Responsive on mobile (375px width)
- [ ] Responsive on tablet (768px width)
- [ ] Responsive on desktop (1920px width)

## Cleanup

To delete all test data:

```sql
-- Delete all documents
delete from public.documents;

-- Delete all user_roles
delete from public.user_roles;

-- Delete all profiles
delete from public.profiles;

-- Delete test users (from Auth UI only, SQL won't work)
-- Go to Authentication → Users and manually delete
```

## Troubleshooting

### Documents not appearing
1. Check user is logged in
2. Verify user_id matches in database
3. Check RLS policies in "Authentication" → "Policies"

### File upload fails
1. Check storage bucket exists and is private
2. Verify storage policies are set correctly
3. Check file size < 10MB
4. Check file type is allowed (PDF, JPG, PNG)

### Cannot login
1. Verify user exists in auth.users
2. Check password is correct
3. Verify profile exists for the user
4. Check for any RLS policy issues

### RLS blocking legitimate access
1. Go to SQL Editor and check RLS policies
2. Verify `auth.uid()` is used correctly
3. Test with `select current_user_id();` to verify auth context
