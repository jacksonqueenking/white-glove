# White Glove

Minimal Next.js prototype for the White Glove AI event planning platform.

## Getting Started

- Install dependencies: `npm install`
- Start the Next.js dev server (App Router): `npm run dev`
- Visit `http://localhost:3000` to see the welcome screen.

The development server supports hot reloading, so edits inside the `app` directory appear instantly in the browser.

This project uses the Next.js App Router (`app/` directory) with a single `app/page.js` entry point and global styles in `app/globals.css`.

## Developing with Vercel CLI

- Install the Vercel CLI if you don’t have it: `npm install -g vercel`
- Log in once: `vercel login`
- Run the local Vercel environment: `npm run vercel:dev`
- Open `http://localhost:3000` to preview the project with Vercel’s runtime.
