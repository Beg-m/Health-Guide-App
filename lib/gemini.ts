const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

export const GEMINI_SYSTEM_PROMPT =
  "Sen Health Guide App'in AI asistanısın. Kullanıcılara ilaçlar, dozaj, yan etkiler ve ilaç etkileşimleri hakkında Türkçe, sade ve anlaşılır bilgi veriyorsun. Her zaman 'Bu bilgiler genel niteliktedir, kesin tanı için doktora danışın' uyarısını ekle.";

export type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicMessageResponse {
  content?: AnthropicTextBlock[];
  error?: { type?: string; message?: string };
}

function contentsToAnthropicMessages(contents: GeminiContent[]): {
  role: "user" | "assistant";
  content: string;
}[] {
  return contents.map((c) => ({
    role: c.role === "model" ? "assistant" : "user",
    content: c.parts.map((p) => p.text).join("\n"),
  }));
}

function extractAssistantText(data: AnthropicMessageResponse): string {
  const blocks = data.content;
  if (!blocks?.length) return "";
  return blocks
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function generateGeminiReply(contents: GeminiContent[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "Anthropic API anahtarı bulunamadı. EXPO_PUBLIC_ANTHROPIC_API_KEY ortam değişkenini ayarlayın."
    );
  }

  const messages = contentsToAnthropicMessages(contents);
  if (messages.length === 0) {
    throw new Error("Gönderilecek mesaj yok.");
  }

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: GEMINI_SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = (await response.json()) as AnthropicMessageResponse;

  if (!response.ok) {
    const msg = data.error?.message ?? `İstek başarısız (${response.status})`;
    throw new Error(msg);
  }

  const text = extractAssistantText(data);
  if (!text) {
    throw new Error("Model yanıt üretemedi. Lütfen tekrar deneyin.");
  }

  return text;
}
