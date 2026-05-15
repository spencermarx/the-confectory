// §12.3: machine-readable counterpart to the Recipe Book's style guide.
// Used to compose image prompts and validate Critic decisions.

export interface ColorPalette {
  primary: string[];
  accent: string[];
  shadow: string[];
}

export interface StyleGuide {
  version: string;
  palette_per_mood: Record<string, ColorPalette>;
  forbidden_styles: string[];
  approved_references: string[];
  surface_default_prompt_suffix: string;
}

export const phase1StyleGuide: StyleGuide = {
  version: '0.1.0',
  palette_per_mood: {
    whimsy: {
      primary: ['#f6c97f', '#e8a87c', '#c38d9e'],
      accent: ['#85cdca', '#e27d60'],
      shadow: ['#3a2a1c', '#1a1410'],
    },
    menace: {
      primary: ['#2a1f17', '#5a3a2a', '#7a4a3a'],
      accent: ['#a01010', '#3a1010'],
      shadow: ['#000000', '#0a0a0a'],
    },
    indulgence: {
      primary: ['#f4a460', '#cd853f', '#d2691e'],
      accent: ['#ffe4b5', '#deb887'],
      shadow: ['#2f1b0d', '#4a2c19'],
    },
  },
  forbidden_styles: [
    'photorealism',
    'AI-cliché aesthetics',
    'plastic-looking surfaces',
    'overly saturated',
    'generic fantasy',
  ],
  approved_references: [
    'hand-painted watercolor',
    'soft cel-shading with painterly outlines',
    'subtle paper grain',
    'warm low-key lighting',
  ],
  surface_default_prompt_suffix:
    'rendered as hand-painted watercolor, soft cel-shaded outlines, paper-grain background, warm muted palette, no photorealism, no plastic surfaces.',
};
