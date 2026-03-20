# Custom Preset Profile Pictures (Your Upload Folder)

Use this folder for your own curated preset profile pictures.

## Where to put files

- `client/public/profile-pictures/presets-custom/operators/`
- `client/public/profile-pictures/presets-custom/masks/`
- `client/public/profile-pictures/presets-custom/emblems/`
- `client/public/profile-pictures/presets-custom/abstract/`
- `client/public/profile-pictures/presets-custom/nature/`
- `client/public/profile-pictures/presets-custom/gear/`
- `client/public/profile-pictures/presets-custom/rank/`

## Recommended file rules

- Prefer `.webp` or `.png`
- Square ratio (e.g. 512x512)
- Keep each image under ~500KB when possible
- Use lowercase kebab-case names (example: `raven-mark-01.webp`)

## How to make new files selectable in UI

After adding files, add entries to:

- `client/src/constants/presetProfilePictures.js`

Each entry needs:
- `id`
- `label`
- `category`
- `src` (example: `/profile-pictures/presets-custom/emblems/raven-mark-01.webp`)
