# Questionnaire App

A Next.js application for creating and managing dynamic questionnaire forms.

## Architecture

This project follows a structured architecture:

### Folder Structure

```
questionnaire-app/
├── app/
│   ├── f/[slug]/          # Public form pages
│   │   ├── page.tsx        # Form display page
│   │   └── done/           # Success page after submission
│   ├── admin/              # Admin dashboard
│   │   ├── page.tsx        # Forms list
│   │   └── forms/[slug]/   # Form editor
│   └── api/                # API routes
│       ├── forms/[slug]/   # GET form data
│       ├── submit/[slug]/  # POST form submission
│       └── admin/forms/save/ # POST save form
├── lib/
│   └── forms/
│       ├── schema.ts       # TypeScript data models
│       └── storage.ts      # Form storage helpers
└── data/
    └── forms/              # JSON form definitions
        └── demo.json       # Demo form example
```

### Data Models

- **Form**: Contains sections, metadata, and configuration
- **Section**: Groups related questions
- **Question**: Individual form fields with types, validation, and logic
- **Help**: Help text and links for questions
- **Logic**: Conditional display/validation rules

### Features

- ✅ Form structure and data models
- ✅ Form rendering with all question types (text, email, tel, number, date, select, radio, checkbox, file)
- ✅ Form submission handling with validation
- ✅ Email notifications with Excel reports
- ✅ Excel export (XLSX) with form data
- ✅ File uploads (JPG, PNG, PDF, MP4)
- ✅ Conditional logic (show/hide questions)
- ✅ Help system (modal/sidebar with media blocks)
- ✅ Progress tracking and autosave
- ⏳ Admin form builder

## Getting Started

First, install dependencies:

```bash
npm install
```

Copy the environment variables example:

```bash
cp .env.example .env.local
```

Configure email settings in `.env.local`:

```env
# Required for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
OWNER_EMAIL=owner@example.com
```

**Email Setup Notes:**
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- For other providers, check their SMTP settings
- The `OWNER_EMAIL` is where form submissions will be sent

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Routes

- `/` - Home page
- `/f/[slug]` - Public form view (e.g., `/f/demo`)
- `/f/[slug]/done` - Form submission success page
- `/admin` - Admin dashboard (forms list)
- `/admin/forms/[slug]` - Form editor (e.g., `/admin/forms/demo`)

### API Endpoints

- `GET /api/forms/[slug]` - Get form data
- `POST /api/submit/[slug]` - Submit form (multipart/form-data with files)
- `GET /api/download/[submissionId]/[filename]` - Download uploaded file
- `POST /api/admin/forms/save` - Save/update form

### Email & Reports

When a form is submitted:
1. An Excel report (XLSX) is generated with all form data
2. An email is sent to `OWNER_EMAIL` with:
   - Excel file attached
   - Uploaded files attached (if under 20MB total)
   - Download links for files that are too large
3. Files are stored in `tmp/uploads/[submissionId]/`
4. Old files are automatically cleaned up after 7 days

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
