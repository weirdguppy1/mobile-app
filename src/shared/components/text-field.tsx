import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { Brand } from "@/constants/theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Validation/help message shown under the field. Red when `invalid`. */
  message?: string;
  invalid?: boolean;
}

/**
 * Monochrome form input per DESIGN.md: silver hairline border, 8px radius, label
 * above in graphite, ink border on focus (no colored ring).
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, message, invalid, className, ...rest }, ref) {
    return (
      <View className="gap-2">
        {label ? <Text className="prose-label">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.fog}
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
