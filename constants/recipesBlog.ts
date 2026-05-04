export type RecipeComment = {
  id: string;
  author: string;
  body: string;
  timeLabel: string;
};

export type RecipePost = {
  id: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  tags: string[];
  summary: string;
  /** Tam tarif metni (makale biçiminde) */
  fullText: string;
  ingredients: string[];
  steps: string[];
  prepMinutes: number;
  imageUrls: string[];
  /** Kapak görseli (yerel URI veya uzak URL); yoksa imageUrls[0] kullanılır */
  imageUri?: string;
  /** Yerel veya uzak tarif videosu URI (expo-av) */
  videoUri?: string;
  /** Bu cihazdaki kullanıcı kimliği (Firestore `createdBy` ile eşleşir) */
  createdBy?: string;
  /** YouTube gömülü oynatıcı için embed URL (ör. https://www.youtube.com/embed/VIDEO_ID) */
  videoEmbedUrl?: string;
};

/** Kapak için öncelik: imageUri, sonra ilk imageUrls öğesi */
export function getRecipeCoverUri(recipe: RecipePost): string | undefined {
  if (recipe.imageUri?.trim()) return recipe.imageUri;
  const first = recipe.imageUrls[0];
  return first?.trim() ? first : undefined;
}

export const RECIPE_COMMENT_SEEDS: Record<string, RecipeComment[]> = {
  "1": [
    {
      id: "c1-1",
      author: "Zeynep K.",
      body: "Limon yerine nar ekşisi de çok yakışıyor, teşekkürler!",
      timeLabel: "2 saat önce",
    },
    {
      id: "c1-2",
      author: "Murat",
      body: "Çölyaklı oğlum için denedik, çok beğendi.",
      timeLabel: "Dün",
    },
  ],
  "2": [
    {
      id: "c2-1",
      author: "Elif",
      body: "Fırında biraz daha uzun tuttum, kabuk güzel kızardı.",
      timeLabel: "5 saat önce",
    },
  ],
  "3": [
    {
      id: "c3-1",
      author: "Can",
      body: "Şeker ölçümü için harika bir alternatif.",
      timeLabel: "3 gün önce",
    },
  ],
  "4": [
    {
      id: "c4-1",
      author: "Aylin",
      body: "Kuşkonmazı buharda pişirdim, çok lezzetli oldu.",
      timeLabel: "1 hafta önce",
    },
    {
      id: "c4-2",
      author: "Burak",
      body: "Porsiyon iki kişi için ideal.",
      timeLabel: "Dün",
    },
  ],
};

export const RECIPE_POSTS: RecipePost[] = [
  {
    id: "1",
    title: "Kinoa Salatası (Glütensiz)",
    author: "Dyt. Selin Yılmaz",
    likes: 128,
    comments: 14,
    tags: ["Çölyak", "Vegan", "Düşük Kalori"],
    summary:
      "Protein ve lif açısından zengin, glütensiz ve bitkisel beslenmeye uygun doyurucu bir salata.",
    fullText:
      "Bu salata, öğle yemeği veya hafif akşam seçeneği olarak glütensiz ve vegan beslenmeye uygundur. Kinoa tam protein profili sayesinde doygunluk sağlarken; roka, domates ve salatalık ile vitamin ve antioksidan desteği sunar. Zeytinyağı ve limon ile klasik bir sos kullanarak ek şekerden kaçınabilirsiniz.\n\nServis önerisi: Üzerine çiğ kabak çekirdeği veya rendelenmiş havuç ekleyerek çeşitlendirebilirsiniz. Yoğun spor günlerinde porsiyonu biraz artırmanız yeterlidir.",
    ingredients: [
      "1 su bardağı haşlanmış kinoa",
      "1 avuç roka",
      "1 küçük salatalık, küp doğranmış",
      "10 cherry domates, ikiye bölünmüş",
      "2 yemek kaşığı zeytinyağı",
      "Limon suyu, tuz, karabiber",
    ],
    steps: [
      "Kinoayı paket talimatına göre haşlayıp süzün.",
      "Geniş bir kasede kinoa, roka, salatalık ve domatesi birleştirin.",
      "Zeytinyağı ve limon suyu ile tatlandırıp servis edin.",
    ],
    prepMinutes: 20,
    imageUrls: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80",
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/ZuAEZ7T5FqI",
  },
  {
    id: "2",
    title: "Fırında Sebzeli Mercimek Köftesi",
    author: "Şef Emre Kaya",
    likes: 256,
    comments: 31,
    tags: ["Vegan", "Yüksek Protein"],
    summary:
      "Fırında kızartılmış lezzetli mercimek köftesi; öğle veya akşam için ideal.",
    fullText:
      "Kırmızı mercimek protein ve lif kaynağıdır; galeta unu veya ince bulgur ile bağlanan köfte harcı fırında daha az yağla pişer. Bu tarif vegan beslenmeye uygundur; baharatları kendi damak zevkinize göre artırıp azaltabilirsiniz.\n\nKöfteleri hafif yağlı kağıt üzerinde pişirmek temizliği kolaylaştırır. Yanında yoğurtsuz bir tahin sos veya salata ile sunabilirsiniz.",
    ingredients: [
      "1 su bardağı kırmızı mercimek",
      "1 adet kuru soğan, rendelenmiş",
      "2 yemek kaşığı galeta unu veya ince bulgur",
      "Kimyon, kırmızı biber, tuz",
      "İsteğe bağlı: maydanoz",
    ],
    steps: [
      "Mercimeği haşlayıp fazla suyunu süzün, biraz ezerek yoğun bir kıvam elde edin.",
      "Soğan ve baharatları ekleyip köfte şekli verin.",
      "Önceden ısıtılmış 180°C fırında 20–25 dakika pişirin.",
    ],
    prepMinutes: 45,
    imageUrls: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=80",
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=900&q=80",
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/AmC9SmCBUj4",
  },
  {
    id: "3",
    title: "Yulaf Lapası (Düşük Glisemik İndeks)",
    author: "Dyt. Ayşe Demir",
    likes: 89,
    comments: 9,
    tags: ["Diyabet", "Düşük Kalori"],
    summary:
      "Tarçın ve yeşil elma ile tatlandırılmış, kan şekerini daha yumuşak yükselten kahvaltı seçeneği.",
    fullText:
      "Tam tahıl yulaf ve lifli yeşil elma; öğün sonrası glisemik yanıtı yumuşatmaya yardımcı olabilir. Tarçın ise tatlı ihtiyacını doğal yollarla dengelemeye destek olur. Porsiyonu kendi planınıza göre ayarlamayı unutmayın.\n\nSüt yerine unsweetened badem veya yulaf içeceği kullanarak laktozsuz da hazırlayabilirsiniz. Üzerine taze meyve eklemek lif miktarını artırır.",
    ingredients: [
      "Yarım su bardağı yulaf ezmesi",
      "1 su bardağı süt veya bitkisel içecek",
      "Yarım yeşil elma, küp",
      "Çay kaşığı tarçın",
      "İsteğe bağlı: bir tutam ceviz",
    ],
    steps: [
      "Yulaf ve sıvıyı tencerede karıştırarak kısık ateşte kıvam alana kadar pişirin.",
      "Ocaktan alırken elma ve tarçını ekleyin.",
      "Ilık servis edin; üzerine ceviz serpebilirsiniz.",
    ],
    prepMinutes: 12,
    imageUrls: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=900&q=80",
    ],
  },
  {
    id: "4",
    title: "Izgara Somon & Kuşkonmaz",
    author: "Sağlıklı Mutfak",
    likes: 412,
    comments: 52,
    tags: ["Düşük Kalori", "Yüksek Protein"],
    summary:
      "Omega-3 ve protein dengesi için hafif akşam yemeği; kuşkonmaz ile vitamin takviyesi.",
    fullText:
      "Somon omega-3 yağ asitleri açısından zengindir; kuşkonmaz ise folat ve lif içerir. Izgarada kısa süre pişirerek balığın kurumasını önleyin; kuşkonmazı hafif sote veya buharda pişirmek B vitaminlerini korumaya yardımcı olur.\n\nLimon ve dereotu ile tatlandırmak ek tuz ihtiyacını azaltır. Yanında küçük bir salata ile tam öğün oluşturabilirsiniz.",
    ingredients: [
      "2 somon fileto",
      "1 demet kuşkonmaz",
      "Zeytinyağı, limon, dereotu",
      "Tuz, karabiber",
    ],
    steps: [
      "Somonu baharatlayıp ızgarada veya tavada her iki yüzünü pişirin.",
      "Kuşkonmazı kısa süre soteleyin veya fırında hafifçe kızartın.",
      "Limon ve dereotu ile servis edin.",
    ],
    prepMinutes: 25,
    imageUrls: [
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac7b55e?w=900&q=80",
    ],
  },
];

export function getRecipeById(id: string): RecipePost | undefined {
  return RECIPE_POSTS.find((r) => r.id === id);
}

export function getSeedCommentsForRecipe(recipeId: string): RecipeComment[] {
  return RECIPE_COMMENT_SEEDS[recipeId] ?? [];
}
