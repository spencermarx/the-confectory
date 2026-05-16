import { characterRegistry, founder, getSetPiece } from '@confectory/characters';
import type { OompaLoompaId, SetPieceId, ShellId } from '@confectory/shared';
import { getFallback } from '@confectory/shells';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { type DialogueContext, generateOompaLoompaLine } from '../engine/dialogue.ts';
import { AcceptingCritic, InProcessFoundry } from '../engine/providers/in-process.ts';
import type { Env } from '../env.ts';
import { getNameRegistry, getShell } from '../shells.ts';

const GUEST_COOKIE = 'confectory_guest';

export const dialogueRoutes = new Hono<{ Bindings: Env }>();

interface OompaLoompaDialogueRequest {
  character_id: OompaLoompaId;
  shell_id: ShellId;
  prompt_hint?: string;
}

// §11.2: text-first dialogue. The TTS render is fire-and-forget against
// ElevenLabs and cached by line hash (§11.2); the client receives the
// text immediately and the audio URL when it lands.
dialogueRoutes.post('/oompa-loompa', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const body = (await c.req.json()) as OompaLoompaDialogueRequest;
  const character = characterRegistry.get(body.character_id);
  if (!character) return c.json({ error: 'unknown_character' }, 404);
  const shell = getShell(body.shell_id);
  if (!shell) return c.json({ error: 'unknown_shell' }, 404);

  // §3.2: factory mood for the prompt context.
  const factoryStub = c.env.FACTORY_STATE.get(c.env.FACTORY_STATE.idFromName('global'));
  const moodRes = await factoryStub.fetch('https://do/mood');
  const factoryMood = (await moodRes.json()) as DialogueContext['mood'];

  // §7.3: pull guest's structural memory from the DO. Episodic memory
  // retrieval (Vectorize) lands in week 11-13.
  const guestStub = c.env.GUEST_SESSION.get(c.env.GUEST_SESSION.idFromName(guestId));
  const stateRes = await guestStub.fetch('https://do/state');
  const guest = (await stateRes.json()) as {
    consequences: { type: string }[];
    factory_opinion: number;
    visited_shell_ids: string[];
  };

  const canonicalNames = Object.values(getNameRegistry());
  const fallback = getFallback(shell.authored_fallback);
  const fallbackLine = fallback?.dialogue_lines[0];

  const ctx: DialogueContext = {
    character,
    shell_id: shell.id,
    shell_name: shell.name,
    mood: factoryMood,
    canonical_room_names: canonicalNames,
    consequences: guest.consequences.map((c) => c.type),
    factory_opinion: guest.factory_opinion,
    visit_count: guest.visited_shell_ids.length,
    episodic_memories: [],
    ...(body.prompt_hint ? { prompt_hint: body.prompt_hint } : {}),
  };

  // Phase 1 uses the in-process providers; production wires WorkersAI.
  const result = await generateOompaLoompaLine(
    new InProcessFoundry(),
    new AcceptingCritic(),
    ctx,
    fallbackLine ? { fallback_line: fallbackLine } : {},
  );

  return c.json({
    text: result.text,
    voice_id: character.voice_id,
    served_from_fallback: result.served_from_fallback,
    // Phase 1 returns the text; the TTS render is scheduled async by
    // the Worker queue (BACKGROUND) and the client polls for audio.
  });
});

interface SetPieceRequest {
  set_piece_id: SetPieceId;
}

// §11.1: pre-rendered set-pieces. Lowest latency, highest quality.
// The Worker returns the beat list (text + audio URLs) and the client
// plays them in sequence, respecting cues.
dialogueRoutes.post('/founder/set-piece', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const body = (await c.req.json()) as SetPieceRequest;
  const piece = getSetPiece(body.set_piece_id);
  if (!piece) return c.json({ error: 'unknown_set_piece' }, 404);
  // Confirm this set-piece is part of the Founder's repertoire.
  if (!founder.set_pieces.some((sp) => sp.id === piece.id)) {
    return c.json({ error: 'not_founder_set_piece' }, 404);
  }

  return c.json({
    set_piece_id: piece.id,
    shell_id: piece.shell_id,
    voice_id: founder.voice_id,
    beats: piece.beats,
  });
});

// §11.1, §21.4: the Founder's interactive mode is gated to one Phase 1
// scene (the Foundry Door). The Worker hands back a session token the
// client uses to open the WebRTC channel directly to Gemini Live.
// Phase 1 of the API returns 503 until the Live provider is wired; the
// client falls back to the set-piece library per §19.1.
dialogueRoutes.post('/founder/interactive', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const body = (await c.req.json()) as { shell_id?: ShellId };
  if (body.shell_id !== 'the-foundry-door') {
    return c.json({ error: 'interactive_not_available_in_this_room' }, 403);
  }

  // Phase 1: provider is not yet wired. Return service-unavailable so
  // the client falls through to the set-piece library (§19.1).
  return c.json({ error: 'voice_provider_not_configured' }, 503);
});
