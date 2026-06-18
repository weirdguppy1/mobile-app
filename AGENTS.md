# CLAUDE.md

Production-grade mobile app: React Native + Expo, TypeScript, Supabase, Expo Router.

**Stack:** Expo SDK (latest stable) · React Native · Expo Router · TypeScript · Uniwind · React Native Reusables · React Native Reanimated (for animations) · Supabase (for auth / ) · TanStack Query · Zustand · Zod · React Hook Form · Sentry (not in development do in production)

**Priorities, in order:** type safety → readability → maintainability → performance. When solutions conflict, pick the simplest production-ready one. Avoid overengineering.

**Application:** you are going to build a Tinder-style mobile app that helps college students (incoming freshman, sophomores, etc.) find their perfect roommate, targeted towards Gen Z students. See DESIGN.md for design specifications.

---

## Architecture

Feature-based achitecture example. 

src/
  app/
    dev/
  features/
    auth/
      screens/
      components/
      hooks/
      api.ts
      types.ts

    home/
      screens/
      components/
      hooks/
      api.ts

    profile/
      screens/
      components/ 
  shared/
    components/
    hooks/
    utils/
    types/
    lib/     

shared/ (cross-feature reuse)

The shared directory contains reusable code that is not tied to any single feature.
This includes generic UI components (from react-native-reuseables) like buttons, inputs, and avatars, as well as reusable hooks like debouncing utilities, helper functions, and global types.

A rule of thumb is: if something is used across multiple features and is not domain-specific, it belongs in shared.
If removing a feature breaks something in shared, it likely does not belong there.

lib/ (external integrations)

The lib folder contains all external system setup and integrations. This includes API clients, Firebase setup, database connections, and any third-party SDK configuration.

This layer is responsible for communication with external services, not application logic.

##!IMPORTANT

I want to implement an internal in-app development playground (similar to Storybook but inside the app).

Requirements:
Create a /app/dev route group that is ONLY accessible in development mode.
Use Expo Router file-based routing.
Folder structure to add:
app/dev/index.tsx → Dev home menu
app/dev/components.tsx → component playground organized my category. 
app/dev/screens.tsx → screen previews

Must update this dev route when new components or screens are created, and delete as well (vice versa). 

---

## TypeScript

- Always TypeScript. Never `any`, never `@ts-ignore`.
- Use explicit `interface` for object shapes; let return types infer unless exporting a public API.
- Validate all external input (network, storage, deep links, env) with Zod and infer types from the schema.

```ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
})

export type User = z.infer<typeof UserSchema>
```

---

## Navigation — Expo Router

File-based routing. Use route groups for auth gating.

```
app/
├── _layout.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── sign-up.tsx
└── (protected)/
    ├── _layout.tsx
    └── (tabs)/
        ├── index.tsx
        └── profile.tsx
        └── (protected)/
```

Gate routes declaratively with `Stack.Protected` driven by the auth store — not with imperative redirects scattered across screens.

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'

export default function RootLayout() {
  const session = useAuthStore((s) => s.session)
  const hydrated = useAuthStore((s) => s.hydrated)

  if (!hydrated) return null // splash while session loads

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}
```

Don't hand-configure React Navigation unless you need something Expo Router can't express.

---

## Supabase

### Client

One client, in `src/lib/supabase.ts`. Persist sessions in **Expo SecureStore** via a storage adapter.

```ts
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto'
import * as SecureStore from 'expo-secure-store'
import { createClient, processLock } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
)
```

### Database

- **RLS on every table.** No exceptions. Assume all client code is public.
- Generate types with `supabase gen types typescript` into `src/types/database.ts` and pass them as the `createClient` generic.
- Always handle the `error` returned from Supabase queries — never ignore it.

### Authentication

- Supabase Auth only. No second auth system.
- Auth UI state lives in Zustand; user/profile data is fetched with TanStack Query.
- Subscribe to `supabase.auth.onAuthStateChange` once at app root and push the session into the auth store.

---

## State Management

Two tools, non-overlapping responsibilities.

### TanStack Query — server state

Use for everything that comes from Supabase or any API. Never cache server data in Zustand.

```ts
// src/features/profile/use-profile.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
```

Mutations use `useMutation` and invalidate the relevant query keys on success.

### Zustand — client state only

Reserved for: theme, auth session/UI state, onboarding progress, transient UI state. That's it.

```ts
// src/store/auth-store.ts
import { Session } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthState {
  session: Session | null
  hydrated: boolean
  setSession: (session: Session | null) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  setSession: (session) => set({ session }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
```

**Decision rule:** if the value originates on a server, it's TanStack Query. If it only exists on the device, it's Zustand (or local component state if it doesn't need to be shared).

---

## Styling — Uniwind + React Native Reusables

Utility classes inline. Prefer existing React Native Reusables primitives over building new ones.

```tsx
<View className="flex-1 items-center justify-center bg-background px-4">
  <Text className="text-2xl font-semibold text-foreground">Welcome</Text>
</View>
```

Use `StyleSheet.create` only when (a) a measurable perf issue demands it, or (b) a third-party library requires a style object.

---

## Forms — React Hook Form + Zod

No bespoke form state. Always RHF + `zodResolver`.

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
type SignInValues = z.infer<typeof SignInSchema>

export function SignInForm() {
  const { control, handleSubmit, formState } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
  })
  // ...
}
```

---

## Error Handling & Observability

Never silently fail. Every async path handles:

1. **Loading** — render a skeleton or spinner.
2. **Empty** — render an empty state, not a blank screen.
3. **Error** — render a recoverable error UI and report to Sentry.

```ts
import * as Sentry from '@sentry/react-native'

try {
  await doThing()
} catch (error) {
  Sentry.captureException(error)
  throw error // let TanStack Query / the caller see it too
}
```

Initialize Sentry once in `src/lib/sentry.ts` and import it from the root layout.

---

## Performance

Defaults that are cheap and worth doing:

- `FlatList` (or `FlashList`) for any list with >20 items or unknown size.
- TanStack Query's caching — set sensible `staleTime` values rather than refetching everything on mount.
- Optimized images via `expo-image`.

Apply `React.memo`, `useMemo`, `useCallback` only with a measured reason. Profile before optimizing.

---

## File Naming

| Kind | Convention | Example |
|---|---|---|
| Component | PascalCase | `UserCard.tsx`, `ProfileHeader.tsx` |
| Hook | camelCase | `useAuth.ts`, `useProfile.ts` |
| Store | kebab-case | `auth-store.ts` |
| Utility | kebab-case | `format-date.ts` |
| Route file | Expo Router conventions | `sign-in.tsx`, `_layout.tsx` |

---

## Imports

Order, separated by blank lines:

1. React
2. React Native
3. Third-party libraries
4. Internal aliases (`@/...`)
5. Relative imports

Path aliases are required; avoid `../../../`.

```ts
import { useEffect } from 'react'
import { View } from 'react-native'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
```

Configured aliases: `@/components`, `@/features`, `@/hooks`, `@/lib`, `@/store`, `@/types`, `@/utils`.

---

## Code Style

- Explicit over clever. A junior should read it once and get it.
- Small, composable components. Each component does one thing.
- Don't reach for an abstraction until the second time you'd duplicate.
- Prefer early returns over nested conditionals.
- Comments explain *why*, not *what*.

---

## Git Rules

You are working in a Git-based codebase.

ABSOLUTE RULES:
1. NEVER commit directly to main.
2. ALWAYS create or use a feature branch for any change.
3. NEVER modify production branches (main/master) directly.
4. Assume multiple branches may modify the same files.

GIT WORKFLOW RULE:
- If starting new work → create feature branch from main or dev
- If continuing work → confirm current branch before making changes
- If uncertain → ask before proceeding

BRANCH NAMING:
- feature/...
- fix/...
- chore/...

MERGE SAFETY:
- Keep changes small and isolated
- Avoid touching unrelated files
- If multiple features touch same file, warn about possible merge conflicts

OUTPUT REQUIREMENT:
- At the start of every response, state:
  - current assumed branch
  - branch you are working on
- When changes are done:
  - explicitly say what branch to commit to
  - provide exact git commands

IMPORTANT:
Do not assume Git state. If not provided, default to:
feature/current-task-name