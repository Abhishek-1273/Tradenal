export interface TradeNotes {
  keyTakeaway: string;
  whatWentWell: string;
  whatToImprove: string;
}

/**
 * Serializes the structured notes into a rich Markdown string for backward compatibility
 */
export function serializeTradeNotes(
  notes: Partial<TradeNotes>,
  rawNotes?: string
): string {
  const parts: string[] = [];

  if (notes.keyTakeaway?.trim()) {
    parts.push(`### 💡 Key Market Takeaway\n${notes.keyTakeaway.trim()}`);
  }

  if (notes.whatWentWell?.trim()) {
    parts.push(`### ✅ What Went Well (Execution / Mindset)\n${notes.whatWentWell.trim()}`);
  }

  if (notes.whatToImprove?.trim()) {
    parts.push(`### 🎯 What to Improve (Adjustment)\n${notes.whatToImprove.trim()}`);
  }

  // Include any extra unstructured notes if provided and not already included
  if (rawNotes?.trim()) {
    const isAlreadyIncluded = parts.some((p) => p.includes(rawNotes.trim()));
    if (!isAlreadyIncluded) {
      parts.push(`### 📝 Additional Notes\n${rawNotes.trim()}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Parses existing trade notes (markdown or plain text) into structured TradeNotes fields
 */
export function parseTradeNotes(rawNotes?: string): TradeNotes {
  if (!rawNotes || !rawNotes.trim()) {
    return { keyTakeaway: '', whatWentWell: '', whatToImprove: '' };
  }

  const takeawayMatch = rawNotes.match(/### 💡 Key Market Takeaway\s*\n([\s\S]*?)(?=\n### |$)/i);
  const wellMatch = rawNotes.match(/### ✅ What Went Well[^\n]*\s*\n([\s\S]*?)(?=\n### |$)/i);
  const improveMatch = rawNotes.match(/### 🎯 What to Improve[^\n]*\s*\n([\s\S]*?)(?=\n### |$)/i);

  if (takeawayMatch || wellMatch || improveMatch) {
    return {
      keyTakeaway: takeawayMatch ? takeawayMatch[1].trim() : '',
      whatWentWell: wellMatch ? wellMatch[1].trim() : '',
      whatToImprove: improveMatch ? improveMatch[1].trim() : '',
    };
  }

  // If no structured headers match, treat the entire string as keyTakeaway
  return {
    keyTakeaway: rawNotes.trim(),
    whatWentWell: '',
    whatToImprove: '',
  };
}
