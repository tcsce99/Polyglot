import { level } from '../authoring';

export default level('B1', [
  {
    id: 'b1-01', title: 'Perfect tenses: رفته‌ام، رفته بودم', cats: ['past'],
    note: `The past participle is the past stem + ـه (-e): رفته (rafte, gone), دیده (dide, seen), خورده (khorde, eaten). Add the short forms of "to be" for the present perfect, which links the past to now: رفته‌ام (rafte-am, I have gone), رفته‌ای، رفته است، رفته‌ایم، رفته‌اید، رفته‌اند. Add the past of بودن for the past perfect: رفته بودم (I had gone). Negatives: نرفته‌ام، نرفته بودم. Persian also uses the perfect for a state that results from an action: نشسته است (he is seated), ایستاده‌ام (I am standing), خوابیده (asleep). Useful words: تا حالا (so far, ever), هنوز … نه (not yet), هرگز / هیچ‌وقت (never), قبلاً (already, before), تازه (just).`,
    ex: [
      'تا حالا به ایران *رفته‌اید*؟|Have you ever been to Iran?',
      'من این فیلم را *دیده‌ام*.|I have seen this film.',
      'او هنوز *نیامده* است.|He has not come yet.',
      'وقتی رسیدم، قطار رفته *بود*.|When I arrived, the train had left.',
      'هرگز چنین چیزی *نشنیده* بودم.|I had never heard such a thing.',
      'بچه‌ها *خوابیده‌اند*.|The children are asleep.',
      'تازه از سفر *برگشته‌ایم*.|We have just come back from a trip.',
      'او روی صندلی *نشسته* است.|He is sitting on the chair.',
    ],
    alts: ['رفته‌اید', 'رفتید', 'دیده‌ام', 'دیدم', 'نیامده', 'نیامد', 'بود', 'است', 'نشنیده', 'نشنیدم', 'خوابیده‌اند', 'خوابیدند', 'برگشته‌ایم', 'برگشتیم', 'نشسته', 'نشست'],
    vocab: ['تا حالا|so far, ever', 'هنوز|still, yet', 'هرگز|never', 'تازه|just, recently', 'رسیدن|to arrive', 'شنیدن|to hear', 'خوابیدن|to sleep', 'ایستادن|to stand'],
    read: {
      title: 'اولین سفر',
      text: `من در زندگی‌ام سفرهای زیادی کرده‌ام، اما اولین سفرم را هرگز فراموش نکرده‌ام. ده ساله بودم و تا آن روز قطار ندیده بودم. از تهران به مشهد می‌رفتیم. در ایستگاه آن‌قدر آدم بود که ترسیدم. پدرم دستم را گرفت و گفت: «نترس.» وقتی قطار حرکت کرد، کنار پنجره نشسته بودم و برای اولین بار کویر و کوه‌ها را می‌دیدم. وقتی به مشهد رسیدیم، تصمیمم را گرفته بودم: وقتی بزرگ شدم، دنیا را می‌بینم. حالا به سی کشور رفته‌ام، ولی هنوز هم صدای آن قطار در گوشم مانده است.`,
      qs: ['How old was the narrator on the first journey?|Ten years old|Five years old|Twenty years old|Thirty years old', 'Why was the narrator frightened at the station?|There were so many people|The train was late|It was dark|The father had left', 'What had the narrator decided by the time they arrived?|To see the world when grown up|Never to travel again|To become a train driver|To live in Mashhad'],
    },
  },
  {
    id: 'b1-02', title: 'Relative clauses with که', cats: ['relative-clauses'],
    note: `One word, که (ke), does the work of "who", "which", "that", "where" and "when". The noun it describes usually takes an unstressed ـی (-i): مردی که آنجا ایستاده، برادرم است (the man who is standing there is my brother); کتابی که خریدم (the book that I bought). Names, pronouns and nouns that already have a possessive ending do not take the ـی. If the noun is the specific object of the main verb, را follows the ـی: کتابی را که خریدم خواندم. When the noun is governed by a preposition inside the clause, a pronoun stays behind: دوستی که با او سفر کردم (the friend I travelled with — "with him"). آنچه (ânche) means "what, that which"; جایی که "the place where"; وقتی که "when".`,
    ex: [
      'مردی *که* آنجا ایستاده، برادرم است.|The man who is standing there is my brother.',
      '*کتابی* که خریدم خیلی جالب است.|The book that I bought is very interesting.',
      'شهری که در آن به دنیا *آمدم* کوچک است.|The city where I was born is small.',
      'آنچه *گفتی* درست بود.|What you said was right.',
      'دوستی که با *او* سفر کردم، آلمانی است.|The friend I travelled with is German.',
      'فیلمی *را* که گفتی دیدم.|I saw the film that you mentioned.',
      'روزی که تو *آمدی* باران می‌آمد.|The day you came, it was raining.',
      'کسی که زیاد *می‌خواند*، زیاد می‌داند.|Someone who reads a lot knows a lot.',
    ],
    alts: ['که', 'چه', 'کتابی', 'کتاب', 'آمدم', 'آمد', 'گفتی', 'بگویی', 'او', 'آن', 'را', 'به', 'آمدی', 'می‌خواند', 'بخواند'],
    vocab: ['که|who, which, that', 'آنچه|what, that which', 'کسی که|someone who', 'جایی که|the place where', 'به دنیا آمدن|to be born', 'جالب|interesting', 'سفر کردن|to travel', 'درست|right, correct'],
    read: {
      title: 'همسایه‌ای که نمی‌شناختم',
      text: `در آپارتمانی که روبه‌روی خانهٔ من است پیرمردی زندگی می‌کند که هرگز با او حرف نزده بودم. فقط چیزهایی را می‌دانستم که همسایه‌ها می‌گفتند: این‌که ملوان بوده و به کشورهایی رفته که ما فقط در کتاب‌ها درباره‌شان خوانده‌ایم. هفتهٔ پیش نامه‌ای پیدا کردم که برای او بود و برایش بردم. مرا به اتاقی برد که در آن یادگارهای سفرهایش را نگه می‌دارد: نقشه‌ها، عکس‌ها و ساعتی که یک ناخدای ژاپنی به او داده بود. حالا هر پنجشنبه با او چای می‌خورم. آدم‌هایی که هر روز از کنارشان می‌گذریم داستان‌هایی دارند که تصورش را هم نمی‌کنیم.`,
      qs: ['What did the neighbours say about the old man?|That he had been a sailor|That he was unfriendly|That he was a teacher|That he had no family', 'Why did the narrator go to his door?|To bring him a letter that was for him|To complain about noise|To borrow a map|To invite him to tea', 'What does the narrator now do every Thursday?|Has tea with him|Brings his post|Travels with him|Cleans his room'],
    },
  },
  {
    id: 'b1-03', title: 'If: real conditions', cats: ['conditionals', 'subjunctive'],
    note: `"If" is اگر (agar). For a condition that may well happen, use the subjunctive (or, in speech, the present) in the if-clause and the present or future in the result: اگر باران بیاید، خانه می‌مانیم (if it rains, we will stay home). If the condition must be completed first, Persian often uses the simple past with future meaning: اگر او را دیدی، سلام برسان (if you see him, say hello). With بودن and داشتن use باشد and داشته باشد: اگر وقت داشته باشی… . The result can be a command. Related words: وگرنه (otherwise), مگر این‌که (unless), به شرطی که (on condition that), در صورتی که (in case).`,
    ex: [
      '*اگر* باران بیاید، خانه می‌مانیم.|If it rains, we will stay at home.',
      'اگر وقت *داشته* باشی، بیا پیشِ من.|If you have time, come to my place.',
      'اگر او را *دیدی*، سلام برسان.|If you see him, give him my regards.',
      'اگر درس *نخوانی*، قبول نمی‌شوی.|If you do not study, you will not pass.',
      'زود باش، *وگرنه* دیر می‌رسیم.|Hurry up, otherwise we will arrive late.',
      'اگر بخواهید، می‌توانم کمک *کنم*.|If you like, I can help.',
      'می‌آیم، *مگر* این‌که مریض باشم.|I will come, unless I am ill.',
      'اگر گران *نباشد*، می‌خرمش.|If it is not expensive, I will buy it.',
    ],
    alts: ['اگر', 'وقتی', 'داشته', 'دارم', 'دیدی', 'می‌بینی', 'نخوانی', 'نمی‌خوانی', 'وگرنه', 'ولی', 'کنم', 'می‌کنم', 'مگر', 'نباشد', 'نیست'],
    vocab: ['اگر|if', 'وگرنه|otherwise', 'مگر این‌که|unless', 'به شرطی که|on condition that', 'ماندن|to stay', 'قبول شدن|to pass, to be accepted', 'مریض|ill', 'سلام رساندن|to give regards'],
    read: {
      title: 'یادداشت روی یخچال',
      text: `لیلای عزیزم، من تا جمعه نیستم. اگر گرسنه شدی، در یخچال ماکارونی هست؛ فقط گرمش کن. اگر صاحب‌خانه زنگ زد، بگو که اجاره را پرداخته‌ام. اگر باران آمد، لطفاً لباس‌ها را از پشت‌بام جمع کن. گربه روزی دو بار غذا می‌خورد؛ اگر تو را نبیند، گریه می‌کند، پس یادت نرود! اگر خواستی دوستانت را دعوت کنی، اشکالی ندارد، به شرطی که بعد از ساعت یازده سروصدا نکنند. و اگر کار فوری پیش آمد، به من زنگ بزن. قربانت، مامان`,
      qs: ['What should Leila say if the landlord calls?|That the rent has been paid|That her mother is ill|That he should call on Friday|That she will pay tomorrow', 'What must she do if it rains?|Collect the clothes from the roof|Close the windows|Feed the cat|Call her mother', 'On what condition may she invite friends?|That they make no noise after eleven|That they bring food|That they leave by nine|That the landlord agrees'],
    },
  },
  {
    id: 'b1-04', title: 'The subjunctive: wishes, doubt and purpose', cats: ['subjunctive', 'subordination'],
    note: `Beyond modal verbs, the subjunctive follows anything that presents an action as wished, possible, necessary or intended rather than as fact. Wishes and hopes: امیدوارم بیایی (I hope you come), دوست دارم بمانم (I would like to stay), کاش بیاید (if only he would come). Doubt and possibility: شاید نیاید, ممکن است دیر برسم (I may arrive late), فکر نمی‌کنم بداند (I do not think he knows). Necessity: لازم است بروم, بهتر است صبر کنی (you had better wait). Purpose with تا or که: آمدم تا تو را ببینم (I came to see you). Also after قبل از این‌که (before) and بدونِ این‌که (without). For completed actions use the past subjunctive: شاید رفته باشد (he may have gone).`,
    ex: [
      'امیدوارم حالت خوب *باشد*.|I hope you are well.',
      'آمدم تا تو را *ببینم*.|I came to see you.',
      'ممکن است دیر *برسم*.|I may arrive late.',
      'بهتر است کمی صبر *کنی*.|You had better wait a little.',
      'فکر نمی‌کنم او *بداند*.|I do not think he knows.',
      'قبل از این‌که *بروی*، به من زنگ بزن.|Before you go, call me.',
      'کاش فردا هوا خوب *باشد*.|If only the weather is good tomorrow.',
      'شاید او *رفته* باشد.|He may have gone.',
    ],
    alts: ['باشد', 'است', 'ببینم', 'می‌بینم', 'برسم', 'می‌رسم', 'کنی', 'می‌کنی', 'بداند', 'می‌داند', 'بروی', 'می‌روی', 'رفته', 'می‌رود'],
    vocab: ['امیدوار بودن|to hope', 'ممکن است|it is possible', 'لازم است|it is necessary', 'بهتر است|it is better', 'کاش|if only', 'تا|so that; until', 'قبل از این‌که|before', 'بدونِ این‌که|without'],
    read: {
      title: 'نامه‌ای به مادر',
      text: `مادر عزیزم، امیدوارم حالتان خوب باشد. خیلی دوست دارم امسال عید را پیش من بگذرانید. شاید بگویید سفر طولانی است، اما من بلیت می‌فرستم تا هیچ نگرانی نداشته باشید. لازم است از دکتر بپرسید که آیا می‌توانید با هواپیما سفر کنید. ممکن است پدر هم بتواند بیاید؟ بچه‌ها هر روز می‌پرسند مادربزرگ کِی می‌آید. کاش همه با هم سرِ سفرهٔ هفت‌سین بنشینیم! قبل از این‌که تصمیم بگیرید، لطفاً به من زنگ بزنید. امیدوارم همیشه سالم باشید. پسرتان، کامران`,
      qs: ['What does Kamran want his mother to do?|Spend the New Year holiday with him|Send him money|Move in permanently|Look after the children', 'Why will he send the ticket?|So that she has no worries|Because tickets are cheaper there|Because his father asked|Because she lost hers', 'What should she ask the doctor?|Whether she can travel by plane|Whether she needs medicine|Whether his father is well|Whether she can walk far'],
    },
  },
  {
    id: 'b1-05', title: 'Linking ideas', cats: ['subordination'],
    note: `Reason: چون (chon, because/since), زیرا (formal "because"), برای این‌که, به خاطرِ (because of + noun). Result: پس (so), بنابراین (therefore), برای همین (that is why). Contrast: ولی / اما (but), با این‌که or اگرچه (although), با وجودِ (despite + noun). Time: وقتی (که) (when), بعد از این‌که + past/subjunctive (after), قبل از این‌که + subjunctive (before), تا (until; as soon as), همین‌که (as soon as), در حالی که (while). Addition: هم … هم (both … and), نه … نه (neither … nor), علاوه بر این (besides). Persian often puts the reason first: چون خسته بودم، زود خوابیدم.`,
    ex: [
      '*چون* خسته بودم، زود خوابیدم.|Because I was tired, I went to sleep early.',
      'باران می‌آمد، *برای* همین نرفتیم.|It was raining; that is why we did not go.',
      '*با* این‌که مریض بود، سرِ کار رفت.|Although he was ill, he went to work.',
      '*وقتی* رسیدم، به تو زنگ می‌زنم.|When I arrive, I will call you.',
      'بعد از این‌که شام *خوردیم*، قدم زدیم.|After we ate dinner, we went for a walk.',
      'اینجا بمان *تا* من برگردم.|Stay here until I come back.',
      'او *هم* فارسی می‌داند هم عربی.|He knows both Persian and Arabic.',
      'گران است؛ *علاوه* بر این، خیلی دور است.|It is expensive; besides, it is very far.',
    ],
    alts: ['چون', 'اگر', 'برای', 'با', 'وقتی', 'خوردیم', 'بخوریم', 'تا', 'که', 'هم', 'نه', 'علاوه', 'اما'],
    vocab: ['چون|because, since', 'بنابراین|therefore', 'برای همین|that is why', 'با این‌که|although', 'با وجودِ|despite', 'بعد از این‌که|after', 'در حالی که|while', 'علاوه بر این|besides'],
    read: {
      title: 'روزی که بد شروع شد',
      text: `امروز صبح دیر بیدار شدم، چون ساعتم زنگ نزد. همین‌که ساعت را دیدم، از تخت پریدم و سریع لباس پوشیدم تا به اتوبوس برسم. با این‌که دویدم، اتوبوس درست قبل از این‌که برسم حرکت کرد. باران می‌آمد و چتر نداشتم، برای همین به یک کافه رفتم تا اتوبوس بعدی بیاید. در حالی که منتظر بودم، رئیسم وارد شد! فکر کردم عصبانی می‌شود، اما گفت خودش هم از اتوبوس جا مانده است. بعد از این‌که با هم قهوه خوردیم، پیاده به اداره رفتیم. با وجودِ همه‌چیز، روزِ خوبی شد.`,
      qs: ['Why did the narrator wake up late?|The alarm did not ring|He went to bed late|He was ill|It was a holiday', 'Why did he go into a café?|To shelter from the rain until the next bus|To meet his boss|To have breakfast|To make a phone call', 'How did the boss react?|He said he had missed the bus too|He was angry|He ignored him|He sent him home'],
    },
  },
  {
    id: 'b1-06', title: 'Passive and impersonal', cats: ['passive'],
    note: `The passive is the past participle + شدن (shodan, to become): این کتاب در ۱۹۵۰ نوشته شد (this book was written in 1950); در اینجا فارسی صحبت می‌شود (Persian is spoken here); ساخته خواهد شد (it will be built); دزدیده شده است (it has been stolen). For compound verbs simply swap کردن for شدن: باز کردن (to open something) → باز شدن (to be opened, to open); تمام کردن → تمام شدن. The agent is rarely mentioned; if needed use به‌وسیلهٔ or توسطِ. Persian prefers an active sentence with an indefinite "they": می‌گویند که… (they say that…). Impersonal expressions use a bare past stem: باید رفت (one must go), می‌شود گفت (one can say), نمی‌توان گفت (one cannot say).`,
    ex: [
      'این کتاب در سالِ ۱۹۵۰ نوشته *شد*.|This book was written in 1950.',
      'در اینجا فارسی صحبت *می‌شود*.|Persian is spoken here.',
      'کیفم دزدیده *شده* است.|My bag has been stolen.',
      'این پل سالِ آینده ساخته *خواهد* شد.|This bridge will be built next year.',
      'در ناگهان باز *شد*.|The door suddenly opened.',
      '*می‌گویند* او خیلی ثروتمند است.|They say he is very rich.',
      'باید صبر *کرد*.|One must wait.',
      'نمی‌*شود* اینجا پارک کرد.|One cannot park here.',
    ],
    alts: ['شد', 'کرد', 'می‌شود', 'می‌کند', 'شده', 'کرده', 'خواهد', 'خواهم', 'می‌گویند', 'می‌گوید', 'شود'],
    vocab: ['نوشته شدن|to be written', 'ساخته شدن|to be built', 'دزدیدن|to steal', 'باز شدن|to open (by itself)', 'بسته شدن|to close, to be closed', 'می‌گویند|they say', 'توسطِ|by (agent)', 'پل|bridge'],
    read: {
      title: 'خبرهای کوتاه',
      text: `دیروز پلِ جدیدِ شهر افتتاح شد. این پل توسطِ یک مهندسِ جوانِ محلی طراحی شده و در سه سال ساخته شده است. در مراسم گفته شد که روزانه ده هزار خودرو از روی آن عبور خواهند کرد. طرح هشت سال پیش تصویب شده بود، اما کار دو بار به خاطرِ کمبودِ بودجه متوقف شد. شهردار گفت: «اشتباه‌هایی هم شد، ولی سرانجام کار تمام شد.» بعد از مراسم، میانِ مردم شیرینی پخش شد. می‌گویند پل فردا صبح به روی عمومِ مردم باز می‌شود.`,
      qs: ['Who designed the bridge?|A young local engineer|The mayor|A foreign company|The army', 'Why was the work stopped twice?|Because of a lack of budget|Because of floods|Because of protests|Because of an accident', 'When will the bridge open to the public?|Tomorrow morning|Next month|It is already open|In three years'],
    },
  },
  {
    id: 'b1-07', title: 'Reporting what people said', cats: ['reported-speech', 'subordination'],
    note: `Reported speech is introduced by که (ke), which can also be left out. Persian does not shift tenses: keep the tense of the original words even after a past reporting verb — گفت که فردا می‌آید (he said he would come tomorrow, literally "that he comes tomorrow"); گفت خسته است (he said he was tired). Pronouns and endings change to fit the new speaker. Report yes/no questions with پرسید (که) آیا… and other questions with the question word: پرسید کجا زندگی می‌کنم (he asked where I live). Report commands with گفت که + subjunctive: به من گفت که بنشینم (he told me to sit). Other reporting verbs: جواب داد, توضیح داد, قول داد (promised), خبر داد, شنیدم که (I heard that).`,
    ex: [
      'گفت *که* فردا می‌آید.|He said that he would come tomorrow.',
      'پرسید کجا زندگی *می‌کنم*.|He asked where I live.',
      'به من گفت که *بنشینم*.|He told me to sit down.',
      'شنیده‌ام که او ازدواج *کرده* است.|I have heard that he has got married.',
      'قول داد که پول را پس *بدهد*.|He promised to give the money back.',
      'پرسیدم *آیا* وقت دارد.|I asked whether he had time.',
      'دکتر گفت باید استراحت *کنم*.|The doctor said I must rest.',
      'گفت خسته *است*.|He said he was tired.',
    ],
    alts: ['که', 'تا', 'می‌کنم', 'می‌کردم', 'بنشینم', 'می‌نشینم', 'کرده', 'می‌کند', 'بدهد', 'می‌دهد', 'آیا', 'اگر', 'کنم', 'است', 'بود'],
    vocab: ['پرسیدن|to ask', 'جواب دادن|to answer', 'توضیح دادن|to explain', 'قول دادن|to promise', 'خبر دادن|to inform', 'پس دادن|to give back', 'استراحت کردن|to rest', 'آیا|whether; (question marker)'],
    read: {
      title: 'صاحب‌خانه چه گفت؟',
      text: `دیروز به صاحب‌خانه زنگ زدم. پرسیدم آیا می‌تواند شیرِ حمام را تعمیر کند. جواب داد که با لوله‌کش صحبت کرده، اما او تا هفتهٔ آینده نمی‌تواند بیاید. گفتم که آب دارد روی زمین می‌ریزد. گفت یک سطل زیرش بگذارم. بعد پرسید تا کِی در این خانه می‌مانیم. گفتم هنوز نمی‌دانیم. آخرِ سر خبر داد که از دی‌ماه اجاره بالا می‌رود و قول داد قراردادِ جدید را برایم بفرستد. تلفن را قطع کردم و مدتی به فکر فرو رفتم.`,
      qs: ['What did the tenant ask the landlord to repair?|The bathroom tap|The front door|The roof|The heating', 'When can the plumber come?|Not until next week|Tomorrow|The same evening|Never', 'What news did the landlord give at the end?|The rent will go up|He is selling the house|The repair is free|They must move out'],
    },
  },
  {
    id: 'b1-08', title: 'Spoken Persian', cats: ['colloquial', 'register'],
    note: `Everyday Tehran speech differs systematically from the written language, and you need both. The main changes: است → ـه (e): خوب است → خوبه; را → رو / ـو: کتاب را → کتابو; ân → un before n or m: آن → اون, خانه → خونه, نان → نون, تهران → تهرون; verb endings shorten: می‌روم → می‌رم, می‌روی → می‌ری, می‌رود → می‌ره, می‌روند → می‌رن, می‌گویم → می‌گم, می‌خواهم → می‌خوام, می‌توانم → می‌تونم, می‌آیم → می‌آم; ـید → ـین: می‌روید → می‌رین; ـند → ـن; هستم → ـم, نیست → نیست; یک → یه; اگر → اگه; دیگر → دیگه; چه → چی. Never write this style in formal texts, but use it when chatting and expect it in films and messages.`,
    ex: [
      'حالت *چطوره*؟|How are you? (spoken)',
      'من *می‌رم* خونه.|I am going home. (spoken)',
      '*نمی‌دونم* کجاست.|I do not know where it is. (spoken)',
      'چی *می‌خوای* بخوری؟|What do you want to eat? (spoken)',
      'این کتابو *خوندی*؟|Have you read this book? (spoken)',
      '*یه* چایی می‌خوام.|I want a tea. (spoken)',
      'اگه *بتونم*، می‌آم.|If I can, I will come. (spoken)',
      'هوا خیلی *سرده*.|The weather is very cold. (spoken)',
    ],
    alts: ['چطوره', 'چطور است', 'می‌رم', 'می‌روم', 'نمی‌دونم', 'نمی‌دانم', 'می‌خوای', 'می‌خواهی', 'خوندی', 'خواندی', 'یه', 'یک', 'بتونم', 'بتوانم', 'سرده', 'سرد است'],
    vocab: ['خونه|home (spoken)', 'اون|that; he, she (spoken)', 'یه|a, one (spoken)', 'اگه|if (spoken)', 'دیگه|any more; other (spoken)', 'آره|yes (spoken)', 'چی|what (spoken)', 'الان|now'],
    read: {
      title: 'پیام‌های یک گروه دوستانه',
      text: `— بچه‌ها، امشب کی می‌آد بریم سینما؟
— من نمی‌تونم، باید درس بخونم. فردا امتحان دارم.
— منم خسته‌ام، ولی اگه فیلمش خوب باشه می‌آم. چیه فیلمش؟
— یه کمدی ایرانیه. می‌گن خیلی خنده‌داره.
— باشه، ساعت چند؟
— هفت و نیم. قبلش بریم یه چیزی بخوریم؟
— آره، من گشنمه! کجا بریم؟
— همون ساندویچی سرِ کوچه. ارزونه و خوشمزه‌ست.
— پس من ساعت شیش اونجام. دیر نکنین!
— تو خودت همیشه دیر می‌کنی!`,
      qs: ['Why can one friend not come?|He has to study for an exam tomorrow|He is ill|He has no money|He has seen the film', 'What kind of film is it?|An Iranian comedy|A foreign thriller|A documentary|A romance', 'Where will they eat beforehand?|At the sandwich place at the end of the alley|At a restaurant in the cinema|At home|At a new café'],
    },
  },
]);
