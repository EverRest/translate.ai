/** Detect model outputs that are tool-call JSON or internal meta, not translations. */

const INTERNAL_TOOL_NAMES = [
  'check_availability',
  'suggest_slots',
  'search_knowledge_base',
  'create_booking',
  'escalate_to_owner',
  'list_customer_bookings',
  'cancel_booking',
  'reschedule_booking',
] as const;

export function extractToolCallJson(content: string): string | null {
  const trimmed = content.trim();

  if (pregMatchToolFence(trimmed)) {
    return pregMatchToolFence(trimmed);
  }

  if (trimmed.startsWith('{')) {
    return balancedJsonObject(trimmed) ?? trimmed;
  }

  const toolStart = trimmed.search(/\{"tool"\s*:\s*"[^"]+"/);
  if (toolStart === -1) {
    return null;
  }

  return balancedJsonObject(trimmed.slice(toolStart));
}

export function isToolCallJson(content: string): boolean {
  const json = extractToolCallJson(content);
  if (json === null) {
    return false;
  }

  try {
    const decoded = JSON.parse(json) as unknown;
    return (
      typeof decoded === 'object' &&
      decoded !== null &&
      'tool' in decoded &&
      typeof (decoded as { tool?: unknown }).tool === 'string'
    );
  } catch {
    return false;
  }
}

export function looksLikeInternalMetaLeak(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  if (normalized === '') {
    return false;
  }

  if (isToolCallJson(content)) {
    return true;
  }

  for (const tool of INTERNAL_TOOL_NAMES) {
    if (normalized.includes(tool)) {
      return true;
    }
  }

  if (/^(?:let me |i will |i'll )?check\s+(?:ai\s+)?availab/i.test(content)) {
    return true;
  }

  if (
    /^check\s+(?:ai\s+)?availab/i.test(content) &&
    content.trim().length < 80
  ) {
    return true;
  }

  return false;
}

function pregMatchToolFence(content: string): string | null {
  const match = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  return match?.[1]?.trim() ?? null;
}

function balancedJsonObject(content: string | null | undefined): string | null {
  if (!content || content[0] !== '{') {
    return null;
  }

  let depth = 0;
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '{') {
      depth += 1;
    } else if (content[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(0, i + 1);
      }
    }
  }

  return null;
}
