# Admin User Management

This document explains how to create and manage admin users for the affiliate website.

## Overview

The system supports multiple admin users that can access the admin dashboard. Each admin user has:
- Username
- Password (stored securely with bcrypt hashing)
- Name (optional)

## Creating Admin Users

There are several methods to create admin users:

### Method 1: Using the Interactive Script

For a user-friendly interactive experience, use the `createMultipleAdmins.js` script:

```bash
cd server
node scripts/createMultipleAdmins.js
```

This script will:
1. Prompt you to enter a username (or "exit" to quit)
2. Prompt for a password
3. Optionally prompt for a name (defaults to username if not provided)
4. Repeat this process until you enter "exit" as the username

### Method 2: Using Command-Line Arguments

For quick creation of a single admin user, especially useful for scripts or automation:

```bash
cd server
node scripts/addAdmin.js <username> <password> [name]
```

Example:
```bash
node scripts/addAdmin.js marketing_admin strong_password "Marketing Team"
```

### Method 3: Using the Original Scripts

The system also includes the original admin creation scripts:

```bash
# Create default admin (username: admin, password: admin123)
node createAdmin.js

# Create SimpleAdmin (less secure, plain text password)
node createSimpleAdmin.js
```

These are primarily for initial setup and testing.

## Admin Login

Once admin users are created, they can log in at:

```
/admin/login
```

The system uses JWT for authentication with a 24-hour session expiry.

## Security Considerations

1. Always use strong passwords for admin accounts
2. The password is hashed using bcrypt before storage in the database
3. Regular admin accounts (using the `Admin` model) have secure password storage
4. Simple admin accounts (using the `SimpleAdmin` model) store passwords in plain text and should not be used in production

## Managing Admin Users

Currently, admin users can only be created through the scripts. Future versions may include UI-based admin user management directly from the admin dashboard.

## Troubleshooting

If you encounter issues:

1. Ensure MongoDB is running and accessible
2. Check that the `MONGODB_URI` environment variable is set correctly
3. Verify JWT_SECRET is set in the .env file
4. Check server logs for detailed error messages 