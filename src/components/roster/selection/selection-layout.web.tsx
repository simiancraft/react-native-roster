import { Anchor, Content, Portal, Root } from '@radix-ui/react-popover';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { SelectionLayoutProps } from './selection-layout.types';

/** Web selection presentation; Radix owns focus, outside press, Escape, and collisions. */
export function RosterSelectionPopover({
  anchorZone,
  contentZone,
  anchor,
  open,
  onDismiss,
  scroll,
}: SelectionLayoutProps) {
  return (
    <Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <View style={{ flex: 1 }}>
        {anchorZone}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, scroll.headerStyle]}>
          <Animated.View style={scroll.labelStyle}>
            <Anchor asChild>
              <div
                style={{
                  position: 'absolute',
                  left: anchor?.x ?? 0,
                  top: anchor ? anchor.y + anchor.height : 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
              />
            </Anchor>
          </Animated.View>
        </Animated.View>
      </View>
      <Portal>
        <Content
          sideOffset={4}
          align="start"
          updatePositionStrategy="always"
          aria-label="Interval details"
          style={{ zIndex: 1000 }}
        >
          {contentZone}
        </Content>
      </Portal>
    </Root>
  );
}
