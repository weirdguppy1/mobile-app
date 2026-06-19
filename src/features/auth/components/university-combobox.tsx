import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { Brand } from "@/constants/theme";
import { filterUniversities } from "@/features/auth/data/universities";
import { TextField } from "@/shared/components";

interface UniversityComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * A type-to-filter dropdown for picking a university. Selecting a row commits a
 * value; if a student's school isn't in the curated list, the bottom row lets
 * them commit whatever they typed as free text.
 */
export function UniversityCombobox({
  value,
  onChange,
}: UniversityComboboxProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => filterUniversities(query), [query]);
  const trimmed = query.trim();
  const hasExactMatch = results.some(
    (u) => u.name.toLowerCase() === trimmed.toLowerCase(),
  );

  const commit = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  return (
    <View className="z-10 gap-2">
      <Text className="prose-label">Where do you go to school?</Text>

      <View className="justify-center">
        <TextField
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setOpen(true);
            if (value) onChange(null);
          }}
        />
        {value ? (
          <Text className="absolute right-4 text-base text-ink">✓</Text>
        ) : null}
      </View>

      {open ? (
        <View className="dropdown border-continuous top-21 z-20 shadow-card">
          <FlatList
            data={results}
            keyExtractor={(u) => u.domain}
            keyboardShouldPersistTaps="handled"
            className="grow-0"
            ListEmptyComponent={
              trimmed ? null : (
                <Text className="prose-footnote p-4 text-slate">
                  Start typing to search…
                </Text>
              )
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => commit(item.name)}
                className="gap-0.5 border-b border-b-hairline px-4 py-3 active:bg-wash"
              >
                <Text className="prose-body font-semibold text-ink" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="prose-caption text-ash">{item.domain}</Text>
              </Pressable>
            )}
          />

          {trimmed && !hasExactMatch ? (
            <Pressable
              onPress={() => commit(trimmed)}
              className="px-4 py-3 active:bg-wash"
            >
              <Text className="prose-body font-semibold text-ink" numberOfLines={1}>
                My school isn&apos;t listed - use &ldquo;{trimmed}&rdquo;
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
