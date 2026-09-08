import { useState } from 'react';
import type { Window } from 'react-native-roster/core';
import type { ExpandOptions, RuleSet } from 'react-native-roster/rrule';
import { expandRuleSet } from 'react-native-roster/rrule';

type ParseResult = { status: 'valid'; set: RuleSet } | { status: 'invalid'; message: string };

export function useRuleSetDraft(initial: RuleSet | undefined) {
  const [text, setText] = useState(JSON.stringify(initial ?? { rules: [], dates: [] }, null, 2));
  const [applied, setApplied] = useState(initial);
  const [message, setMessage] = useState(
    'Edit JSON, then apply. The roster shows the last applied rule set.',
  );
  const parsed = parseRuleSet(text);
  function apply(window: Window, options?: ExpandOptions) {
    if (parsed.status === 'invalid') return setMessage(parsed.message);
    const result = validateRuleSet(parsed.set, window, options);
    if (result !== null) return setMessage(result);
    setApplied(parsed.set);
    setMessage('Rule set applied.');
  }
  return { text, setText, parsed, applied, message, apply };
}

function parseRuleSet(text: string): ParseResult {
  try {
    const set = JSON.parse(text);
    if (!set || !Array.isArray(set.rules) || !Array.isArray(set.dates)) {
      return { status: 'invalid', message: 'Provide an object with rules and dates arrays.' };
    }
    return { status: 'valid', set };
  } catch (error) {
    return { status: 'invalid', message: String(error) };
  }
}

function validateRuleSet(set: RuleSet, window: Window, options?: ExpandOptions): string | null {
  try {
    expandRuleSet(set, window, options);
    return null;
  } catch (error) {
    return String(error);
  }
}
