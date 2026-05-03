/** Örnek Reels / hikaye verisi — tam ekran oynatma için HTTPS video URL’leri */
export type StoryItem = {
  id: string;
  username: string;
  /** Avatar yerine gösterilen baş harf(ler) */
  initial: string;
  videoUri: string;
};

export const SAMPLE_STORY_REELS: StoryItem[] = [
  {
    id: "st1",
    username: "Selin Y.",
    initial: "S",
    videoUri: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-with-waves-1178-large.mp4",
  },
  {
    id: "st2",
    username: "Emre K.",
    initial: "E",
    videoUri: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
  },
  {
    id: "st3",
    username: "Ayşe D.",
    initial: "A",
    videoUri: "https://assets.mixkit.co/videos/preview/mixkit-sunset-over-the-sea-1188-large.mp4",
  },
  {
    id: "st4",
    username: "Sağlıklı",
    initial: "SM",
    videoUri: "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-a-beach-with-waves-1175-large.mp4",
  },
  {
    id: "st5",
    username: "Topluluk",
    initial: "T",
    videoUri: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4",
  },
];
