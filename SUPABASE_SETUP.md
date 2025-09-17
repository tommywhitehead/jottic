# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon public key
3. Update the `.env.local` file with your actual credentials:

```env
VITE_SUPABASE_URL=your_actual_project_url
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

## 3. Set Up the Database

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create the notes table and necessary functions

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to a URL like `/my-note` (anything other than `/` or `/home`)
3. Start typing - you should see "saving..." appear next to the document title
4. Refresh the page - your content should be loaded from the database

## Features

- **Auto-save**: Notes are automatically saved 1 second after you stop typing
- **URL-based notes**: Each unique URL path creates a separate note
- **Real-time status**: See saving/loading/error states in the UI
- **Debounced saving**: Prevents excessive API calls while typing

## Database Schema

The `notes` table has the following structure:
- `id`: UUID primary key
- `title`: The URL path (e.g., "my-note")
- `content`: The note content
- `created_at`: Timestamp when created
- `updated_at`: Timestamp when last updated

## Troubleshooting

- Make sure your `.env.local` file has the correct Supabase credentials
- Check that the database schema was created successfully
- Verify that Row Level Security policies allow your operations
- Check the browser console for any error messages
