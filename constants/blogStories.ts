/** Hikaye şeridi: her öğe bir kullanıcı (tek tam ekran hikâye) */
export type StoryItem = {
  id: string;
  username: string;
  /** Avatar içinde gösterilen baş harf(ler) */
  initial: string;
  /** Koyu gradient arka plan (üst → orta → alt) */
  gradientColors: [string, string, string];
  /** Örnek tarif ipucu veya kısa alıntı (Türkçe) */
  tip: string;
  /** Kullanıcı hikayesi: çekilen/seçilen medya */
  mediaUri?: string;
  mediaKind?: "image" | "video";
};

export const SAMPLE_STORY_REELS: StoryItem[] = [
  {
    id: "st1",
    username: "Selin Y.",
    initial: "S",
    gradientColors: ["#0f172a", "#1e3a5f", "#0c4a6e"],
    tip: "Çölyak dostu un karışımlarında ksantan gam sakın atlamayın; dokuyu bir arada tutar.",
  },
  {
    id: "st2",
    username: "Emre K.",
    initial: "E",
    gradientColors: ["#14532d", "#166534", "#052e16"],
    tip: "Diyabet için atıştırmalık: bir avuç çiğ badem + yeşil çay — glisemik yükü dengeler.",
  },
  {
    id: "st3",
    username: "Ayşe D.",
    initial: "A",
    gradientColors: ["#4c1d95", "#5b21b6", "#312e81"],
    tip: "Vegan krema yerine süzülmüş hindistan cevizi sütü + limon suyu ile ferah soslar yapın.",
  },
  {
    id: "st4",
    username: "Sağlıklı Mutfağım",
    initial: "SM",
    gradientColors: ["#713f12", "#92400e", "#451a03"],
    tip: "Glutensiz ekmekte oda sıcaklığındaki malzemeler daha iyi kabarır.",
  },
  {
    id: "st5",
    username: "Topluluk",
    initial: "T",
    gradientColors: ["#164e63", "#155e75", "#0f172a"],
    tip: "Her gün renkli sebze hedefi: tabağınızda en az üç farklı renk olsun.",
  },
];
