// §10.5: every prompt is a typed, versioned template.
export interface PromptTemplate<TInput> {
  readonly name: string;
  readonly version: number;
  render(input: TInput): RenderedPrompt;
}

export interface RenderedPrompt {
  system: string;
  user: string;
}

export interface PromptDefinition<TInput> {
  name: string;
  version: number;
  render(input: TInput): RenderedPrompt;
}

export function definePrompt<TInput>(def: PromptDefinition<TInput>): PromptTemplate<TInput> {
  return Object.freeze(def);
}
