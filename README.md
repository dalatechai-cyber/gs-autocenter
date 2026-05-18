This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. Required keys:

| Key | Where it is used | How to obtain it |
| --- | --- | --- |
| `ADMIN_PASSWORD` | `/admin/login` — protects the marketing banner panel. | Choose a strong string locally. In production set it in **Vercel → Project Settings → Environment Variables**. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage for banner data (`gs-banners.json`) and uploaded images. | Vercel Dashboard → Storage → Blob → "Connect" → copy the `BLOB_READ_WRITE_TOKEN` shown under `.env.local`. |

Without `ADMIN_PASSWORD` the admin login page shows a clear setup warning
instead of the form. Without `BLOB_READ_WRITE_TOKEN` saving banners fails.

## Admin panel

GS marketing manages the announcement bar at `/admin`:

1. Visit `/admin/login`, enter the `ADMIN_PASSWORD`.
2. The dashboard lists every banner with status (live / scheduled / ended / off).
3. **+ Шинэ зарлал** creates a banner (title, body, optional link, optional
   image, start and end dates, active toggle).
4. The active banner appears immediately in the red bar above the navigation.
5. Use the per-row buttons to edit, deactivate, or delete.

Banner data and images live in Vercel Blob; no external database is needed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
