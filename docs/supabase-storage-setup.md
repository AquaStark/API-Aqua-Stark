# Supabase Storage Setup

Storage bucket configuration for game assets.

## Buckets

4 public buckets are created for reading:

- `fish` - Fish sprites
- `tanks` - Tank sprites
- `decorations` - Decoration sprites
- `avatars` - Player avatars

## Naming Conventions

- Fish: `fish-{id}.png`
- Tanks: `tank-{id}.png`
- Decorations: `decoration-{id}.png`
- Avatars: `avatar-{player_address}.png`

## Access

- **Read**: Public (accessible from Unity client)
- **Write**: Authenticated users only

## Public URLs

```
https://{supabase-url}/storage/v1/object/public/{bucket}/{filename}
```

Example:
```
https://momjlqhhapbaigjwociq.supabase.co/storage/v1/object/public/fish/fish-1.png
```

## Apply Migration

```bash
npx supabase db push
```
