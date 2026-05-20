import type { StoryMediaType } from "@/lib/storiesStorage";

export type PendingStoryDraft = {
  uri: string;
  mediaType: StoryMediaType;
  mimeType?: string;
};

let draft: PendingStoryDraft | null = null;

export function setPendingStoryDraft(next: PendingStoryDraft): void {
  draft = next;
}

/** Tek kullanımlık; açıklama ekranı mount olunca çağrılır. */
export function takePendingStoryDraft(): PendingStoryDraft | null {
  const current = draft;
  draft = null;
  return current;
}
