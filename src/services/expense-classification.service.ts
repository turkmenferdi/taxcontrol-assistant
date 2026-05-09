export type ClassificationResult =
  | "deductible"
  | "non_deductible"
  | "partially_deductible"
  | "accountant_review_required";

export interface ClassificationOutput {
  category: string;
  classification: ClassificationResult;
  confidenceScore: number;
  reason: string;
}

interface Rule {
  keywords: string[];
  category: string;
  classification: ClassificationResult;
  confidence: number;
  reason: string;
}

const RULES: Rule[] = [
  {
    keywords: ["yazılım", "software", "saas", "lisans", "abonelik", "subscription", "bulut", "cloud"],
    category: "Yazılım / Abonelik",
    classification: "deductible",
    confidence: 0.9,
    reason:
      "Bu fatura, işletme operasyonlarında kullanılan yazılım veya abonelik hizmeti niteliğinde görünmektedir. Bu tür giderler muhtemelen indirilebilir niteliktedir. Kesin karar için sertifikalı muhasebeciye danışılması önerilir.",
  },
  {
    keywords: ["internet", "telekom", "gsm", "telefon", "iletişim", "turkcell", "vodafone", "türk telekom"],
    category: "İnternet / Telefon",
    classification: "deductible",
    confidence: 0.85,
    reason:
      "İnternet ve telefon giderleri iş amaçlı kullanım şartıyla muhtemelen indirilebilir niteliktedir. Kişisel kullanım payı varsa kısmen indirilebilir olabilir. Muhasebeci onayı önerilir.",
  },
  {
    keywords: ["kira", "ofis", "işyeri", "depo", "fabrika"],
    category: "Kira / İşyeri Gideri",
    classification: "deductible",
    confidence: 0.88,
    reason:
      "İşyeri kira ve ofis giderleri ticari kazancın tespitinde muhtemelen indirilebilir niteliktedir. Kişisel konut kiraları bu kapsamda değerlendirilemez.",
  },
  {
    keywords: ["muhasebe", "mali müşavir", "smmm", "yeminli", "denetim", "audit"],
    category: "Muhasebe / Danışmanlık",
    classification: "deductible",
    confidence: 0.92,
    reason:
      "Muhasebe ve mali müşavirlik hizmetleri doğrudan işletme ile ilgili olduğundan muhtemelen indirilebilir niteliktedir.",
  },
  {
    keywords: ["danışmanlık", "consulting", "proje", "mühendislik", "tasarım"],
    category: "Danışmanlık Hizmeti",
    classification: "deductible",
    confidence: 0.8,
    reason:
      "İş danışmanlığı ve proje hizmetleri muhtemelen indirilebilir niteliktedir. Hizmetin doğrudan işletme ile ilişkili olduğunun belgelenmesi gerekir.",
  },
  {
    keywords: ["bilgisayar", "laptop", "notebook", "ekran", "monitör", "yazıcı", "printer", "tablet"],
    category: "Ofis Ekipmanı / Demirbaş",
    classification: "accountant_review_required",
    confidence: 0.75,
    reason:
      "Ofis ekipmanı ve demirbaşlar amortisman yoluyla gider yazılabilir. Birim değerine bağlı olarak doğrudan gider veya sabit kıymet olarak değerlendirilebilir. Muhasebeci onayı gereklidir.",
  },
  {
    keywords: ["kırtasiye", "ofis malzeme", "kağıt", "kalem", "kaset", "toner"],
    category: "Kırtasiye / Ofis Malzemeleri",
    classification: "deductible",
    confidence: 0.87,
    reason:
      "Kırtasiye ve ofis malzemeleri giderleri muhtemelen indirilebilir niteliktedir.",
  },
  {
    keywords: ["trafik cezası", "ceza", "idari para cezası", "vergi cezası"],
    category: "Ceza / İdari Para Cezası",
    classification: "non_deductible",
    confidence: 0.95,
    reason:
      "Trafik cezaları ve idari para cezaları Gelir Vergisi Kanunu kapsamında gider olarak indirilemez.",
  },
  {
    keywords: ["giyim", "kıyafet", "elbise", "ayakkabı", "çanta", "aksesuar"],
    category: "Giyim / Kişisel Harcama",
    classification: "non_deductible",
    confidence: 0.88,
    reason:
      "Kişisel giyim ve aksesuar harcamaları genel olarak ticari kazancın tespitinde indirilemez niteliktedir. Mesleki kıyafet gerektiren durumlarda muhasebeci onayı alınmalıdır.",
  },
  {
    keywords: ["market", "süpermarket", "migros", "carrefour", "bim", "a101", "şok", "gıda", "manav", "kasap"],
    category: "Market / Gıda",
    classification: "accountant_review_required",
    confidence: 0.7,
    reason:
      "Market alışverişleri kişisel nitelik taşıyabilir. İş amaçlı olduğunun belgelenmesi halinde indirilebilir. Kesin değerlendirme için muhasebeci onayı gereklidir.",
  },
  {
    keywords: ["restoran", "yemek", "cafe", "kahve", "ağırlama", "temsil", "eğlence"],
    category: "Yemek / Ağırlama",
    classification: "accountant_review_required",
    confidence: 0.65,
    reason:
      "Yemek ve ağırlama giderleri iş amaçlı olduğunun ispatı halinde kısmen indirilebilir olabilir. Temsil ve ağırlama giderlerinin belgelenme şekli önemlidir. Muhasebeci onayı gereklidir.",
  },
  {
    keywords: ["araç", "taşıt", "otomobil", "araç kiralama", "rent a car", "yakıt", "benzin", "motorin", "lastik", "servis"],
    category: "Araç / Ulaşım Gideri",
    classification: "partially_deductible",
    confidence: 0.72,
    reason:
      "Araç ve ulaşım giderleri işletme aracına ilişkin ise indirilebilir, şahsi araç kullanımında ise kısmen indirilebilir veya indirilmez nitelik taşıyabilir. Muhasebeci değerlendirmesi önerilir.",
  },
  {
    keywords: ["yakıt", "benzin", "motorin", "lpg", "opet", "shell", "bp", "total"],
    category: "Yakıt",
    classification: "accountant_review_required",
    confidence: 0.68,
    reason:
      "Yakıt gideri iş seyahati veya şirket aracına ilişkinse indirilebilir. Kişisel araç yakıtı ise genellikle indirilmez. Muhasebeci onayı gereklidir.",
  },
  {
    keywords: ["otel", "konaklama", "hotel", "seyahat", "uçak", "bilet", "tren", "otobüs"],
    category: "Seyahat / Konaklama",
    classification: "accountant_review_required",
    confidence: 0.7,
    reason:
      "Seyahat ve konaklama giderleri iş amacıyla yapıldığının belgelenmesi halinde indirilebilir niteliktedir. Belgeleme ve seyahat amacının açıklanması önemlidir. Muhasebeci onayı önerilir.",
  },
  {
    keywords: ["bebek", "çocuk", "oyuncak", "ev eşyası", "mobilya", "perde", "halı"],
    category: "Kişisel / Ev Harcaması",
    classification: "non_deductible",
    confidence: 0.9,
    reason:
      "Bebek ürünleri, kişisel ev eşyaları ve mobilya gibi harcamalar ticari faaliyet ile ilişkili olmadığından gider olarak indirilemez niteliktedir.",
  },
  {
    keywords: ["elektrik", "su", "doğalgaz", "enerji", "fatura"],
    category: "Elektrik / Su / Doğalgaz",
    classification: "deductible",
    confidence: 0.82,
    reason:
      "İşyerine ait elektrik, su ve doğalgaz giderleri muhtemelen indirilebilir niteliktedir. Konut+işyeri karma kullanımında kısmen indirilebilir olabilir.",
  },
  {
    keywords: ["sigorta", "insurance", "poliçe"],
    category: "Sigorta",
    classification: "accountant_review_required",
    confidence: 0.75,
    reason:
      "Sigorta giderleri türüne göre farklı vergi muamelesine tabi olabilir. İşyeri, araç ve iş sigortaları genellikle indirilebilirken sağlık sigortası için özel değerlendirme gereklidir. Muhasebeci onayı önerilir.",
  },
  {
    keywords: ["temizlik", "güvenlik", "koruma", "catering"],
    category: "Temizlik / Güvenlik Hizmeti",
    classification: "deductible",
    confidence: 0.85,
    reason:
      "Temizlik ve güvenlik hizmetleri işyerine yönelik ise muhtemelen indirilebilir niteliktedir.",
  },
  {
    keywords: ["reklam", "pazarlama", "dijital", "google ads", "meta", "instagram", "facebook", "billboard", "ilan"],
    category: "Reklam / Pazarlama",
    classification: "deductible",
    confidence: 0.88,
    reason:
      "Reklam ve pazarlama giderleri ticari faaliyet kapsamında muhtemelen indirilebilir niteliktedir.",
  },
  {
    keywords: ["kargo", "kurye", "taşıma", "lojistik", "nakliye", "aras", "yurtiçi", "mng", "ups", "fedex"],
    category: "Kargo / Nakliye",
    classification: "deductible",
    confidence: 0.87,
    reason:
      "Ticari faaliyet kapsamındaki kargo ve nakliye giderleri muhtemelen indirilebilir niteliktedir.",
  },
];

export function classifyExpense(
  supplierName: string,
  description: string,
  invoiceLines?: Array<{ description?: string | null }>
): ClassificationOutput {
  const searchText = [
    supplierName,
    description,
    ...(invoiceLines?.map((l) => l.description ?? "") ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  let bestMatch: (Rule & { score: number }) | null = null;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      const normalized = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      if (searchText.includes(normalized)) {
        score += 1;
      }
    }
    if (score > 0) {
      const weighted = (score / rule.keywords.length) * rule.confidence;
      if (!bestMatch || weighted > bestMatch.score) {
        bestMatch = { ...rule, score: weighted };
      }
    }
  }

  if (!bestMatch) {
    return {
      category: "Sınıflandırılamadı",
      classification: "accountant_review_required",
      confidenceScore: 0.5,
      reason:
        "Bu fatura otomatik olarak sınıflandırılamamıştır. Gider türünün belirlenmesi ve vergi muamelesinin tespiti için muhasebeci onayı gerekmektedir.",
    };
  }

  return {
    category: bestMatch.category,
    classification: bestMatch.classification,
    confidenceScore: Math.min(bestMatch.score + 0.1, bestMatch.confidence),
    reason: bestMatch.reason,
  };
}
