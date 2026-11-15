/**
 * Olympiad & Top-Tier Conceptual Problem Bank (Chapters 1 to 13)
 * Prepared specifically for SSC Top-Tier Students & Physics Olympiad aspirants.
 */

const OLYMPIAD_PROBLEMS = [
  {
    id: "prob_ch1_01",
    chapter: 1,
    title: "ভার্নিয়ার ক্যালিপার্সের সূক্ষ্ম বিভ্রান্তি ও আপেক্ষিক ত্রুটি",
    difficulty: "Advanced Olympiad",
    question: "একটি স্লাইড ক্যালিপার্সে প্রধান স্কেলের ক্ষুদ্রতম এক ঘরের মান 1 mm এবং এর 19 ঘর ভার্নিয়ার স্কেলের 20 ঘরের সমান। একটি গোলকের ব্যাস মাপতে গিয়ে প্রধান স্কেল পাঠ পাওয়া গেল 2.4 cm এবং ভার্নিয়ার সমপাতন 14। পরিমাপটিতে শতকরা আপেক্ষিক ত্রুটি যদি 1.2% হয়, তবে গোলকের আয়তন নির্ণয়ে শতকরা সর্বোচ্চ সম্ভাব্য ত্রুটি কত হবে?",
    options: [
      { text: "1.2%", correct: false },
      { text: "2.4%", correct: false },
      { text: "3.6%", correct: true },
      { text: "4.8%", correct: false }
    ],
    hint: "মনে রাখবে: গোলকের আয়তন V = (4/3) * pi * r^3 = (1/6) * pi * D^3। ব্যাসের ঘাত 3 হওয়ায় আয়তনের শতকরা ত্রুটি = 3 × (ব্যাসের শতকরা ত্রুটি)।",
    explanation: "গোলকের ব্যাস D নির্ণয়ে আপেক্ষিক ত্রুটি (Delta D / D) = 1.2%। যেহেতু আয়তন V proportional to D^3, তাই লগারিদমিক ব্যবকলন বা ত্রুটির সূত্র অনুসারে: (Delta V / V) ≈ 3 × (Delta D / D) = 3 × 1.2% = 3.6%।"
  },
  {
    id: "prob_ch2_01",
    chapter: 2,
    title: "দুই ট্রেনের মুখোমুখি সংঘর্ষ পরিহার (Braking Kinematics)",
    difficulty: "Top-Tier Conceptual",
    question: "একই সোজা রেললাইনে দুটি ট্রেন পরস্পরের দিকে যথাক্রমে 72 km/h এবং 108 km/h বেগে ছুটে আসছে। যখন তাদের মধ্যবর্তী দূরত্ব 250 m, তখন দুই ট্রেনের ড্রাইভার একইসাথে সর্বোচ্চ 5 m/s² মন্দনে ব্রেক কষলেন। ট্রেন দুটির মুখোমুখি সংঘর্ষ কি এড়ানো সম্ভব?",
    options: [
      { text: "না, সংঘর্ষ ঘটবে (মোট থামার দূরত্ব 300 m)", correct: false },
      { text: "হ্যাঁ, সংঘর্ষ এড়ানো সম্ভব (মোট থামার দূরত্ব 130 m)", correct: true },
      { text: "না, সংঘর্ষ ঘটবে (মোট থামার দূরত্ব 260 m)", correct: false },
      { text: "ঠিক 250 m দূরত্বে গিয়ে একে অপরকে স্পর্শ করবে", correct: false }
    ],
    hint: "km/h কে প্রথমে m/s এ নাও: v1 = 72 * (5/18) = 20 m/s, v2 = 108 * (5/18) = 30 m/s। এরপর থামার দূরত্ব সূত্র s = v^2 / (2a) ব্যবহার করো।",
    explanation: "1st ট্রেনের থামার দূরত্ব s1 = (20)^2 / (2 × 5) = 400 / 10 = 40 m। 2nd ট্রেনের থামার দূরত্ব s2 = (30)^2 / (2 × 5) = 900 / 10 = 90 m। মোট প্রয়োজনীয় দূরত্ব s_total = 40 + 90 = 130 m। যেহেতু তাদের মধ্যবর্তী আদি দূরত্ব 250 m ছিল, তাই তারা নিরাপদে থেমে যাবে (সংঘর্ষের বহু আগেই, 250 - 130 = 120 m দূরত্ব বাকি রেখেই থামবে)!"
  },
  {
    id: "prob_ch3_01",
    chapter: 3,
    title: "লিফটের মধ্যে আপাত ওজন ও জড়তার বিভ্রান্তি",
    difficulty: "Olympiad / Conceptual",
    question: "60 kg ভরের একজন ব্যক্তি একটি ওজন মাপার যন্ত্রের ওপর দাঁড়িয়ে লিফটে আছেন। লিফটটি যখন 2 m/s² সমত্বরণে নিচে নামতে শুরু করে, তখন ওজন মাপার যন্ত্রটি কত বল নির্দেশ করবে? (g = 9.8 m/s²)",
    options: [
      { text: "708 N", correct: false },
      { text: "588 N", correct: false },
      { text: "468 N", correct: true },
      { text: "0 N", correct: false }
    ],
    hint: "লিফট যখন নিচে নামে ত্বরণ a নিয়ে, আপাত ওজন R = m(g - a)।",
    explanation: "লিফটের ত্বরণ নিচের দিকে হওয়ায় কার্যকর মহাকর্ষীয় ত্বরণ g_eff = (g - a) = (9.8 - 2) = 7.8 m/s²। অতএব আপাত বল R = 60 × 7.8 = 468 N।"
  },
  {
    id: "prob_ch4_01",
    chapter: 4,
    title: "নিক্ষিপ্ত বস্তুর গতিশক্তি ও স্থিতিশক্তির সমতা বিন্দু",
    difficulty: "Top-Tier Conceptual",
    question: "একটি বস্তুকে ভূপৃষ্ঠ হতে 40 m/s বেগে খাড়া উপরের দিকে নিক্ষেপ করা হলো। কোন উচ্চতায় বস্তুটির গতিশক্তি বিভব শক্তির এক-তৃতীয়াংশ (1/3) হবে? (g = 10 m/s² ধরো)",
    options: [
      { text: "20 m", correct: false },
      { text: "40 m", correct: false },
      { text: "60 m", correct: true },
      { text: "75 m", correct: false }
    ],
    hint: "সর্বোচ্চ উচ্চতা H = u^2 / (2g)। শর্তানুসারে মোট শক্তি E = (4/3)Ep = mgH => h = (3/4)H।",
    explanation: "সর্বোচ্চ উচ্চতা H = 1600/20 = 80 m। h = (3/4) * 80 = 60 m।"
  },
  {
    id: "prob_ch5_01",
    chapter: 5,
    title: "হিমশৈলের নিমজ্জন ও তরলের ঘনত্ব অনুপাত",
    difficulty: "Top-Tier Conceptual",
    question: "একটি বরফখণ্ডের ঘনত্ব 900 kg/m³ এবং সমুদ্রের লোনা পানির ঘনত্ব 1025 kg/m³। বরফখণ্ডটি যখন সাগরের পানিতে ভাসে, তখন এর মোট আয়তনের শতকরা কত অংশ পানির উপরে দৃশ্যমান থাকবে?",
    options: [
      { text: "12.2%", correct: true },
      { text: "87.8%", correct: false },
      { text: "10.0%", correct: false },
      { text: "15.5%", correct: false }
    ],
    hint: "ভাসমান বস্তুর ক্ষেত্রে নিমজ্জিত অংশের অনুপাত V_sub / V_total = rho_object / rho_liquid। উপরে থাকা অংশ = 1 - (V_sub / V_total)।",
    explanation: "নিমজ্জিত অংশের ভগ্নাংশ = 900 / 1025 = 0.878 বা 87.8%। সুতরাং পানির উপরে দৃশ্যমান থাকবে (100% - 87.8%) = 12.2%।"
  },
  {
    id: "prob_ch6_01",
    chapter: 6,
    title: "ফারেনহাইট ও সেলসিয়াস স্কেলের অভিন্ন তাপমাত্রা বিন্দু",
    difficulty: "Classic Olympiad",
    question: "কোন নির্দিষ্ট তাপমাত্রায় সেলসিয়াস ও ফারেনহাইট উভয় থার্মোমিটারেই পাঠের সংখ্যাগত মান হুবহু একই পাওয়া যাবে?",
    options: [
      { text: "-40°", correct: true },
      { text: "+40°", correct: false },
      { text: "-32°", correct: false },
      { text: "+100°", correct: false }
    ],
    hint: "C/5 = (F - 32)/9 সমীকরণে C = F = x ধরে সমাধান করো।",
    explanation: "x/5 = (x - 32)/9 => 9x = 5x - 160 => 4x = -160 => x = -40°।"
  },
  {
    id: "prob_ch7_01",
    chapter: 7,
    title: "কুয়ার গভীরতা ও প্রতিধ্বনির সময় গণনা",
    difficulty: "Challenger",
    question: "একটি গভীর কুয়ায় একটি পাথর ফেলে দেওয়ার 3.13 সেকেন্ড পর পানিতে পাথর পড়ার শব্দ শোনা গেল। বায়ুতে শব্দের বেগ 340 m/s এবং g = 9.8 m/s² হলে কুয়ার প্রকৃত গভীরতা কত?",
    options: [
      { text: "44.1 m", correct: true },
      { text: "49.0 m", correct: false },
      { text: "52.5 m", correct: false },
      { text: "38.2 m", correct: false }
    ],
    hint: "মোট সময় t = t_fall + t_sound, যেখানে h = 0.5 * g * t_fall^2 এবং t_sound = h / v।",
    explanation: "ধরি h = 44.1 m। পাথর পড়তে সময় t1 = sqrt(2h/g) = sqrt(88.2/9.8) = sqrt(9) = 3 s। শব্দ উঠে আসতে সময় t2 = 44.1 / 340 = 0.13 s। মোট সময় t = 3 + 0.13 = 3.13 s। সুতরাং সঠিক উত্তর 44.1 m।"
  },
  {
    id: "prob_ch8_01",
    chapter: 8,
    title: "অবতল দর্পণে দ্বিগুণ বিবর্ধিত বাস্তব প্রতিবিম্ব",
    difficulty: "Top-Tier Conceptual",
    question: "20 cm ফোকাস দূরত্বের একটি অবতল দর্পণ থেকে কত দূরত্বে একটি লক্ষ্যবস্তু স্থাপন করলে এর দ্বিগুণ আকারের বাস্তব ও উল্টো প্রতিবিম্ব গঠিত হবে?",
    options: [
      { text: "30 cm", correct: true },
      { text: "10 cm", correct: false },
      { text: "40 cm", correct: false },
      { text: "15 cm", correct: false }
    ],
    hint: "বাস্তব প্রতিবিম্বের জন্য বিবর্ধন m = v / u = 2 => v = 2u। দর্পণের সূত্র 1/u + 1/v = 1/f এ বসাও।",
    explanation: "1/u + 1/(2u) = 1/20 => 3/(2u) = 1/20 => 2u = 60 => u = 30 cm।"
  },
  {
    id: "prob_ch9_01",
    chapter: 9,
    title: "কাঁচ থেকে পানিতে আলোর প্রতিসরণে সংকট কোণ",
    difficulty: "Olympiad / Conceptual",
    question: "কাঁচের প্রতিসরাঙ্ক 1.5 এবং পানির প্রতিসরাঙ্ক 1.33। কাঁচ-পানি সংযোগতলের সংকট কোণ (Critical Angle) কত হবে?",
    options: [
      { text: "62.5°", correct: true },
      { text: "48.6°", correct: false },
      { text: "41.8°", correct: false },
      { text: "75.2°", correct: false }
    ],
    hint: "সংকট কোণের সূত্র sin(theta_c) = n_water / n_glass = 1.33 / 1.5 = 0.8867।",
    explanation: "sin(theta_c) = 1.33 / 1.5 = 0.8867 => theta_c = sin^-1(0.8867) ≈ 62.5°।"
  },
  {
    id: "prob_ch10_01",
    chapter: 10,
    title: "দুটি আধানের মধ্যবর্তী তড়িৎ ক্ষেত্র শূন্য বিন্দু",
    difficulty: "Challenger",
    question: "+16 C এবং +4 C মানের দুটি বিন্দু আধান বায়ুতে পরস্পরের থেকে 30 cm দূরে অবস্থিত। সংযোগকারী সরলরেখার কোন বিন্দুতে লব্ধি তড়িৎ প্রাবল্য শূন্য হবে?",
    options: [
      { text: "+16 C আধান হতে 20 cm দূরে", correct: true },
      { text: "+16 C আধান হতে 15 cm দূরে", correct: false },
      { text: "+4 C আধান হতে 5 cm দূরে", correct: false },
      { text: "+16 C আধান হতে 10 cm দূরে", correct: false }
    ],
    hint: "E1 = E2 => k*q1 / x^2 = k*q2 / (d - x)^2 => sqrt(q1)/x = sqrt(q2)/(d - x)।",
    explanation: "sqrt(16)/x = sqrt(4)/(30 - x) => 4/x = 2/(30 - x) => 2/x = 1/(30 - x) => 60 - 2x = x => 3x = 60 => x = 20 cm (+16 C থেকে)।"
  },
  {
    id: "prob_ch11_01",
    chapter: 11,
    title: "তার টেনে দ্বিগুণ করলে রোধ ও ক্ষমতার পরিবর্তন",
    difficulty: "Top-Tier Conceptual",
    question: "একটি পরিবাহী তারের রোধ R। তারটিকে টেনে আয়তন অপরিবর্তিত রেখে দৈর্ঘ্য তিনগুণ (3L) করা হলো। নতুন তারটির রোধ কত হবে?",
    options: [
      { text: "9R", correct: true },
      { text: "3R", correct: false },
      { text: "6R", correct: false },
      { text: "R/3", correct: false }
    ],
    hint: "আয়তন V = A*L স্থির। দৈর্ঘ্য 3 গুণ হলে ক্ষেত্রফল A' = A/3। R' = rho * (3L)/(A/3) = 9 * rho*L/A।",
    explanation: "দৈর্ঘ্য n গুণ বাড়ালে রোধ n^2 গুণ হয়। এখানে n = 3, তাই নতুন রোধ = 3^2 × R = 9R।"
  },
  {
    id: "prob_ch12_01",
    chapter: 12,
    title: "স্টেপ-ডাউন ট্রান্সফরমারের তড়িৎ প্রবাহ অনুপাত",
    difficulty: "Olympiad / Conceptual",
    question: "একটি ট্রান্সফরমারের মুখ্য ও গৌণ কুণ্ডলীর পাকসংখ্যার অনুপাত Np : Ns = 10 : 1। মুখ্য কুণ্ডলীতে 220 V ভোল্টেজ ও 0.5 A প্রবাহ দিলে গৌণ কুণ্ডলীর ভোল্টেজ ও প্রবাহ কত হবে? (শতভাগ কর্মদক্ষতা)",
    options: [
      { text: "22 V এবং 5 A", correct: true },
      { text: "22 V এবং 0.05 A", correct: false },
      { text: "2200 V এবং 5 A", correct: false },
      { text: "22 V এবং 0.5 A", correct: false }
    ],
    hint: "Vs = Vp * (Ns / Np) এবং Is = Ip * (Np / Ns)।",
    explanation: "Vs = 220 * (1/10) = 22 V। Is = 0.5 * (10/1) = 5 A।"
  },
  {
    id: "prob_ch13_01",
    chapter: 13,
    title: "তেজস্ক্রিয় আইসোটোপের অবশিষ্ট ক্ষয় ভগ্নাংশ",
    difficulty: "Advanced Olympiad",
    question: "একটি তেজস্ক্রিয় পদার্থের অর্ধায়ু 8 দিন। কত দিন পর উক্ত পদার্থের আদি পরিমাণের 1/16 অংশ অবশিষ্ট থাকবে?",
    options: [
      { text: "32 দিন", correct: true },
      { text: "24 দিন", correct: false },
      { text: "16 দিন", correct: false },
      { text: "40 দিন", correct: false }
    ],
    hint: "N / N0 = (1/2)^n = 1/16 = (1/2)^4 => n = 4। মোট সময় t = n * T_half।",
    explanation: "n = 4 অর্ধায়ু। মোট সময় = 4 × 8 দিন = 32 দিন।"
  }
];

window.OLYMPIAD_PROBLEMS = OLYMPIAD_PROBLEMS;
