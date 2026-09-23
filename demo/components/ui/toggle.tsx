import { Platform, Pressable, type PressableProps } from 'react-native';

type ToggleBaseProps = Omit<
  PressableProps,
  'accessibilityRole' | 'accessibilityState' | 'aria-checked' | 'aria-selected' | 'role'
>;

export type ToggleProps = ToggleBaseProps &
  (
    | {
        /** A persistent choice that can be independently pressed or unpressed. */
        mode: 'pressed';
        pressed: boolean;
      }
    | {
        /** One checked choice within an exclusive radio group. */
        mode: 'radio';
        checked: boolean;
      }
  );

/** A persistent pressed toggle or exclusive radio with matching web and native semantics. */
export function Toggle(props: ToggleProps) {
  if (props.mode === 'radio') {
    const { mode: _mode, checked, disabled, ...pressableProps } = props;
    if (Platform.OS === 'web') {
      return (
        <Pressable
          {...pressableProps}
          accessibilityRole="radio"
          aria-checked={checked}
          disabled={disabled}
        />
      );
    }
    return (
      <Pressable
        {...pressableProps}
        accessibilityRole="radio"
        accessibilityState={{ checked, disabled: disabled || undefined }}
        disabled={disabled}
      />
    );
  }

  const { mode: _mode, pressed, disabled, ...pressableProps } = props;
  if (Platform.OS === 'web') {
    const webState = { 'aria-pressed': pressed } as const;
    return (
      <Pressable {...pressableProps} {...webState} accessibilityRole="button" disabled={disabled} />
    );
  }
  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: pressed, disabled: disabled || undefined }}
      disabled={disabled}
    />
  );
}
