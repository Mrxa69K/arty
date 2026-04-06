# Artydrop - Professional Photo Gallery Delivery Platform

Artydrop is a SaaS platform for professional photographers to deliver photo galleries to their clients in a secure, premium, and simple way.

## Features

### For Photographers
- **Dashboard** - Overview of all galleries with key stats
- **Gallery Management** - Create, edit, and delete galleries
- **Photo Upload** - Upload photos to Supabase Storage
- **Security Settings** - Password protection, expiration dates, download controls
- **Share Links** - Generate secure links to share with clients

### For Clients
- **Beautiful Gallery View** - Responsive photo grid with lightbox
- **Password Protection** - Secure access to private galleries
- **Photo Downloads** - Download individual photos (when enabled)
- **Mobile Friendly** - Works great on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Icons**: Lucide React

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd /app
yarn install
```

### 2. Configure Environment Variables

Create/update `.env` file:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and run the contents of `SUPABASE_SETUP.sql`

### 4. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it `photos`
4. Enable **Public bucket** option
5. Create the bucket

### 5. Run the Application

```bash
yarn dev
```

Or with supervisor:
```bash
sudo supervisorctl restart nextjs
```

## Typical Delivery Flow

### Photographer Workflow

1. **Sign Up / Login**
   - Create an account at `/signup`
   - Log in at `/login`

2. **Create Gallery**
   - Go to Dashboard → Click "New Gallery"
   - Fill in gallery details (title, client name, event date, notes)
   - Click "Create Gallery"

3. **Upload Photos**
   - In the gallery editor, go to "Photos" tab
   - Click the upload area and select photos
   - Wait for upload to complete

4. **Configure Security Settings**
   - Go to "Sharing" tab
   - Set password protection (optional)
   - Set expiration date (optional)
   - Enable/disable downloads

5. **Generate & Share Link**
   - Click "Generate Share Link"
   - Copy the link
   - Send to your client via email, SMS, etc.

### Client Workflow

1. **Receive Link**
   - Client receives a link like `https://artydrop.com/g/abc123`

2. **Access Gallery**
   - Open the link in a browser
   - If password protected, enter the password

3. **View Photos**
   - Browse the responsive photo grid
   - Click photos to open lightbox view
   - Navigate with arrow keys or buttons

4. **Download (if enabled)**
   - Hover over photos to see download button
   - Click to download individual photos
   - "Download All" coming soon

## API Endpoints

### Public Gallery Access (No Auth Required)

- `GET /api/gallery/[token]` - Get gallery info (requires password check)
- `POST /api/gallery/[token]/verify` - Verify gallery password
- `GET /api/gallery/[token]/photos` - Get gallery photos (with session token)

### Protected Endpoints (Auth Required)

All protected endpoints use Supabase client with RLS policies.

## Database Schema

### Tables

- **profiles** - User profiles (extends auth.users)
- **galleries** - Photo galleries
- **photos** - Individual photos in galleries
- **gallery_links** - Public share links with security settings

### Row Level Security

All tables have RLS enabled:
- Users can only access their own data
- Public gallery access is handled via API routes using service role

## Security Features

- **Password Hashing** - bcrypt for gallery passwords
- **Token-based Access** - Random UUIDs for share links
- **Expiration Dates** - Automatic expiry for galleries
- **Row Level Security** - Database-level access control
- **Multi-tenant** - Complete data isolation between users

## Public Gallery Link Flow

When a client opens a share link (`/g/[token]`), the following flow occurs:

### 1. Token Resolution
The backend receives the token and:
- Looks up the `gallery_links` table to find the matching token
- Retrieves the associated gallery and its settings

### 2. Validation Checks
The server performs these checks in order:

| Check | Result if Failed |
|-------|------------------|
| Token exists | 404 - "Gallery not found" page |
| Not expired | 403 - "Gallery Expired" page with message to contact photographer |
| Password (if required) | Password entry screen |

### 3. UI States

**Loading State**
- Centered spinner with Artydrop branding
- "Loading your gallery..." message

**Expired State**
- Clock icon in red circle
- "Gallery Expired" heading
- Explanation and suggestion to contact photographer

**Error State (404)**
- Alert icon
- "Gallery Not Found" heading
- Helpful suggestions

**Password Screen**
- Gallery title and client name displayed
- Lock icon with "Protected Gallery" message
- Password input with show/hide toggle
- Error feedback for wrong passwords

**Main Gallery View**
- Header: Gallery title, client name, event date, photo count
- Download All button (if downloads enabled)
- Responsive photo grid (1-4 columns based on screen size)
- Hover effects with zoom icon
- Individual download buttons on each photo (if enabled)
- Click to open lightbox

**Lightbox**
- Full-screen dark overlay
- Large centered image
- Left/Right navigation arrows
- Keyboard navigation (←, →, Esc)
- Photo counter (e.g., "3 / 25")
- Download button in bottom bar

### 4. Download Behavior

| `allow_download` | Behavior |
|------------------|----------|
| `true` | Download buttons visible on photos and in lightbox, "Download All" in header |
| `false` | No download buttons, info banner: "Downloads are disabled for this gallery" |

### 5. Security Notes

- Internal gallery IDs are never exposed in URLs
- All access goes through the token
- Password verification happens server-side with bcrypt
- Session tokens are generated after password verification
- Expired galleries cannot be accessed even with correct password

## Coming Soon

- Download All (zip archive)
- Email delivery
- Custom branding
- Analytics
- Watermarking

---

Built with ❤️ for professional photographers
