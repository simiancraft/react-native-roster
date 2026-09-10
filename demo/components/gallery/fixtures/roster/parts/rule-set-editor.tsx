import { Pressable, Text, TextInput, View } from 'react-native';
import type { ExpandResult } from 'react-native-roster/rrule';
import type { useRuleSetDraft } from '../use-rule-set-draft';

export function RuleSetEditor({
  draft,
  onApply,
  result,
}: {
  draft: ReturnType<typeof useRuleSetDraft>;
  onApply: () => void;
  result: ExpandResult;
}) {
  const message = draft.parsed.status === 'invalid' ? draft.parsed.message : draft.message;
  return (
    <View className="flex-1 gap-2 min-h-[280px]">
      <Text accessibilityRole="header" className="font-semibold text-foreground">
        Rule set (JSON)
      </Text>
      <TextInput
        accessibilityLabel="Rule set JSON"
        multiline
        value={draft.text}
        onChangeText={draft.setText}
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 min-h-[120px] rounded-md border border-border bg-card p-2 font-mono text-xs text-foreground"
        style={{ textAlignVertical: 'top' }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onApply}
        className="self-start rounded-md border border-primary bg-primary/15 px-3 py-2 active:bg-accent"
      >
        <Text className="text-xs text-foreground">Apply rule set</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" className="text-xs text-muted-foreground">
        {message}
      </Text>
      <Text selectable className="font-mono text-xs text-muted-foreground">
        {JSON.stringify({ complete: result.complete, truncated: result.truncated })}
      </Text>
    </View>
  );
}
