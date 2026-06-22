import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { Brand } from "@/constants/theme";

import { useSpotlight, useSpotlightSlot } from "./animations/spotlight";

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
 * Inside a SpotlightProvider, focusing the field activates its enclosing
 * SpotlightSlot so the slot lifts above the blur scrim and stays sharp while the
 * rest of the step blurs (TASK.md §2). No-op outside a provider/slot.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, message, invalid, className, onFocus, onBlur, ...rest }, ref) {
    const spotlight = useSpotlight();
    const slot = useSpotlightSlot();

    return (
      <View className="gap-2">
        {label ? <Text className="prose-label">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.fog}
          onFocus={(e) => {
            if (spotlight && slot !== null) spotlight.focusSlot(slot);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            if (spotlight && slot !== null) spotlight.blurSlot(slot);
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
