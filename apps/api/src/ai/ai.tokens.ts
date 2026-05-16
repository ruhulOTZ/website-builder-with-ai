// Token for injecting the AIProvider interface (not a concrete class) so
// future providers (Anthropic, OpenRouter) can be swapped in via the
// AiModule factory without changes at injection sites.
export const AI_PROVIDER = Symbol('AI_PROVIDER');
