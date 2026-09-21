export type GlyphName = 'github' | 'x' | 'kofi' | 'simiancraft';

export type GlyphProps = {
  /** Which mark to draw. */
  name: GlyphName;
  /** Edge length in pixels. */
  size?: number;
};
