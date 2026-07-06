# Settings (frontend)

`SettingsPage.tsx` reads/writes the single `UserPreference` record via `settingsApi.ts`. No
`use*.ts` hook here (unlike other domains) since this page is the only consumer — if a second
consumer appears, promote the inline `useQuery`/`useMutation` calls into a `useSettings.ts` hook
to match the rest of the app's convention.

The "Danger zone" card's "Delete all data" button requires an inline confirm step before calling
`settingsApi.purgeAllData()` (`POST /api/settings/purge-all-data`), then reloads the page on
success — the simplest way to guarantee every page's cached data reflects the now-empty state.
