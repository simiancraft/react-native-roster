# theme

Demo-only. This feature is about the color scheme; its one control is the toggle.

- `index.tsx`: `ThemeToggle`, the sun and moon button rendered once in the root layout
- `use-stored-scheme.ts`: NativeWind's `useColorScheme` plus the stored choice,
  restored once on mount
- `utils/storage.ts`: best-effort `localStorage` read and write; native has none

The library never reads the scheme; semantic tokens in `demo/global.css` swap on
the `dark` root class.
