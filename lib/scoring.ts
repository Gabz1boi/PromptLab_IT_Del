
export type RubricKey =
  | "persona"
  | "task"
  | "context"
  | "format"
  | "examples"
  | "constraints"
  | "clarity"
  | "responsible_ai";

export type CriterionResult = {
  id: string;
  label: string;
  max: number;
  score: number;
  evidence: string[];
  strength: string;
  weakness: string;
  suggestion: string;
};

export type RubricResult = {
  key: RubricKey;
  label: string;
  score: number;
  max: number;
  criteria: CriterionResult[];
};

export type EvaluationResult = {
  total_score: number;
  evaluation_level: string;
  attempt?: number;
  max_attempts: number;
  breakdown: Record<RubricKey, { score: number; max: number; label: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  evidence: string[];
  rubric_details: RubricResult[];
};

type Rule = {
  id: string;
  label: string;
  points: number;
  patterns: RegExp[];
  evidenceLabel: string;
  strength: string;
  weakness: string;
  suggestion: string;
  contextPatterns?: RegExp[];
};

const rx = (...patterns: string[]) =>
  patterns.map((p) => new RegExp(p, "i"));

const rules: Record<RubricKey, { label: string; max: number; criteria: Rule[] }> = {
  persona: {
    label: "Persona",
    max: 15,
    criteria: [
      {
        id: "persona_declaration",
        label: "Menyatakan peran AI secara eksplisit",
        points: 5,
        patterns: rx("\\b(bertindaklah sebagai|bertindak sebagai|berperan sebagai|kamu adalah|anda adalah|jadilah|anggap dirimu sebagai|act as|you are)\\b"),
        evidenceLabel: "Pernyataan peran AI ditemukan",
        strength: "Peran AI dinyatakan secara eksplisit sehingga arah respons lebih jelas.",
        weakness: "Peran AI belum dinyatakan secara eksplisit.",
        suggestion: "Awali prompt dengan instruksi seperti “Bertindaklah sebagai tutor pemrograman...”"
      },
      {
        id: "persona_relevance",
        label: "Peran relevan dengan pembelajaran pemrograman",
        points: 5,
        patterns: rx("\\b(tutor|guru|dosen|pengajar|mentor|pembimbing|instruktur|programming tutor|coding tutor|programming expert|ahli pemrograman)\\b"),
        evidenceLabel: "Peran pendidik atau ahli pemrograman ditemukan",
        strength: "Peran yang dipilih relevan dengan kebutuhan belajar pemrograman.",
        weakness: "Peran AI belum cukup relevan dengan kebutuhan belajar pemrograman.",
        suggestion: "Pilih peran yang relevan, misalnya tutor Algoritma dan Pemrograman atau mentor coding untuk pemula.",
        contextPatterns: rx("\\b(program|pemrograman|coding|algoritma|loop|perulangan|for|while|do-while)\\b")
      },
      {
        id: "persona_teaching_style",
        label: "Menentukan karakter atau pendekatan mengajar",
        points: 5,
        patterns: rx("\\b(sabar|bertahap|step by step|langkah demi langkah|untuk pemula|menyesuaikan|interaktif|mudah dipahami|tidak menghakimi|pengalaman mengajar|mengajar pemula)\\b"),
        evidenceLabel: "Karakter atau pendekatan mengajar ditemukan",
        strength: "Prompt menentukan pendekatan mengajar yang sesuai dengan kebutuhan peserta didik.",
        weakness: "Karakter atau pendekatan mengajar AI belum dijelaskan.",
        suggestion: "Tambahkan gaya mengajar, misalnya sabar, bertahap, interaktif, dan menyesuaikan penjelasan untuk pemula."
      }
    ]
  },

  task: {
    label: "Task",
    max: 20,
    criteria: [
      {
        id: "task_action",
        label: "Menggunakan instruksi tindakan yang jelas",
        points: 5,
        patterns: rx("\\b(jelaskan|uraikan|bandingkan|ajarkan|analisis|buatkan|tunjukkan|demonstrasikan|identifikasi|evaluasi|explain|compare|teach|demonstrate|show|analyze)\\b"),
        evidenceLabel: "Kata kerja instruksional ditemukan",
        strength: "Tugas utama menggunakan kata kerja yang jelas.",
        weakness: "Tindakan yang harus dilakukan AI belum dinyatakan dengan jelas.",
        suggestion: "Gunakan kata kerja operasional, misalnya jelaskan, bandingkan, demonstrasikan, atau berikan latihan."
      },
      {
        id: "task_topic",
        label: "Menentukan topik pemrograman yang spesifik",
        points: 5,
        patterns: rx("\\b(looping|loop|perulangan|for|while|do[- ]?while|algoritma|pemrograman|programming)\\b"),
        evidenceLabel: "Topik pemrograman ditemukan",
        strength: "Topik pemrograman yang menjadi fokus sudah disebutkan.",
        weakness: "Topik pemrograman yang ingin dipelajari belum disebutkan secara spesifik.",
        suggestion: "Sebutkan topik yang dipelajari, misalnya perulangan for, while, dan do-while."
      },
      {
        id: "task_objective",
        label: "Menentukan tujuan pembelajaran",
        points: 5,
        patterns: rx("\\b(memahami|paham|menguasai|belajar|mempelajari|mengetahui kapan|dapat menggunakan|mampu menggunakan|siap menghadapi|persiapan kuis|learning objective|understand|learn)\\b"),
        evidenceLabel: "Tujuan pembelajaran ditemukan",
        strength: "Tujuan belajar sudah terlihat dalam prompt.",
        weakness: "Hasil belajar yang ingin dicapai belum dijelaskan.",
        suggestion: "Jelaskan targetnya, misalnya mampu membedakan dan memilih jenis perulangan yang tepat."
      },
      {
        id: "task_actionable",
        label: "Meminta tindakan belajar yang dapat dilakukan",
        points: 5,
        patterns: rx("\\b(bandingkan|perbedaan|kapan digunakan|cara menggunakan|langkah|contoh penerapan|latihan soal|uji pemahaman|debug|perbaiki kode|compare|when to use|practice questions)\\b"),
        evidenceLabel: "Aktivitas belajar yang konkret ditemukan",
        strength: "Prompt meminta aktivitas konkret seperti perbandingan, penerapan, atau latihan.",
        weakness: "Tugas masih umum dan belum diuraikan menjadi aktivitas belajar yang konkret.",
        suggestion: "Minta Gemini membandingkan setiap jenis loop, menjelaskan kapan digunakan, lalu memberikan latihan."
      }
    ]
  },

  context: {
    label: "Context",
    max: 20,
    criteria: [
      {
        id: "context_level",
        label: "Menjelaskan tingkat atau latar belajar",
        points: 5,
        patterns: rx("\\b(mahasiswa semester (pertama|satu|1)|mahasiswa baru|pemula|baru belajar|belum punya pengalaman|beginner|first[- ]year student|first semester)\\b"),
        evidenceLabel: "Tingkat belajar ditemukan",
        strength: "Tingkat pengalaman belajar dijelaskan sehingga AI dapat menyesuaikan kedalaman materi.",
        weakness: "Tingkat pengalaman atau kemampuan awal belum dijelaskan.",
        suggestion: "Sebutkan bahwa kamu mahasiswa semester pertama atau pemula yang baru belajar pemrograman."
      },
      {
        id: "context_situation",
        label: "Menjelaskan situasi akademik",
        points: 5,
        patterns: rx("\\b(kuis|ujian|uts|uas|tugas|praktikum|perkuliahan|kelas|materi kuliah|persiapan belajar|upcoming quiz|exam|assignment|course)\\b"),
        evidenceLabel: "Situasi akademik ditemukan",
        strength: "Situasi akademik yang melatarbelakangi kebutuhan sudah disebutkan.",
        weakness: "Situasi akademik yang melatarbelakangi permintaan belum dijelaskan.",
        suggestion: "Tambahkan konteks, misalnya sedang mempersiapkan kuis pemrograman atau mengerjakan praktikum."
      },
      {
        id: "context_difficulty",
        label: "Menjelaskan kesulitan yang dialami",
        points: 5,
        patterns: rx("\\b(bingung|kesulitan|belum memahami|belum paham|tidak mengerti|masih kesulitan|sulit membedakan|belum bisa|confused|struggling|do not understand)\\b"),
        evidenceLabel: "Kesulitan belajar ditemukan",
        strength: "Kesulitan belajar dijelaskan sehingga respons dapat diarahkan pada masalah yang sebenarnya.",
        weakness: "Bagian materi yang sulit dipahami belum dijelaskan.",
        suggestion: "Jelaskan kesulitan secara spesifik, misalnya bingung membedakan kondisi penggunaan for, while, dan do-while."
      },
      {
        id: "context_purpose",
        label: "Menjelaskan tujuan atau kebutuhan akhir",
        points: 5,
        patterns: rx("\\b(agar|supaya|sehingga|tujuannya|ingin memahami|ingin bisa|untuk mempersiapkan|mempersiapkan diri|mampu menyelesaikan|memahami konsep|prepare for|so that|in order to)\\b"),
        evidenceLabel: "Tujuan atau kebutuhan akhir ditemukan",
        strength: "Alasan dan kebutuhan akhir pembelajaran sudah disampaikan.",
        weakness: "Tujuan akhir dari bantuan yang diminta belum cukup jelas.",
        suggestion: "Tambahkan tujuan yang ingin dicapai, misalnya memahami konsep dan mampu memilih jenis loop yang sesuai."
      }
    ]
  },

  format: {
    label: "Format",
    max: 15,
    criteria: [
      {
        id: "format_type",
        label: "Menentukan bentuk keluaran",
        points: 5,
        patterns: rx("\\b(dalam bentuk tabel|buat tabel|format tabel|poin[- ]poin|bullet points|daftar|ringkasan|paragraf|diagram|mind map|dalam bentuk)\\b"),
        evidenceLabel: "Bentuk keluaran ditemukan",
        strength: "Bentuk jawaban yang diinginkan sudah ditentukan.",
        weakness: "Bentuk penyajian jawaban belum ditentukan.",
        suggestion: "Tentukan bentuk jawaban, misalnya tabel perbandingan, daftar poin, atau ringkasan."
      },
      {
        id: "format_sequence",
        label: "Menentukan urutan atau struktur jawaban",
        points: 5,
        patterns: rx("\\b(bertahap|langkah demi langkah|step by step|secara berurutan|mulai dari|pertama.*kemudian|urutan|struktur|dari dasar)\\b"),
        evidenceLabel: "Urutan penyajian ditemukan",
        strength: "Urutan penjelasan sudah diarahkan.",
        weakness: "Urutan atau struktur jawaban belum diarahkan.",
        suggestion: "Minta penjelasan dimulai dari konsep dasar, dilanjutkan perbandingan, contoh, dan latihan."
      },
      {
        id: "format_detail",
        label: "Menentukan rincian atau jumlah keluaran",
        points: 5,
        patterns: rx("\\b(\\d+\\s*(contoh|soal|poin|langkah|paragraf)|setiap jenis|masing[- ]masing|beserta|lengkap dengan|sertakan|dilengkapi dengan|input dan output|input-output)\\b"),
        evidenceLabel: "Rincian keluaran ditemukan",
        strength: "Rincian keluaran yang diharapkan sudah disebutkan.",
        weakness: "Rincian jawaban yang diharapkan belum cukup spesifik.",
        suggestion: "Tentukan rincian, misalnya satu contoh kode untuk setiap jenis loop atau tiga soal latihan."
      }
    ]
  },

 
  examples: {
    label: "Examples",
    max: 10,
    criteria: [
      {
        id: "examples_request",
        label: "Meminta contoh yang relevan",
        points: 5,
        patterns: rx(
          "\\b(berikan contoh|beri contoh|sertakan contoh|contoh sederhana|contoh penerapan|contoh kasus|contoh|misalnya|sebagai contoh|ilustrasi|analogi|example|examples|for example|give an example|give me an example|provide an example|show an example|give examples|provide examples|show examples|with examples|sample|samples)\\b"
        ),
        evidenceLabel: "Permintaan contoh ditemukan",
        strength: "Prompt meminta contoh untuk membantu pemahaman.",
        weakness: "Prompt belum meminta contoh pendukung.",
        suggestion: "Minta Gemini memberikan contoh sederhana yang relevan dengan materi dan kebutuhan pembelajaran."
      },
      {
        id: "examples_specific",
        label: "Menentukan jenis demonstrasi atau contoh",
        points: 5,
        patterns: rx(
          "\\b(contoh kode|kode program|potongan kode|simulasi|input[- ]output|hasil keluaran|analogi kehidupan|kehidupan sehari[- ]hari|studi kasus|example code|code example|sample code|code snippet|worked example|sample input|real[- ]world example|practical example|illustration|analogy)\\b"
        ),
        evidenceLabel: "Jenis contoh atau demonstrasi ditemukan",
        strength: "Jenis contoh yang diminta relevan dengan materi pemrograman.",
        weakness: "Jenis contoh belum ditentukan sehingga hasil demonstrasi berpotensi terlalu umum.",
        suggestion: "Minta contoh kode untuk setiap jenis loop, lengkap dengan input, output, atau analogi sederhana."
      }
    ]
  },

  constraints: {
    label: "Constraints",
    max: 10,
    criteria: [
      {
        id: "constraints_language_level",
        label: "Menentukan bahasa dan tingkat kesulitan",
        points: 3,
        patterns: rx("\\b(bahasa indonesia|bahasa sederhana|bahasa yang mudah|mudah dipahami|untuk pemula|tidak terlalu teknis|simple language|plain language|in indonesian)\\b"),
        evidenceLabel: "Bahasa atau tingkat kesulitan ditemukan",
        strength: "Bahasa atau tingkat kesulitan sudah dibatasi sesuai kebutuhan.",
        weakness: "Bahasa atau tingkat kesulitan belum ditentukan.",
        suggestion: "Tambahkan instruksi menggunakan bahasa Indonesia yang sederhana dan mudah dipahami pemula."
      },
      {
        id: "constraints_boundary",
        label: "Memberikan batasan atau larangan yang relevan",
        points: 3,
        patterns: rx("\\b(jangan|hindari|tidak perlu|tanpa|batasi|maksimal|minimum|do not|don't|avoid|limit)\\b"),
        evidenceLabel: "Batasan atau larangan ditemukan",
        strength: "Prompt memuat batasan yang membantu mengarahkan respons.",
        weakness: "Batasan yang perlu dipatuhi AI belum dijelaskan.",
        suggestion: "Tambahkan batasan yang relevan, misalnya jangan langsung memberikan jawaban latihan."
      },
      {
        id: "constraints_scope",
        label: "Menentukan cakupan atau panjang jawaban",
        points: 2,
        patterns: rx("\\b(maksimal|minimal|sebanyak|\\d+\\s*(kata|kalimat|halaman|soal|contoh)|singkat|ringkas|tidak terlalu panjang|secara mendalam)\\b"),
        evidenceLabel: "Cakupan atau panjang jawaban ditemukan",
        strength: "Cakupan atau panjang jawaban telah ditentukan.",
        weakness: "Cakupan jawaban belum dibatasi jika memang diperlukan.",
        suggestion: "Jika diperlukan, tentukan panjang jawaban atau jumlah latihan yang diinginkan."
      },
      {
        id: "constraints_assumptions",
        label: "Mencegah asumsi yang tidak tepat",
        points: 2,
        patterns: rx("\\b(jika informasi kurang|jika belum jelas|tanyakan terlebih dahulu|minta klarifikasi|jangan berasumsi|jangan mengarang|sebutkan asumsi|ask me if|ask clarifying questions|do not assume)\\b"),
        evidenceLabel: "Instruksi klarifikasi atau pengendalian asumsi ditemukan",
        strength: "Prompt mengarahkan AI untuk meminta klarifikasi atau menghindari asumsi yang tidak didukung.",
        weakness: "Belum ada instruksi untuk menangani informasi yang kurang jelas.",
        suggestion: "Tambahkan arahan agar Gemini bertanya jika informasi belum cukup dan tidak mengarang asumsi."
      }
    ]
  },

  clarity: {
    label: "Kejelasan & Kekhususan",
    max: 5,
    criteria: [
      {
        id: "clarity_instruction",
        label: "Instruksi memiliki hubungan tindakan dan objek",
        points: 3,
        patterns: rx("\\b(jelaskan|uraikan|bandingkan|ajarkan|buatkan|tunjukkan|demonstrasikan|analisis|evaluasi)\\b"),
        evidenceLabel: "Instruksi tindakan ditemukan",
        strength: "Instruksi memiliki tindakan yang dapat dipahami dan ditindaklanjuti.",
        weakness: "Instruksi belum membentuk permintaan yang jelas.",
        suggestion: "Susun kalimat instruksi yang menghubungkan tindakan dengan objek yang diminta."
      },
      {
        id: "clarity_consistency",
        label: "Instruksi konsisten dan tidak saling bertentangan",
        points: 2,
        patterns: [],
        evidenceLabel: "Pemeriksaan konsistensi instruksi",
        strength: "Tidak ditemukan konflik instruksi yang jelas.",
        weakness: "Ada kemungkinan instruksi saling bertentangan atau susunan prompt terlalu berupa daftar kata.",
        suggestion: "Periksa kembali apakah batasan dan format yang diminta dapat dipenuhi secara bersamaan."
      }
    ]
  },

  responsible_ai: {
    label: "AI Bertanggung Jawab & Verifikasi",
    max: 5,
    criteria: [
      {
        id: "responsible_accuracy",
        label: "Meminta pemeriksaan akurasi",
        points: 2,
        patterns: rx("\\b(verifikasi|periksa kembali|cek kembali|pastikan akurat|periksa kebenaran|validasi|verify|check accuracy|double[- ]check)\\b"),
        evidenceLabel: "Permintaan verifikasi akurasi ditemukan",
        strength: "Prompt meminta pemeriksaan kebenaran informasi.",
        weakness: "Prompt belum meminta pemeriksaan akurasi jawaban.",
        suggestion: "Minta Gemini memeriksa kembali ketepatan penjelasan dan contoh kode."
      },
      {
        id: "responsible_uncertainty",
        label: "Meminta pengakuan ketidakpastian atau sumber",
        points: 2,
        patterns: rx("\\b(jika tidak yakin|jika ragu|jelaskan ketidakpastian|sertakan sumber|cantumkan referensi|sumber tepercaya|referensi tepercaya|do not fabricate|mention uncertainty|cite sources)\\b"),
        evidenceLabel: "Instruksi ketidakpastian atau sumber ditemukan",
        strength: "Prompt mengarahkan AI untuk menjelaskan ketidakpastian atau menggunakan sumber.",
        weakness: "Prompt belum mengarahkan AI untuk menyatakan ketidakpastian atau menunjukkan sumber saat diperlukan.",
        suggestion: "Tambahkan instruksi agar Gemini menyatakan jika tidak yakin dan tidak mengarang referensi."
      },
      {
        id: "responsible_learning",
        label: "Menjaga peran AI sebagai pendamping belajar",
        points: 1,
        patterns: rx("\\b(bantu saya belajar|bimbing saya|uji pemahaman|jangan langsung memberikan jawaban|biarkan saya mencoba|bantu memahami|guide me|help me learn|test my understanding)\\b"),
        evidenceLabel: "Pendekatan pendampingan belajar ditemukan",
        strength: "AI diarahkan untuk mendukung proses belajar aktif.",
        weakness: "Peran AI sebagai pendamping belajar aktif belum terlihat.",
        suggestion: "Minta Gemini membimbing dan menguji pemahaman, bukan hanya memberikan jawaban akhir."
      }
    ]
  }
};

function normalize(text: string): string {
  return text
    .toLocaleLowerCase("id-ID")
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEvidence(text: string, patterns: RegExp[]): string[] {
  const found: string[] = [];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[0]) {
      found.push(match[0]);
    }
  }

  return found
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 4);
}

function isContradictory(text: string): boolean {
  const contradictions = [
    /jangan.{0,35}(?:gunakan|buat|sajikan).{0,20}tabel[\s\S]{0,100}(?:gunakan|buat|sajikan).{0,20}tabel/i,
    /(?:sangat detail|secara sangat rinci)[\s\S]{0,80}(?:satu kalimat saja|maksimal 1 kalimat)/i,
    /(?:jawab langsung|langsung berikan jawaban)[\s\S]{0,80}(?:jangan berikan jawaban|jangan langsung menjawab)/i
  ];

  return contradictions.some((p) => p.test(text));
}

function looksLikeKeywordStuffing(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);

  const actionCount =
    (text.match(/\b(jelaskan|uraikan|bandingkan|ajarkan|buatkan|tunjukkan|analisis|explain|compare|teach)\b/gi) || []).length;

  const commaCount = (text.match(/[,;|]/g) || []).length;
  const sentenceCount = (text.match(/[.!?]/g) || []).length;

  const listLike = commaCount >= 5 && sentenceCount <= 1 && actionCount <= 1;
  const shortKeywordList = words.length < 28 && commaCount >= 3 && actionCount <= 1;

  return listLike || shortKeywordList;
}

function scoreRule(
  rule: Rule,
  text: string
): { score: number; evidence: string[] } {
  if (rule.id === "clarity_consistency") {
    const stuffing = looksLikeKeywordStuffing(text);
    const contradiction = isContradictory(text);

    if (stuffing || contradiction) {
      return {
        score: 0,
        evidence: [
          stuffing
            ? "Susunan prompt terdeteksi seperti daftar kata kunci"
            : "Ditemukan pola instruksi yang berpotensi bertentangan"
        ]
      };
    }

    return {
      score: 2,
      evidence: ["Tidak ditemukan pola konflik yang jelas"]
    };
  }

  const evidence = extractEvidence(text, rule.patterns);

  if (evidence.length === 0) {
    return { score: 0, evidence: [] };
  }

  if (rule.contextPatterns?.length) {
    const contextual = rule.contextPatterns.some((p) => p.test(text));

    if (!contextual) {
      return { score: 0, evidence };
    }
  }

  // Frasa harus berada dalam prompt yang cukup berbentuk instruksi,
  // bukan daftar kata acak.
  if (looksLikeKeywordStuffing(text) && rule.id !== "constraints_boundary") {
    const instructionPresent =
      /\b(jelaskan|uraikan|bandingkan|ajarkan|buatkan|tunjukkan|demonstrasikan|minta|gunakan|sertakan|berikan|bantu|bimbing|bertindak|act as)\b/i.test(text);

    if (!instructionPresent) {
      return { score: 0, evidence };
    }
  }

  return { score: rule.points, evidence };
}

export function evaluatePrompt(rawPrompt: string): EvaluationResult {
  const prompt = normalize(rawPrompt);
  const wordCount = prompt.split(/\s+/).filter(Boolean).length;

  const rubricDetails: RubricResult[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const allEvidence: string[] = [];

  for (const key of Object.keys(rules) as RubricKey[]) {
    const group = rules[key];
    const criteriaResults: CriterionResult[] = [];
    let groupScore = 0;

    for (const rule of group.criteria) {
      const result = scoreRule(rule, prompt);
      const score = Math.max(0, Math.min(rule.points, result.score));

      groupScore += score;

      const passed = score === rule.points;

      if (passed) {
        strengths.push(rule.strength);
      } else {
        weaknesses.push(rule.weakness);
        suggestions.push(rule.suggestion);
      }

      allEvidence.push(...result.evidence);

      criteriaResults.push({
        id: rule.id,
        label: rule.label,
        max: rule.points,
        score,
        evidence: result.evidence,
        strength: rule.strength,
        weakness: rule.weakness,
        suggestion: rule.suggestion
      });
    }

    rubricDetails.push({
      key,
      label: group.label,
      score: groupScore,
      max: group.max,
      criteria: criteriaResults
    });
  }

  // Penalti kejelasan untuk prompt yang sangat pendek.
  const clarityGroup = rubricDetails.find((r) => r.key === "clarity");

  if (clarityGroup && wordCount < 5) {
    const criterion = clarityGroup.criteria.find(
      (item) => item.id === "clarity_instruction"
    );

    if (criterion && criterion.score > 0) {
      clarityGroup.score -= criterion.score;
      criterion.score = 0;
      criterion.evidence = [
        "Prompt terlalu singkat untuk menunjukkan instruksi yang utuh"
      ];
    }
  }

  const total = rubricDetails.reduce(
    (sum, item) => sum + item.score,
    0
  );

  const totalScore = Math.max(0, Math.min(100, total));

  const level =
    totalScore >= 90
      ? "Excellent"
      : totalScore >= 75
        ? "Good"
        : totalScore >= 60
          ? "Developing"
          : totalScore >= 40
            ? "Basic Understanding"
            : "Needs Major Improvement";

  const breakdown = {} as EvaluationResult["breakdown"];

  for (const item of rubricDetails) {
    breakdown[item.key] = {
      score: item.score,
      max: item.max,
      label: item.label
    };
  }

  return {
    total_score: totalScore,
    evaluation_level: level,
    max_attempts: 4,
    breakdown,

    strengths: strengths
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 6),

    weaknesses: weaknesses
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 8),

    suggestions: suggestions
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 8),

    evidence: allEvidence
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 15),

    rubric_details: rubricDetails
  };
}

export function getEvaluationLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Developing";
  if (score >= 40) return "Basic Understanding";

  return "Needs Major Improvement";
}
