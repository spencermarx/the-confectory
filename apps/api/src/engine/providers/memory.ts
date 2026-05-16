import type { ShellId } from '@confectory/shared';

// §7.1, §7.3: episodic memory. Vectors in Vectorize, source text in D1.
// Phase 1 ships the InProcessMemory provider as the default; production
// swaps to VectorizeMemory once the binding is configured.

export interface EpisodicMemory {
  id: string;
  guest_id: string;
  shell_id?: ShellId;
  summary: string;
  emotional_weight?: number;
  created_at: number;
}

export interface MemoryStoreRequest {
  guest_id: string;
  shell_id?: ShellId;
  summary: string;
  emotional_weight?: number;
}

export interface MemoryQuery {
  guest_id: string;
  /** Free-text query — the caller composes the current room+mood. */
  query: string;
  /** §7.3: top-3 most relevant by default. */
  top_k?: number;
}

export interface MemoryProvider {
  store(req: MemoryStoreRequest): Promise<EpisodicMemory>;
  retrieve(query: MemoryQuery): Promise<EpisodicMemory[]>;
}

// ---- Deterministic in-process implementation (dev + tests).
export class InProcessMemory implements MemoryProvider {
  private readonly store_ = new Map<string, EpisodicMemory[]>();
  private counter = 0;

  async store(req: MemoryStoreRequest): Promise<EpisodicMemory> {
    const memory: EpisodicMemory = {
      id: `mem-${++this.counter}`,
      guest_id: req.guest_id,
      ...(req.shell_id ? { shell_id: req.shell_id } : {}),
      summary: req.summary,
      ...(req.emotional_weight !== undefined ? { emotional_weight: req.emotional_weight } : {}),
      created_at: Date.now(),
    };
    const list = this.store_.get(req.guest_id) ?? [];
    list.push(memory);
    this.store_.set(req.guest_id, list);
    return memory;
  }

  async retrieve(query: MemoryQuery): Promise<EpisodicMemory[]> {
    const list = this.store_.get(query.guest_id) ?? [];
    const ranked = list
      .map((m) => ({ memory: m, score: textOverlap(m.summary, query.query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, query.top_k ?? 3)
      .map((x) => x.memory);
    return ranked;
  }
}

function textOverlap(a: string, b: string): number {
  const tokens = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let n = 0;
  for (const t of A) if (B.has(t)) n++;
  return n / Math.max(A.size, B.size);
}

// ---- Vectorize + embedder implementation (production).

interface EmbedderRunner {
  // Workers AI returns { data: number[][] } for embedding models.
  run(model: string, args: { text: string | string[] }): Promise<{ data: number[][] }>;
}

interface VectorizeNamespace {
  insert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<{ count: number }>;
  query(
    vector: number[],
    options: { topK: number; filter?: Record<string, unknown> },
  ): Promise<{ matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }> }>;
}

const EMBEDDING_MODEL = '@cf/baai/bge-large-en-v1.5';

export class VectorizeMemory implements MemoryProvider {
  constructor(
    private readonly vectors: VectorizeNamespace,
    private readonly embedder: EmbedderRunner,
    // §7.1: source text lives in D1; the caller injects a `writeText`
    // callback that persists there. This keeps the provider focused
    // on the vector half.
    private readonly persistText: (memory: EpisodicMemory) => Promise<void>,
    private readonly readText: (ids: string[]) => Promise<Map<string, EpisodicMemory>>,
  ) {}

  async store(req: MemoryStoreRequest): Promise<EpisodicMemory> {
    const id = crypto.randomUUID();
    const memory: EpisodicMemory = {
      id,
      guest_id: req.guest_id,
      ...(req.shell_id ? { shell_id: req.shell_id } : {}),
      summary: req.summary,
      ...(req.emotional_weight !== undefined ? { emotional_weight: req.emotional_weight } : {}),
      created_at: Date.now(),
    };
    const [embedding] = (await this.embedder.run(EMBEDDING_MODEL, { text: req.summary })).data;
    if (!embedding) throw new Error('embedding_failed');
    await this.vectors.insert([
      {
        id,
        values: embedding,
        metadata: { guest_id: req.guest_id, shell_id: req.shell_id ?? null },
      },
    ]);
    await this.persistText(memory);
    return memory;
  }

  async retrieve(query: MemoryQuery): Promise<EpisodicMemory[]> {
    const [embedding] = (await this.embedder.run(EMBEDDING_MODEL, { text: query.query })).data;
    if (!embedding) return [];
    const { matches } = await this.vectors.query(embedding, {
      topK: query.top_k ?? 3,
      filter: { guest_id: query.guest_id },
    });
    const byId = await this.readText(matches.map((m) => m.id));
    const out: EpisodicMemory[] = [];
    for (const match of matches) {
      const memory = byId.get(match.id);
      if (memory) out.push(memory);
    }
    return out;
  }
}
