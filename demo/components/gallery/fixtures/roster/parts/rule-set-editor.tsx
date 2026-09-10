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
    <View style={{ flex: 1, gap: 8, minHeight: 280 }}>
      <Text accessibilityRole="header" style={{ fontWeight: '600' }}>
        Rule set (JSON)
      </Text>
      <TextInput
        accessibilityLabel="Rule set JSON"
        multiline
        value={draft.text}
        onChangeText={draft.setText}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          flex: 1,
          minHeight: 120,
          backgroundColor: '#fff',
          padding: 8,
          fontFamily: 'monospace',
          fontSize: 12,
          textAlignVertical: 'top',
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onApply}
        style={{ padding: 8, backgroundColor: '#c7d2fe', borderRadius: 6 }}
      >
        <Text>Apply rule set</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={{ fontSize: 12 }}>
        {message}
      </Text>
      <Text selectable style={{ fontSize: 12 }}>
        {JSON.stringify({ complete: result.complete, truncated: result.truncated })}
      </Text>
    </View>
  );
}
