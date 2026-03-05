# Homepage Auto Banner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the homepage into a two-column layout where the left controls stay unchanged and the right panel becomes a fixed-height automatic pair banner before upload and a preview stage after upload.

**Architecture:** Keep the existing home route and AppContext flow intact. Implement the feature with a lightweight autoplay timer in `app/page.tsx`, reuse the existing upload component, and keep the right-side UI image-only with no visible controls or explanatory copy. Each banner frame should render two images side by side inside one shared stage, with the original image on the left and the designed image on the right.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Replace scene switching with an autoplay pair-banner model

**Files:**
- Modify: `app/page.tsx`

**Step 1: Remove scene button state**

Delete:

- `activeSceneId`
- `setActiveSceneId`
- any button-driven `activeScene` selection logic

**Step 2: Introduce pair-banner image data**

Define two data sources:

```ts
const HOME_BANNER_GROUPS = [
  { original: '/home-banner/original-01.jpg', designed: '/home-banner/designed-01.jpg' },
];
const FALLBACK_BANNER_SLIDES = [...];
```

Rules:

- if `HOME_BANNER_GROUPS.length > 0`, use those image pairs
- otherwise use fallback generated slides

**Step 3: Add banner index state**

```ts
const [bannerIndex, setBannerIndex] = useState(0);
```

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: replace homepage scene switching with banner model"
```

### Task 2: Implement the autoplay logic

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add a timer effect**

Use `useEffect` to autoplay only when:

- user has not uploaded an image
- banner count is greater than 1

Implementation shape:

```ts
useEffect(() => {
  if (imagePreview || bannerCount <= 1) return;
  const timer = window.setInterval(() => {
    setBannerIndex((prev) => (prev + 1) % bannerCount);
  }, 4000);
  return () => window.clearInterval(timer);
}, [imagePreview, bannerCount]);
```

**Step 2: Reset banner index safely when data source changes**

Clamp or reset the index so it never exceeds the current banner count.

**Step 3: Ensure uploaded state disables autoplay**

No hidden animation should continue once `imagePreview` exists.

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add homepage autoplay banner behavior"
```

### Task 3: Rebuild the right-side stage as image-only pairs

**Files:**
- Modify: `app/page.tsx`

**Step 1: Remove the right-side buttons and explanatory text**

Delete:

- scene buttons
- labels
- stage copy
- any visible scene metadata

**Step 2: Keep one single full-height stage card**

Render:

- `!imagePreview`: one current banner pair
- `imagePreview`: one preview image

**Step 3: Keep the stage large**

The image area should occupy nearly the full right-side card height and width, with minimal chrome. The original image should stay on the left and the designed image should stay on the right, but both should live inside one unified frame rather than two separate cards.

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: simplify homepage right stage to pure image display"
```

### Task 4: Preserve equal-height layout with the left upload column

**Files:**
- Modify: `components/ImageUpload.tsx`
- Modify: `app/page.tsx`

**Step 1: Keep `className` support in `ImageUpload`**

Ensure the root card still accepts and merges external class names.

**Step 2: Keep desktop equal-height shell**

Use:

```tsx
<div className="grid gap-6 xl:h-[calc(100vh-11.5rem)] xl:grid-cols-[320px_minmax(0,1fr)]">
```

and:

```tsx
className="xl:h-full xl:aspect-auto"
```

for the upload card.

**Step 3: Commit**

```bash
git add app/page.tsx components/ImageUpload.tsx
git commit -m "feat: preserve equal-height homepage columns"
```

### Task 5: Verify the homepage flow

**Files:**
- Modify: none

**Step 1: Run lint and typecheck**

Run:

```bash
npm run test
```

Expected:

- no errors
- warnings allowed if they already exist elsewhere

**Step 2: Run production build**

Run:

```bash
npm run build
```

Expected:

- build succeeds
- `/` route is emitted successfully

**Step 3: Start local server for manual check**

Run:

```bash
npm start -- --hostname 127.0.0.1 --port 3000
```

Expected:

- local server starts on `http://127.0.0.1:3000`

**Step 4: Manual acceptance checklist**

- verify left modules remain unchanged
- verify right side shows original/designed pair autoplay before upload
- verify no buttons, arrows, dots, or explanation copy appear on the right
- verify upload switches right side into preview mode
- verify desktop columns have matched height

**Step 5: Commit**

```bash
git add app/page.tsx components/ImageUpload.tsx
git commit -m "test: verify homepage autoplay pair banner flow"
```
