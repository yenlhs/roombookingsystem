# Screenshots for Hero Carousel

## Instructions

Place your screenshot images in this directory with the following naming convention:

- `screenshot-1.png` (or .jpg, .jpeg, .webp)
- `screenshot-2.png`
- `screenshot-3.png`
- `screenshot-4.png`

## Supported Formats

- PNG (.png) - Recommended for high quality
- JPEG (.jpg, .jpeg) - Good for photographs
- WebP (.webp) - Modern format with excellent compression

## Image Specifications

- **Recommended dimensions**: 1920x1080 or higher (16:9 aspect ratio)
- **Maximum file size**: 5MB per image
- **Number of images**: Currently configured for 4 screenshots

## How to Add More Screenshots

If you want to add more than 4 screenshots:

1. Add your images to this directory (e.g., `screenshot-5.png`, `screenshot-6.png`)
2. Update the `SCREENSHOTS` array in `/apps/web/components/hero-carousel.tsx`

Example:

```typescript
const SCREENSHOTS = [
  "/images/screenshots/screenshot-1.png",
  "/images/screenshots/screenshot-2.png",
  "/images/screenshots/screenshot-3.png",
  "/images/screenshots/screenshot-4.png",
  "/images/screenshots/screenshot-5.png", // Add new ones here
  "/images/screenshots/screenshot-6.png",
];
```

## Features

The hero carousel includes:

- Auto-rotation every 5 seconds
- Navigation arrows for manual control
- Dot indicators at the bottom
- Click on dots to jump to specific screenshots
- Smooth fade transitions between images
- Optimized image loading with Next.js Image component

## Testing

After adding your screenshots, run the development server to see them:

```bash
pnpm --filter web dev
```

Then visit http://localhost:3000 to view the homepage with your screenshots.
