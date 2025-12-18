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

### Features (To Be Implemented)

- ✅ Form structure and data models
- ✅ Basic UI placeholders
- ✅ API route stubs
- ⏳ Form rendering with all question types
- ⏳ Form submission handling
- ⏳ Email notifications
- ⏳ Excel export
- ⏳ File uploads
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
- `POST /api/submit/[slug]` - Submit form
- `POST /api/admin/forms/save` - Save/update form

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
