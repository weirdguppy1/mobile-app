import { forwardRef, useId, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { Brand } from "@/constants/theme";

import { useSpotlight } from "./animations/spotlight";

interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Validation/help message shown under the field. Red when `invalid`. */
  message?: string;
  invalid?: boolean;
}

/**
 * Monochrome form input per DESIGN.md: silver hairline border, 8px radius, label
 * above in graphite, ink border on focus (no colored ring).
 *
 * When rendered inside a SpotlightProvider, focusing the field fades a blur
 * scrim over the rest of the step and elevates this field above it (TASK.md §2).
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, message, invalid, className, onFocus, onBlur, ...rest }, ref) {
    const spotlight = useSpotlight();
    const id = useId();
    const [focused, setFocused] = useState(false);

    return (
      <View className="gap-2" style={{ zIndex: focused ? 2 : 0 }}>
        {label ? <Text className="prose-label">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.fog}
          onFocus={(e) => {
            setFocused(true);
            spotlight?.focus(id);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            spotlight?.blur(id);
            onBlur?.(e);
          }}
          className={`field-input border-continuous  ${
            invalid ? "border-pass" : "border-silver focus:border-ink"
          } ${className ?? ""}`}
          {...rest}
        />
        {message ? (
          <Text
            className={`prose-footnote ${invalid ? "text-pass" : "text-slate"}`}
          >
            {message}
          </Text>
        ) : null}
      </View>
    );
  },
);
