import { level } from '../authoring';

export default level('B2', [
  {
    id: 'b2-01', title: 'Unreal conditions and wishes', cats: ['conditionals', 'subjunctive'],
    note: `For conditions that are imaginary or contrary to fact, both clauses take the imperfect (می‌ + past): اگر پول داشتم، خانه می‌خریدم (if I had money, I would buy a house); اگر جای تو بودم، نمی‌رفتم (if I were you, I would not go). بودن and داشتن appear without می‌ in the if-clause. The same pattern can refer to the past, but the past perfect makes it explicit: اگر زودتر آمده بودی، او را می‌دیدی / دیده بودی (if you had come earlier, you would have seen him). کاش (if only) follows the same logic: کاش اینجا بودی (I wish you were here), کاش نگفته بودم (I wish I had not said it). Compare the real condition: اگر بیاید، می‌گویم.`,
    ex: [
      'اگر پول *داشتم*، خانه می‌خریدم.|If I had money, I would buy a house.',
      'اگر جای تو بودم، *نمی‌رفتم*.|If I were you, I would not go.',
      'کاش اینجا *بودی*.|I wish you were here.',
      'اگر زودتر آمده بودی، او را *می‌دیدی*.|If you had come earlier, you would have seen him.',
      'اگر می‌دانستم، به تو *می‌گفتم*.|If I had known, I would have told you.',
      'کاش آن حرف را *نزده* بودم.|I wish I had not said that.',
      'اگر باران نمی‌آمد، بیرون *می‌رفتیم*.|If it were not raining, we would go out.',
      'اگر بیشتر درس خوانده *بودم*، قبول می‌شدم.|If I had studied more, I would have passed.',
    ],
    alts: ['داشتم', 'دارم', 'داشته باشم', 'نمی‌رفتم', 'نمی‌روم', 'بودی', 'باشی', 'هستی', 'می‌دیدی', 'می‌بینی', 'می‌گفتم', 'می‌گویم', 'نزده', 'نزنم', 'می‌رفتیم', 'می‌رویم', 'بودم', 'باشم'],
    vocab: ['کاش|if only', 'جایِ|in the place of', 'افسوس|regret; alas', 'پشیمان|regretful', 'فرصت|opportunity', 'تصور کردن|to imagine', 'واقعیت|reality', 'گذشته|the past'],
    read: {
      title: 'اگر می‌توانستم برگردم',
      text: `اغلب از من می‌پرسند اگر می‌توانستم دوباره شروع کنم، چه چیزی را عوض می‌کردم. اگر به گذشته برمی‌گشتم، احتمالاً در جوانی زبان‌های بیشتری یاد می‌گرفتم؛ اگر آلمانی بلد بودم، آن کار را در برلین رد نمی‌کردم. اما بعد فکر می‌کنم که اگر رفته بودم، با همسرم آشنا نمی‌شدم و امروز بچه‌هایم را نداشتم. برای همین به «اگر» زیاد اعتماد ندارم. کاش می‌شد گذشته را درست کرد! ولی نمی‌شود. با این حال، اگر فردا فرصتِ تازه‌ای پیش بیاید، بدون تردید قبولش می‌کنم.`,
      qs: ['نویسنده اگر به گذشته برمی‌گشت چه می‌کرد؟|زبان‌های بیشتری یاد می‌گرفت|ازدواج نمی‌کرد|به برلین می‌رفت|کارش را عوض می‌کرد', 'چرا کارِ برلین را رد کرد؟|چون آلمانی بلد نبود|چون بچه داشت|چون حقوقش کم بود|چون سفر را دوست نداشت', 'اگر رفته بود چه چیزی را از دست می‌داد؟|آشنایی با همسرش و بچه‌هایش|خانه‌اش|دوستانش در برلین|شغلِ فعلی‌اش'],
    },
  },
  {
    id: 'b2-02', title: 'Light-verb pairs: doing, becoming, getting', cats: ['compound-verbs', 'passive'],
    note: `Compound verbs come in families whose light verb decides who does what to whom. کردن makes the active and شدن its passive or "happen by itself" partner: تمام کردن (to finish something) / تمام شدن (to come to an end); گم کردن (to lose) / گم شدن (to get lost). دادن (to give) pairs with خوردن or گرفتن for the receiving side: شکست دادن (to defeat) / شکست خوردن (to be defeated); فریب دادن / فریب خوردن (to be deceived); یاد دادن (to teach) / یاد گرفتن (to learn). True causatives add ـاندن to the present stem: خوردن → خوراندن (to feed), رسیدن → رساندن (to deliver), فهمیدن → فهماندن (to make understand), خوابیدن → خواباندن (to put to sleep), ترسیدن → ترساندن (to frighten).`,
    ex: [
      'کلیدهایم را گم *کردم*.|I lost my keys.',
      'در شهر گم *شدیم*.|We got lost in the city.',
      'تیمِ ما شکست *خورد*.|Our team was defeated.',
      'او به من رانندگی یاد *داد*.|He taught me to drive.',
      'نامه را به دستش *رساندم*.|I delivered the letter into his hands.',
      'بچه را *خواباندم*.|I put the child to sleep.',
      'صدای ناگهانی مرا *ترساند*.|The sudden noise frightened me.',
      'جلسه ساعتِ پنج تمام *شد*.|The meeting ended at five.',
    ],
    alts: ['کردم', 'شدم', 'شدیم', 'کردیم', 'خورد', 'داد', 'گرفت', 'رساندم', 'رسیدم', 'خواباندم', 'خوابیدم', 'ترساند', 'ترسید', 'شد', 'کرد'],
    vocab: ['گم کردن|to lose', 'گم شدن|to get lost', 'شکست خوردن|to be defeated', 'یاد دادن|to teach', 'رساندن|to deliver, to take to', 'ترساندن|to frighten', 'فهماندن|to make understand', 'فریب خوردن|to be deceived'],
    read: {
      title: 'چطور رانندگی یاد گرفتم',
      text: `پدرم وقتی هجده ساله بودم به من رانندگی یاد داد و تجربهٔ آسانی نبود. او در کارخانه به کارگرهای تازه آموزش می‌داد، پس فکر کرد می‌تواند دخترش را هم آموزش بدهد. در اولین جلسه ماشین را به دیوار زدم و چراغش شکست. عصبانی نشد؛ فقط لبخند زد و گفت: «همه از اشتباه یاد می‌گیرند.» کم‌کم یاد گرفتم پارک کنم و آرامشم را حفظ کنم. امروز خودم به پسرم یاد می‌دهم و تازه می‌فهمم پدرم چقدر صبور بود. هر وقت پسرم مرا می‌ترساند، سعی می‌کنم مثلِ او لبخند بزنم — هرچند همیشه موفق نمی‌شوم.`,
      qs: ['پدرِ راوی در کارخانه چه می‌کرد؟|به کارگرهای تازه آموزش می‌داد|کامیون می‌راند|ماشین تعمیر می‌کرد|مدیر بود', 'در اولین جلسه چه شد؟|ماشین را به دیوار زد|در امتحان قبول شد|پدرش عصبانی شد|کلیدها را گم کرد', 'راوی امروز چه چیزی را می‌فهمد؟|این‌که پدرش چقدر صبور بود|این‌که رانندگی آسان است|این‌که پسرش بهتر می‌راند|این‌که ماشین‌های قدیمی بهترند'],
    },
  },
  {
    id: 'b2-03', title: 'Must have, may have: past subjunctive', cats: ['subjunctive', 'modals'],
    note: `The past subjunctive is the past participle + the subjunctive of بودن: رفته باشم, رفته باشی, رفته باشد…. It is used where the subjunctive is needed but the action is already complete. Deduction: باید رفته باشد (he must have gone); حتماً فراموش کرده است (he has surely forgotten). Possibility: شاید دیده باشد (he may have seen); ممکن است رسیده باشند. Hope and doubt about the past: امیدوارم خوب خوابیده باشی (I hope you slept well); فکر نمی‌کنم گفته باشد. In relative clauses about unknown people: کسی را می‌خواهم که در ایران زندگی کرده باشد. Past obligation uses باید + imperfect: باید می‌رفتم (I should have gone / I had to go); نباید می‌گفتی (you should not have said it).`,
    ex: [
      'او باید تا حالا *رسیده* باشد.|He must have arrived by now.',
      'شاید نامه را *ندیده* باشد.|He may not have seen the letter.',
      'امیدوارم خوب *خوابیده* باشی.|I hope you slept well.',
      'باید زودتر به من *می‌گفتی*.|You should have told me earlier.',
      'نباید آن حرف را *می‌زدم*.|I should not have said that.',
      'فکر نمی‌کنم فراموش *کرده* باشد.|I do not think he has forgotten.',
      'ممکن است اشتباه کرده *باشیم*.|We may have made a mistake.',
      'حتماً جایی آن را *دیده‌ام*.|I have surely seen it somewhere.',
    ],
    alts: ['رسیده', 'می‌رسد', 'ندیده', 'نمی‌بیند', 'خوابیده', 'می‌خوابی', 'می‌گفتی', 'بگویی', 'می‌زدم', 'بزنم', 'کرده', 'می‌کند', 'باشیم', 'هستیم', 'دیده‌ام', 'دیده باشم'],
    vocab: ['حتماً|surely, certainly', 'احتمالاً|probably', 'ممکن است|it is possible', 'فراموش کردن|to forget', 'اشتباه کردن|to make a mistake', 'تا حالا|by now', 'لابد|presumably', 'بعید است|it is unlikely'],
    read: {
      title: 'قطارِ ساعتِ هفت',
      text: `وقتی به ایستگاه رسیدم، قطار رفته بود. باورم نمی‌شد: دو بار ساعت کوک کرده بودم. به رئیسم زنگ زدم، ولی جواب نداد؛ لابد واردِ جلسه شده بود. با خودم گفتم باید تاکسی می‌گرفتم؛ اگر گرفته بودم، حتماً می‌رسیدم. بلیتِ دیگری خریدم و حساب کردم: تا ساعتِ یازده باید به اصفهان رسیده باشم، اما جلسه تا آن موقع تمام شده است. شاید همکارانم بدونِ من شروع کرده باشند. خوشبختانه پیامی رسید: جلسه عقب افتاده بود، چون مشتری هم نرسیده بود. نباید آن‌قدر نگران می‌شدم.`,
      qs: ['چرا راوی فکر می‌کند رئیسش جواب نداد؟|لابد واردِ جلسه شده بود|چون عصبانی بود|چون تلفنش خراب بود|چون در مرخصی بود', 'راوی فکر می‌کند چه باید می‌کرد؟|باید تاکسی می‌گرفت|باید زودتر می‌خوابید|باید به رئیس خبر می‌داد|باید بلیت دیگری نمی‌خرید', 'چرا جلسه عقب افتاد؟|چون مشتری هم نرسیده بود|چون قطار خراب شد|چون رئیس تصمیم گرفت|چون همکاران نیامدند'],
    },
  },
  {
    id: 'b2-04', title: 'Aspect: about to, still, no longer, gradually', cats: ['aspect', 'verb-prefix-mi'],
    note: `Persian marks fine shades of time with adverbs and helper verbs. داشتم + imperfect: an action in progress or just about to happen — داشتم می‌افتادم (I was about to fall). نزدیک بود + subjunctive: nearly — نزدیک بود بیفتم. هنوز: still; هنوز … نـ: not yet. دیگر + negative: no longer — دیگر آنجا کار نمی‌کنم. همین الان / تازه: just now. کم‌کم, رفته‌رفته: gradually. مدام, پیوسته, همه‌اش: constantly. "For (duration up to now)" uses the present or perfect with است که: دو سال است که اینجا زندگی می‌کنم (I have been living here for two years); خیلی وقت است او را ندیده‌ام. شروع کردن به + infinitive: to begin; ادامه دادن به: to continue; دست برداشتن از / دست کشیدن از: to stop, give up.`,
    ex: [
      'دو سال *است* که اینجا زندگی می‌کنم.|I have been living here for two years.',
      'نزدیک *بود* بیفتم.|I nearly fell.',
      'او *دیگر* اینجا کار نمی‌کند.|He no longer works here.',
      '*هنوز* شام نخورده‌ام.|I have not had dinner yet.',
      '*کم‌کم* دارم عادت می‌کنم.|I am gradually getting used to it.',
      'شروع کرد به گریه *کردن*.|He began to cry.',
      'خیلی وقت است او را *ندیده‌ام*.|I have not seen him for a long time.',
      'بالاخره از سیگار دست *کشید*.|He finally gave up smoking.',
    ],
    alts: ['است', 'بود', 'دیگر', 'هنوز', 'کم‌کم', 'تازه', 'کردن', 'کرد', 'ندیده‌ام', 'ندیدم', 'کشید', 'زد', 'هرگز'],
    vocab: ['دیگر|no longer; other', 'نزدیک بود|nearly', 'کم‌کم|gradually', 'مدام|constantly', 'عادت کردن|to get used to', 'ادامه دادن|to continue', 'دست کشیدن|to give up', 'بالاخره|finally'],
    read: {
      title: 'عادت‌های پدربزرگ',
      text: `پدربزرگ ده سال است که بازنشسته شده، اما عادت‌هایش عوض نشده است. هنوز ساعتِ پنجِ صبح بیدار می‌شود و مدام در باغچه کار می‌کند. در جوانی هر روز ده کیلومتر پیاده می‌رفت؛ حالا بعد از دو کیلومتر کم‌کم خسته می‌شود، ولی دست برنمی‌دارد. وقتی می‌گوییم استراحت کن، شروع می‌کند به خندیدن: «آدم تا راه می‌رود زنده است.» پارسال که مریض شد، دکتر دیگر اجازه نداد بیرون برود. یک هفته هم طاقت نیاورد؛ یک روز صبح دیدیم که دارد یواشکی به باغچه آب می‌دهد. نزدیک بود مادرم سکته کند.`,
      qs: ['پدربزرگ هر روز صبح چه می‌کند؟|در باغچه کار می‌کند|روزنامه می‌خواند|تا دیروقت می‌خوابد|تلویزیون تماشا می‌کند', 'در جوانی چه عادتی داشت؟|هر روز ده کیلومتر پیاده می‌رفت|هر روز می‌دوید|دوچرخه‌سواری می‌کرد|هیچ ورزشی نمی‌کرد', 'وقتی دکتر بیرون رفتن را ممنوع کرد چه شد؟|یواشکی به باغچه رفت|ماه‌ها استراحت کرد|عصبانی شد و رفت|باغچه را فروخت'],
    },
  },
  {
    id: 'b2-05', title: 'Word building and Arabic elements', cats: ['vocabulary', 'spelling'],
    note: `Persian builds words freely. Prefixes: بی‌ (without) — بی‌کار (unemployed); با (with) — باهوش (intelligent); نا (un-) — ناراحت (upset); هم (co-) — همکار (colleague); پر (full of) — پرجمعیت (crowded). Suffixes: ـی (abstract noun or adjective) — خوبی (goodness), ایرانی; ـگاه (place) — دانشگاه (university); ـستان — بیمارستان (hospital); ـمند / ـدار (having) — ثروتمند (wealthy), خانه‌دار; ـگر / ـکار / ـچی (doer) — کارگر (worker), ورزشکار; ـانه — روزانه (daily). Verb stems make nouns: دانش (knowledge), گفتار (speech), خریدار (buyer). Arabic loans keep their own plurals in formal style — کتاب → کتب, شاعر → شعرا, مسئله → مسائل, خبر → اخبار — and related words share a root: علم (knowledge), عالم (scholar), معلم (teacher), تعلیم (teaching).`,
    ex: [
      'برادرم فعلاً *بی‌کار* است.|My brother is unemployed for now.',
      'او دخترِ بسیار *باهوشی* است.|She is a very intelligent girl.',
      'تهران شهری *پرجمعیت* است.|Tehran is a crowded city.',
      'او با *همکارانش* رابطهٔ خوبی دارد.|He has a good relationship with his colleagues.',
      'از شنیدنِ این خبر *ناراحت* شدم.|I was upset to hear this news.',
      'پدرش مردی *ثروتمند* بود.|His father was a wealthy man.',
      'این روزنامه *روزانه* منتشر می‌شود.|This newspaper is published daily.',
      'کشور با *مسائلِ* اقتصادی روبه‌رو است.|The country faces economic problems.',
    ],
    alts: ['بی‌کار', 'باکار', 'باهوشی', 'بی‌هوشی', 'پرجمعیت', 'کم‌جمعیت', 'همکارانش', 'کارگرانش', 'ناراحت', 'راحت', 'ثروتمند', 'بی‌پول', 'روزانه', 'شبانه', 'مسائلِ', 'مسئلهٔ'],
    vocab: ['بی‌کار|unemployed', 'باهوش|intelligent', 'ناراحت|upset, uncomfortable', 'همکار|colleague', 'دانشگاه|university', 'بیمارستان|hospital', 'ثروتمند|wealthy', 'مسائل|problems, issues'],
    read: {
      title: 'زبانی با دو ریشه',
      text: `کسی که فارسی یاد می‌گیرد زود متوجه می‌شود که این زبان دو خزانهٔ واژه دارد. واژه‌های کهنِ ایرانی — نان، آب، مادر، دوست — هستهٔ زندگیِ روزمره‌اند. در کنارِ آنها هزاران واژهٔ عربی وارد شده که بیشتر در دین، دانش و اداره به کار می‌روند: کتاب، علم، حکومت. فارسی این واژه‌ها را به‌سادگی با پیشوندها و پسوندهای خودش ترکیب می‌کند: «بی‌ادب»، «علمی»، «کتابخانه». نویسندهٔ خوب می‌داند کِی «دانش» بگوید و کِی «علم»؛ اولی گرم‌تر است و دومی رسمی‌تر. فارسی هویتش را از دست نداده؛ فقط یاد گرفته با دو صدا حرف بزند.`,
      qs: ['واژه‌های عربی بیشتر در چه زمینه‌هایی به کار می‌روند؟|دین، دانش و اداره|خانواده و خوراک|ورزش و بازی|کشاورزی', 'فارسی با واژه‌های عربی چه می‌کند؟|آنها را با پیشوند و پسوندِ خودش ترکیب می‌کند|آنها را حذف می‌کند|آنها را بدونِ تغییر نگه می‌دارد|فقط در شعر به کار می‌برد', 'به نظرِ نویسنده تفاوتِ «دانش» و «علم» چیست؟|اولی گرم‌تر و دومی رسمی‌تر است|هیچ تفاوتی ندارند|اولی عربی است|دومی قدیمی شده است'],
    },
  },
  {
    id: 'b2-06', title: 'Ta\'ârof and polite register', cats: ['register'],
    note: `Iranian politeness, تعارف (ta'ârof), is a ritual of offering and declining that you must recognise to avoid misunderstandings. A host insists and a guest refuses at least once: «بفرمایید!» — «نه، ممنون، زحمت نکشید.» A shopkeeper may say قابلی ندارد ("it is not worthy of you") — you still pay. Honorific verbs raise the other person and lower yourself: فرمودن (to say/do, of them) versus عرض کردن (to say, of oneself); تشریف آوردن / تشریف بردن (to come / to go); میل داشتن / میل کردن (to want / to eat). Set phrases: خسته نباشید (to someone working), دستِ شما درد نکند (thank you for your trouble), قربانِ شما, چشم (certainly, "upon my eye"), ببخشید مزاحم شدم, اختیار دارید (not at all), سلام برسانید.`,
    ex: [
      'خیلی خوش آمدید، *بفرمایید* داخل.|You are very welcome, please come in.',
      'دستِ شما درد *نکند*.|Thank you for your trouble.',
      'چه *میل* دارید، چای یا قهوه؟|What would you like, tea or coffee?',
      'زحمت *نکشید*، همین خوب است.|Please do not trouble yourself, this is fine.',
      'خسته *نباشید*!|More power to you! (to someone working)',
      '*چشم*، حتماً می‌آیم.|Certainly, I will definitely come.',
      'کِی *تشریف* می‌آورید؟|When will you come? (honorific)',
      'قابلی *ندارد*.|It is nothing. (ritual offer)',
    ],
    alts: ['بفرمایید', 'بیا', 'نکند', 'بکند', 'میل', 'دوست', 'نکشید', 'بکشید', 'نباشید', 'باشید', 'چشم', 'نه', 'تشریف', 'زود', 'ندارد', 'دارد'],
    vocab: ['تعارف|ritual politeness', 'خوش آمدید|welcome', 'زحمت|trouble, bother', 'فرمودن|to say (honorific)', 'عرض کردن|to say (humble)', 'تشریف آوردن|to come (honorific)', 'چشم|certainly; eye', 'اختیار دارید|not at all'],
    read: {
      title: 'مهمانی',
      text: `— سلام آقای دکتر! خیلی خوش آمدید، بفرمایید داخل.
— سلام، ببخشید بدونِ خبر مزاحم شدم.
— اختیار دارید، قدمتان روی چشم. چه میل دارید؟ چای، شربت؟
— زحمت نکشید، چیزی نمی‌خورم.
— زحمتی نیست! بفرمایید، چه فرمایشی داشتید؟
— عرض کنم که هفتهٔ آینده در دانشگاه شبِ شعر داریم. اگر شما سخنرانی بفرمایید، مایهٔ افتخارِ ماست.
— لطف دارید. چشم، حتماً خدمت می‌رسم.
— دستِ شما درد نکند. خب، با اجازه مرخص می‌شوم.
— کجا؟ تا چای نخورید نمی‌گذارم بروید!`,
      qs: ['مهمان برای چه چیزی عذرخواهی می‌کند؟|برای این‌که بدونِ خبر آمده است|برای دیر آمدن|برای نخوردنِ چای|برای زود رفتن', 'مهمان برای چه کاری آمده بود؟|دعوت به سخنرانی در شبِ شعر|پس دادنِ کتاب|درخواستِ کار|شکایت', 'میزبان در پایان چه می‌گوید؟|تا چای نخورید نمی‌گذارم بروید|حالا می‌توانید بروید|من کار دارم|فردا دوباره بیایید'],
    },
  },
  {
    id: 'b2-07', title: 'Complex connectors', cats: ['subordination', 'discourse'],
    note: `Longer sentences need more precise links. Concession: هرچند / اگرچه … ولی (although), با این‌که, با وجودِ این‌که, با این حال (nevertheless), به هر حال (in any case). Cause: از آنجا که (since), به دلیلِ این‌که, زیرا. Result: به طوری که (so that, such that), در نتیجه (as a result), از این رو (hence). Contrast: در حالی که (whereas), بلکه (but rather), برعکس (on the contrary). Addition: نه تنها … بلکه … هم (not only … but also), همچنین (likewise), به علاوه. Alternatives: یا … یا (either … or), نه … نه (neither … nor), چه … چه (whether … or). Condition: به شرطِ این‌که, مگر این‌که, در صورتی که. Purpose: تا, برای این‌که, به منظورِ.`,
    ex: [
      '*هرچند* خسته بود، به کارش ادامه داد.|Although he was tired, he continued his work.',
      'او نه تنها باهوش است، *بلکه* سخت‌کوش هم هست.|He is not only intelligent but also hardworking.',
      'از *آنجا* که باران می‌آمد، مسابقه لغو شد.|Since it was raining, the match was cancelled.',
      'خیلی شلوغ بود، به *طوری* که صدا به صدا نمی‌رسید.|It was so crowded that you could not hear a thing.',
      'من کار می‌کنم، در *حالی* که او استراحت می‌کند.|I work, whereas he rests.',
      '*یا* امروز بیا یا فردا.|Come either today or tomorrow.',
      'مریض بود؛ با این *حال*، کارش را تمام کرد.|He was ill; nevertheless, he finished his work.',
      'می‌آیم، به *شرطِ* این‌که تو هم بیایی.|I will come, on condition that you come too.',
    ],
    alts: ['هرچند', 'چون', 'بلکه', 'ولی', 'آنجا', 'اینجا', 'طوری', 'جایی', 'حالی', 'وقتی', 'یا', 'نه', 'حال', 'شرطِ', 'دلیلِ'],
    vocab: ['هرچند|although', 'با این حال|nevertheless', 'از آنجا که|since', 'در نتیجه|as a result', 'در حالی که|whereas, while', 'نه تنها … بلکه|not only … but also', 'به طوری که|so that, such that', 'به علاوه|moreover'],
    read: {
      title: 'شهر یا روستا؟',
      text: `خیلی‌ها آرزو دارند شهر را ترک کنند؛ با این حال، کمتر کسی این کار را می‌کند. از آنجا که من از خانه کار می‌کنم، دو سال پیش به روستا رفتم. اینجا نه تنها زندگی ارزان‌تر است، بلکه هوا هم پاک‌تر است. هرچند دلم برای سینما و کتاب‌فروشی‌ها تنگ می‌شود، برنمی‌گردم. البته همه‌چیز عالی نیست: به دلیلِ کمبودِ پزشک، گاهی باید یک ساعت رانندگی کنم. از این رو توصیه می‌کنم قبل از تصمیم‌گیری یک ماه خانه‌ای اجاره کنید، تا ببینید زندگیِ واقعی در آنجا چگونه است.`,
      qs: ['چرا نویسنده توانست به روستا برود؟|چون از خانه کار می‌کند|چون بازنشسته شد|چون آنجا کار پیدا کرد|چون خانواده‌اش آنجاست', 'دلش برای چه چیزهایی تنگ می‌شود؟|سینما و کتاب‌فروشی‌ها|ترافیک و شلوغی|پزشک‌ها|هوای شهر', 'توصیهٔ او چیست؟|قبل از تصمیم یک ماه خانه اجاره کنید|فوراً به روستا بروید|هرگز شهر را ترک نکنید|در روستا خانه بخرید'],
    },
  },
]);
