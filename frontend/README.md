# GYMWEAR Frontend

React 19 + TypeScript + Tailwind CSS 4 (Vite).

## Development

```sh
cd frontend
npm install
npm run dev
```

## Scripts

```sh
npm run dev      # start dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # lint with oxlint
```

## Structure

```
frontend/
  public/
    images/      # static images served from /images/*
  src/
    App.tsx      # root component
    main.tsx     # app entry
    index.css    # Tailwind entry
  index.html
  vite.config.ts
```

Static assets placed in `public/` are served from the site root, so
`public/images/logo.png` is available at `/images/logo.png`.
