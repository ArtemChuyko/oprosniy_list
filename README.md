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

# Admin panel authentication
ADMIN_SECRET=your-secure-random-secret-here

# Optional: Custom uploads directory (default: tmp/uploads relative to project root)
# UPLOADS_DIR=/path/to/uploads
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
2. An email is sent to `art.bim.project@gmail.com` with:
   - Excel file attached
   - Uploaded files attached (if under 20MB total)
   - Download links for files that are too large
3. Files are stored in the configured uploads directory (default: `tmp/uploads/[submissionId]/` or `/app/uploads/[submissionId]/` in Docker)
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

## Production Deployment

### Docker Deployment

The application can be deployed using Docker for self-hosted servers.

#### Prerequisites

- Docker and Docker Compose installed on your server
- SMTP credentials for email notifications
- Domain name (optional, for production use)

#### Quick Start with Docker Compose

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd questionnaire-app
   ```

2. **Create a `.env` file with your configuration:**
   ```env
   # SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=your-email@gmail.com
   
   # Email recipient for form submissions
   OWNER_EMAIL=owner@example.com
   
   # Admin panel secret (use a strong random string)
   ADMIN_SECRET=your-secure-random-secret-here
   
   # Optional: Custom uploads directory (default: /app/uploads inside container)
   # UPLOADS_DIR=/app/uploads
   ```

3. **Build and start the containers:**
   ```bash
   docker-compose up -d
   ```

4. **The application will be available at:**
   - `http://localhost:3000` (or your server's IP address)

5. **View logs:**
   ```bash
   docker-compose logs -f
   ```

6. **Stop the application:**
   ```bash
   docker-compose down
   ```

#### Docker Build Only

If you prefer to build and run the Docker image manually:

```bash
# Build the image
docker build -t questionnaire-app .

# Run the container
docker run -d \
  --name questionnaire-app \
  -p 3000:3000 \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASSWORD=your-app-password \
  -e OWNER_EMAIL=owner@example.com \
  -e ADMIN_SECRET=your-secret \
  -e UPLOADS_DIR=/app/uploads \
  -v $(pwd)/data:/app/data \
  -v uploads:/app/uploads \
  questionnaire-app
```

### Nginx Reverse Proxy Setup

For production deployments, it's recommended to use Nginx as a reverse proxy in front of the application.

#### Example Nginx Configuration

Create `/etc/nginx/sites-available/questionnaire-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (optional, requires SSL certificate)
    # return 301 https://$server_name$request_uri;

    # Or serve directly on HTTP
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Increase body size limit for file uploads (100MB)
        client_max_body_size 100M;
    }

    # Optional: Serve static files directly
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/questionnaire-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

#### SSL/HTTPS Setup (Recommended)

For production, use Let's Encrypt with Certbot:

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically update your Nginx configuration to use HTTPS.

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SMTP_HOST` | Yes | SMTP server hostname | - |
| `SMTP_PORT` | No | SMTP server port | `587` |
| `SMTP_USER` | Yes | SMTP username | - |
| `SMTP_PASSWORD` | Yes | SMTP password/app password | - |
| `SMTP_FROM` | No | From email address | Uses `SMTP_USER` |
| `OWNER_EMAIL` | Yes | Email to receive form submissions | - |
| `ADMIN_SECRET` | Yes | Secret token for admin panel access | - |
| `UPLOADS_DIR` | No | Directory for uploaded files | `tmp/uploads` (relative to cwd) or `/app/uploads` (Docker) |

### Data Persistence

- **Form definitions**: Stored in `./data/forms/` directory (mounted as volume in Docker)
- **Uploaded files**: Stored in `UPLOADS_DIR` (default: `/app/uploads` in Docker, persisted via volume)
- **Automatic cleanup**: Files older than 7 days are automatically deleted

### Monitoring and Maintenance

- **View application logs:**
  ```bash
  docker-compose logs -f questionnaire-app
  ```

- **Restart the application:**
  ```bash
  docker-compose restart questionnaire-app
  ```

- **Update the application:**
  ```bash
  git pull
  docker-compose build
  docker-compose up -d
  ```

- **Backup form data:**
  ```bash
  # Backup forms
  tar -czf forms-backup-$(date +%Y%m%d).tar.gz ./data/forms/
  
  # Backup uploads (if using volume)
  docker run --rm -v questionnaire-app_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz /data
  ```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

**Note:** Vercel has limitations for file uploads and local file storage. For production use with file uploads, consider self-hosted deployment with Docker.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
