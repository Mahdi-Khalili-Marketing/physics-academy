// Seed script — Smart Educational Platform for Physics Academy
// Generates realistic Persian physics data: chapters, topics, videos, questions,
// students, teacher, manager, sample attempts, leitner cards.
//
// Run: bun run /home/z/my-project/scripts/seed.ts

import { PrismaClient } from '@prisma/client'
import { createHash, randomUUID } from 'crypto'

const db = new PrismaClient()

// ============== Helpers ==============
function hash(p: string) {
  return createHash('sha256').update(p).digest('hex')
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ============== Persian Physics Curriculum ==============
// Grade 12 Physics — Iranian Konkur curriculum (real chapter names)
const CHAPTERS_GRADE_12 = [
  {
    slug: 'motion-kinematics',
    title: 'سینماتیک — حرکت‌های خطی',
    order: 1,
    topics: [
      { slug: 'uniform-motion', title: 'حرکت یکنواخت خطی', order: 1 },
      { slug: 'uniformly-accelerated', title: 'حرکت شتاب‌دار یکنواخت', order: 2 },
      { slug: 'free-fall', title: 'سقوط آزاد', order: 3 },
      { slug: 'projectile-motion', title: 'حرکت پرتابه', order: 4 },
    ],
  },
  {
    slug: 'dynamics',
    title: 'دینامیک — نیوتن',
    order: 2,
    topics: [
      { slug: 'newton-laws', title: 'قوانین نیوتن', order: 1 },
      { slug: 'friction', title: 'اصطکاک', order: 2 },
      { slug: 'incline-friction', title: 'اصطکاک در سطح شیب‌دار', order: 3 },
      { slug: 'pulley-systems', title: 'سیستم‌های قرقره‌ای', order: 4 },
    ],
  },
  {
    slug: 'work-energy',
    title: 'کار، انرژی و توان',
    order: 3,
    topics: [
      { slug: 'work-definition', title: 'تعریف کار', order: 1 },
      { slug: 'kinetic-energy', title: 'انرژی جنبشی', order: 2 },
      { slug: 'potential-energy', title: 'انرژی پتانسیل', order: 3 },
      { slug: 'conservation-energy', title: 'پایستگی انرژی', order: 4 },
    ],
  },
  {
    slug: 'momentum',
    title: 'تکانه و برخورد',
    order: 4,
    topics: [
      { slug: 'momentum-def', title: 'تکانه و پایستگی', order: 1 },
      { slug: 'collisions', title: 'برخورد弹性 و غیر弹性', order: 2 },
      { slug: 'impulse', title: 'تکانه و نیرو', order: 3 },
    ],
  },
  {
    slug: 'rotation',
    title: 'دینامیک چرخشی',
    order: 5,
    topics: [
      { slug: 'torque', title: 'گشتاور', order: 1 },
      { slug: 'moment-inertia', title: 'لختی دورانی', order: 2 },
      { slug: 'angular-momentum', title: 'تکانه زاویه‌ای', order: 3 },
    ],
  },
  {
    slug: 'oscillations',
    title: 'نوسان‌ها — حرکت هارمونیک',
    order: 6,
    topics: [
      { slug: 'shm', title: 'حرکت هارمونیک ساده', order: 1 },
      { slug: 'pendulum', title: 'پاندول ساده', order: 2 },
      { slug: 'spring-mass', title: 'نوسانگر جرم-فنر', order: 3 },
    ],
  },
  {
    slug: 'waves',
    title: 'امواج مکانیکی',
    order: 7,
    topics: [
      { slug: 'wave-properties', title: 'ویژگی‌های موج', order: 1 },
      { slug: 'sound-speed', title: 'سرعت صوت', order: 2 },
      { slug: 'doppler-effect', title: 'پدیده دوپلر', order: 3 },
      { slug: 'interference', title: 'تداخل امواج', order: 4 },
    ],
  },
  {
    slug: 'thermodynamics',
    title: 'ترمودینامیک',
    order: 8,
    topics: [
      { slug: 'gas-laws', title: 'قوانین گازها', order: 1 },
      { slug: 'heat-transfer', title: 'انتقال گرما', order: 2 },
      { slug: 'first-law', title: 'قانون اول ترمودینامیک', order: 3 },
    ],
  },
  {
    slug: 'electrostatics',
    title: 'الکتریسیته ساکن',
    order: 9,
    topics: [
      { slug: 'coulomb-law', title: 'قانون کولن', order: 1 },
      { slug: 'electric-field', title: 'میدان الکتریکی', order: 2 },
      { slug: 'potential', title: 'پتانسیل الکتریکی', order: 3 },
      { slug: 'capacitors', title: 'خازن‌ها', order: 4 },
    ],
  },
  {
    slug: 'circuits',
    title: 'مدارهای جریان مستقیم',
    order: 10,
    topics: [
      { slug: 'ohm-law', title: 'قانون اهم', order: 1 },
      { slug: 'kirchhoff', title: 'قوانین کیرشهف', order: 2 },
      { slug: 'resistor-networks', title: 'شبکه مقاومتی', order: 3 },
    ],
  },
  {
    slug: 'magnetism',
    title: 'مغناطیس و القا',
    order: 11,
    topics: [
      { slug: 'magnetic-force', title: 'نیروی مغناطیسی', order: 1 },
      { slug: 'faraday-law', title: 'قانون فارادی', order: 2 },
      { slug: 'inductance', title: 'القا و سلف', order: 3 },
    ],
  },
  {
    slug: 'modern-physics',
    title: 'فیزیک مدرن',
    order: 12,
    topics: [
      { slug: 'photoelectric', title: 'اثر فوتوالکتریک', order: 1 },
      { slug: 'atom-models', title: 'مدل‌های اتمی', order: 2 },
      { slug: 'nuclear', title: 'فیزیک هسته‌ای', order: 3 },
    ],
  },
]

// Sample question templates per topic
const QUESTION_TEMPLATES: Record<
  string,
  { stem: string; a: string; b: string; c: string; d: string; correct: 'A' | 'B' | 'C' | 'D'; difficulty: 'EASY' | 'MEDIUM' | 'HARD' }[]
> = {
  'uniform-motion': [
    { stem: 'یک ماشین با سرعت ثابت ۲۰ متر بر ثانیه حرکت می‌کند. در چه فاصله‌ای پس از ۵ ثانیه قرار دارد؟', a: '۵۰ متر', b: '۱۰۰ متر', c: '۸۰ متر', d: '۱۲۰ متر', correct: 'B', difficulty: 'EASY' },
    { stem: 'اگر جسمی در ۱۰ ثانیه ۵۰ متر حرکت کند، سرعت متوسط آن چقدر است؟', a: '۲ م/ث', b: '۵ م/ث', c: '۱۰ م/ث', d: '۵۰ م/ث', correct: 'B', difficulty: 'EASY' },
    { stem: 'در نمودار مکان-زمان یک حرکت یکنواخت، شیب خط نشان‌دهنده چه چیزی است؟', a: 'شتاب', b: 'مسافت', c: 'سرعت', d: 'زمان', correct: 'C', difficulty: 'MEDIUM' },
  ],
  'uniformly-accelerated': [
    { stem: 'جسمی از سکون با شتاب ۲ م/ث² شروع به حرکت می‌کند. سرعت آن پس از ۴ ثانیه چقدر است؟', a: '۲ م/ث', b: '۴ م/ث', c: '۶ م/ث', d: '۸ م/ث', correct: 'D', difficulty: 'EASY' },
    { stem: 'رابطه v² = v₀² + ۲aΔx برای چه نوع حرکتی برقرار است؟', a: 'حرکت دایره‌ای', b: 'حرکت شتاب‌دار یکنواخت', c: 'سقوط آزاد با مقاومت هوا', d: 'حرکت نوسانی', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'یک ماشین از سرعت ۱۰ م/ث به ۳۰ م/ث در ۵ ثانیه می‌رسد. شتاب آن چقدر است؟', a: '۲ م/ث²', b: '۴ م/ث²', c: '۶ م/ث²', d: '۸ م/ث²', correct: 'B', difficulty: 'MEDIUM' },
  ],
  'free-fall': [
    { stem: 'جسمی از ارتفاع ۴۵ متری رها می‌شود. (g = ۱۰) پس از چند ثانیه به زمین می‌رسد؟', a: '۲ ثانیه', b: '۳ ثانیه', c: '۴.۵ ثانیه', d: '۹ ثانیه', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'در سقوط آزاد، سرعت جسم پس از ۳ ثانیه چند م/ث است؟ (g = ۱۰)', a: '۱۰', b: '۲۰', c: '۳۰', d: '۴۵', correct: 'C', difficulty: 'EASY' },
    { stem: 'اگر دو جرم مختلف از ارتفاع یکسان رها شوند، کدام زودتر به زمین می‌رسد؟ (بدون مقاومت هوا)', a: 'جسم سنگین‌تر', b: 'جسم سبک‌تر', c: 'هر دو هم‌زمان', d: 'بستگی به شکل دارد', correct: 'C', difficulty: 'EASY' },
  ],
  'projectile-motion': [
    { stem: 'برد افقی پرتابه‌ای با زاویه ۴۵ درجه و سرعت اولیه ۲۰ م/ث چقدر است؟ (g=۱۰)', a: '۲۰ متر', b: '۴۰ متر', c: '۸۰ متر', d: '۱۰۰ متر', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'در حرکت پرتابه، در بالاترین نقطه مسیر سرعت عمودی چقدر است؟', a: 'حداکثر', b: 'صفر', c: 'نصف اولیه', d: 'مساوی با سرعت افقی', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'زمان پرواز پرتابه‌ای که با زاویه ۳۰ درجه پرتاب شده، با افزایش زاویه به ۶۰ درجه چه تغییری می‌کند؟ (سرعت ثابت)', a: 'کم می‌شود', b: 'زیاد می‌شود', c: 'ثابت می‌ماند', d: 'نمی‌توان گفت', correct: 'B', difficulty: 'HARD' },
  ],
  'newton-laws': [
    { stem: 'نیروی ۱۲ نیوتنی به جسمی با جرم ۳ کیلوگرم وارد می‌شود. شتاب آن چقدر است؟', a: '۳ م/ث²', b: '۴ م/ث²', c: '۹ م/ث²', d: '۱۵ م/ث²', correct: 'B', difficulty: 'EASY' },
    { stem: 'قانون اول نیوتن به عنوان «قانون...» نیز شناخته می‌شود.', a: 'شتاب', b: 'لختی', c: 'کنش', d: 'واکنش', correct: 'B', difficulty: 'EASY' },
    { stem: 'وقتی به دیوار با نیروی ۵۰ نیوتن فشار می‌آوریم، دیوار با چه نیرویی به ما واکنش نشان می‌دهد؟', a: 'صفر', b: '۲۵ نیوتن', c: '۵۰ نیوتن', d: '۱۰۰ نیوتن', correct: 'C', difficulty: 'MEDIUM' },
  ],
  'friction': [
    { stem: 'ضریب اصطکاک ایستایی معمولاً... ضریب اصطکاک جنبشی است.', a: 'کوچک‌تر از', b: 'مساوی', c: 'بزرگ‌تر از', d: 'نامرتبط با', correct: 'C', difficulty: 'EASY' },
    { stem: 'نیروی اصطکاک جنبشی به چه عاملی بستگی ندارد؟', a: 'ضریب اصطکاک', b: 'نیروی عمودی', c: 'ماهیت سطوح', d: 'مساحت تماس', correct: 'D', difficulty: 'MEDIUM' },
    { stem: 'جسمی ۱۰ کیلوگرمی روی سطح افقی با μ=۰.۲ قرار دارد. بیشترین نیروی اصطکاک ایستایی چقدر است؟ (g=۱۰)', a: '۲ نیوتن', b: '۱۰ نیوتن', c: '۲۰ نیوتن', d: '۱۰۰ نیوتن', correct: 'C', difficulty: 'MEDIUM' },
  ],
  'incline-friction': [
    { stem: 'جسمی روی سطح شیب‌دار با زاویه ۳۰ درجه و μ=۰.۳ قرار دارد. شتاب جسم در جهت شیب چقدر است؟ (g=۱۰)', a: '۲.۳ م/ث²', b: '۵ م/ث²', c: '۷ م/ث²', d: 'ساکن می‌ماند', correct: 'A', difficulty: 'HARD' },
    { stem: 'برای آنکه جسم روی سطح شیب‌دار در حال تعادل باشد، باید شرط زیر برقرار باشد:', a: 'tan θ > μ', b: 'tan θ ≤ μ', c: 'sin θ ≤ μ', d: 'cos θ ≤ μ', correct: 'B', difficulty: 'HARD' },
    { stem: 'نیروی عمودی وارد بر جسم روی سطح شیب‌دار با زاویه θ برابر است با:', a: 'mg', b: 'mg sin θ', c: 'mg cos θ', d: 'mg tan θ', correct: 'C', difficulty: 'MEDIUM' },
  ],
  'pulley-systems': [
    { stem: 'در قرقره بدون اصطکاک، اگر جرم‌های ۳ و ۵ کیلوگرم با نخ به هم وصل شوند، شتاب سیستم چقدر است؟ (g=۱۰)', a: '۲.۵ م/ث²', b: '۵ م/ث²', c: '۸ م/ث²', d: '۱۰ م/ث²', correct: 'A', difficulty: 'HARD' },
    { stem: 'در دستگاه آتوود، کشش نخ برابر است با:', a: 'mg', b: '2m₁m₂g/(m₁+m₂)', c: '(m₁-m₂)g', d: '(m₁+m₂)g', correct: 'B', difficulty: 'HARD' },
  ],
  'work-definition': [
    { stem: 'وقتی نیروی ۲۰ نیوتنی به طول ۵ متر در جهت نیرو جابه‌جا می‌کند، کار چقدر است؟', a: '۴ ژول', b: '۲۵ ژول', c: '۱۰۰ ژول', d: '۱۵ ژول', correct: 'C', difficulty: 'EASY' },
    { stem: 'وقتی نیرو برابر با جابجایی باشد، کار انجام‌شده چقدر است؟', a: 'حداکثر', b: 'صفر', c: 'منفی', d: 'نصف مقدار نیرو', correct: 'B', difficulty: 'EASY' },
    { stem: 'واحد کار در سیستم SI کدام است؟', a: 'وات', b: 'نیوتن', c: 'ژول', d: 'پاسکال', correct: 'C', difficulty: 'EASY' },
  ],
  'kinetic-energy': [
    { stem: 'انرژی جنبشی جسمی به جرم ۲ کیلوگرم با سرعت ۱۰ م/ث چقدر است؟', a: '۱۰ ژول', b: '۲۰ ژول', c: '۱۰۰ ژول', d: '۲۰۰ ژول', correct: 'C', difficulty: 'EASY' },
    { stem: 'اگر سرعت جسمی دو برابر شود، انرژی جنبشی آن چند برابر می‌شود؟', a: '۲', b: '۳', c: '۴', d: '۸', correct: 'C', difficulty: 'MEDIUM' },
    { stem: 'رابطه انرژی جنبشی با کار-انرژی کدام است؟', a: 'W = ΔK', b: 'W = K', c: 'K = W', d: 'W = 2K', correct: 'A', difficulty: 'MEDIUM' },
  ],
  'potential-energy': [
    { stem: 'انرژی پتانسیل گرانشی جسمی به جرم ۵ کیلوگرم در ارتفاع ۴ متری چقدر است؟ (g=۱۰)', a: '۲۰ ژول', b: '۵۰ ژول', c: '۱۰۰ ژول', d: '۲۰۰ ژول', correct: 'D', difficulty: 'EASY' },
    { stem: 'در فنر، انرژی پتانسیل ذخیره‌شده برابر است با:', a: 'kx', b: '½kx²', c: 'kx²', d: 'mgx', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'انرژی پتانسیل وقتی به حداقل می‌رسد که:', a: 'سرعت بیشینه باشد', b: 'ارتفاع بیشینه باشد', c: 'فنر بیشینه فشرده شود', d: 'جسم ساکن باشد', correct: 'A', difficulty: 'HARD' },
  ],
  'conservation-energy': [
    { stem: 'اصل پایستگی انرژی مکانیکی برقرار است وقتی:', a: 'اصطکاک وجود داشته باشد', b: 'فقط نیروهای پایسته کار کنند', c: 'انرژی گرمایی تولید شود', d: 'مقاومت هوا وجود داشته باشد', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'جسمی از ارتفاع h سقوط می‌کند. در نیمه راه، نسبت انرژی جنبشی به پتانسیل چقدر است؟', a: '۱:۱', b: '۱:۲', c: '۲:۱', d: '۳:۱', correct: 'A', difficulty: 'HARD' },
  ],
  'momentum-def': [
    { stem: 'تکانه جسمی به جرم ۴ کیلوگرم با سرعت ۱۵ م/ث چقدر است؟', a: '۱۹ کیلوگرم‌متر بر ثانیه', b: '۶۰ کیلوگرم‌متر بر ثانیه', c: '۳.۷۵ کیلوگرم‌متر بر ثانیه', d: '۱۱ کیلوگرم‌متر بر ثانیه', correct: 'B', difficulty: 'EASY' },
    { stem: 'اگر سیستم ایزوله باشد، تکانه کل آن:', a: 'افزایش می‌یابد', b: 'کاهش می‌یابد', c: 'ثابت می‌ماند', d: 'صفر می‌شود', correct: 'C', difficulty: 'EASY' },
  ],
  'collisions': [
    { stem: 'در برخورد کاملاً غیرکشسان، چه چیزی پایسته نمی‌ماند؟', a: 'تکانه', b: 'جرم', c: 'انرژی جنبشی', d: 'زمان', correct: 'C', difficulty: 'MEDIUM' },
    { stem: 'در برخورد کاملاً کشسان، چه دو کمیتی پایسته می‌مانند؟', a: 'تکانه و انرژی جنبشی', b: 'تکانه و جرم', c: 'انرژی و نیرو', d: 'سرعت و شتاب', correct: 'A', difficulty: 'MEDIUM' },
  ],
  'impulse': [
    { stem: 'تکانه و نیرو از طریق چه رابطه‌ای به هم متصل‌اند؟', a: 'F = mv', b: 'F = Δp/Δt', c: 'F = ½mv²', d: 'F = mgh', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'تکانه نیرو برابر است با:', a: 'نیرو × زمان', b: 'جرم × سرعت', c: 'نیرو × مسافت', d: 'سرعت × زمان', correct: 'A', difficulty: 'EASY' },
  ],
  'torque': [
    { stem: 'گشتاور نیروی ۵ نیوتنی که از فاصله ۲ متری عمود بر نیرو وارد می‌شود، چقدر است؟', a: '۲.۵ نیوتن‌متر', b: '۷ نیوتن‌متر', c: '۱۰ نیوتن‌متر', d: '۲۰ نیوتن‌متر', correct: 'C', difficulty: 'EASY' },
    { stem: 'برای تعادل چرخشی، شرط زیر برقرار است:', a: 'ΣF = 0', b: 'Στ = 0', c: 'Σv = 0', d: 'Σm = 0', correct: 'B', difficulty: 'MEDIUM' },
  ],
  'moment-inertia': [
    { stem: 'لختی دورانی یک دیسک یکنواخت به جرم M و شعاع R برابر است با:', a: 'MR²', b: '½MR²', c: '۲MR²', d: '¼MR²', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'اگر شعاع دیسک دو برابر شود، لختی دورانی آن چند برابر می‌شود؟ (جرم ثابت)', a: '۲', b: '۳', c: '۴', d: '۸', correct: 'C', difficulty: 'HARD' },
  ],
  'angular-momentum': [
    { stem: 'تکانه زاویه‌ای برابر است با:', a: 'Iω', b: 'Iα', c: 'mrω', d: '½Iω²', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'وقتی اسکاتر دست‌هایش را به بدن نزدیک می‌کند، سرعت زاویه‌ای او چطور تغییر می‌کند؟', a: 'کم می‌شود', b: 'زیاد می‌شود', c: 'ثابت می‌ماند', d: 'صفر می‌شود', correct: 'B', difficulty: 'HARD' },
  ],
  'shm': [
    { stem: 'دوره نوسان جرم ۱ کیلوگرمی متصل به فنر با ضریب ۱۰۰ N/m چقدر است؟ (π≈۳.۱۴)', a: '۰.۲ ثانیه', b: '۰.۶۳ ثانیه', c: '۱ ثانیه', d: '۲ ثانیه', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'در حرکت هارمونیک ساده، شتاب در کجا بیشینه است؟', a: 'مرکز', b: 'نقاط بازگشت', c: 'هیچ‌جا', d: 'نصف دامنه', correct: 'B', difficulty: 'MEDIUM' },
  ],
  'pendulum': [
    { stem: 'دوره پاندول ساده به چه عاملی بستگی ندارد؟', a: 'طول نخ', b: 'شتاب گرانش', c: 'جرم گوی', d: 'هیچ‌کدام', correct: 'C', difficulty: 'EASY' },
    { stem: 'اگر طول پاندول ۴ برابر شود، دوره آن چند برابر می‌شود؟', a: '۲', b: '۴', c: '۸', d: '۱۶', correct: 'A', difficulty: 'MEDIUM' },
  ],
  'spring-mass': [
    { stem: 'فرکانس زاویه‌ای نوسانگر جرم-فنر برابر است با:', a: 'k/m', b: '√(k/m)', c: 'm/k', d: '√(m/k)', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'انرژی کل نوسانگر هارمونیک در طول زمان:', a: 'ثابت است', b: 'نوسانی است', c: 'کاهش می‌یابد', d: 'افزایش می‌یابد', correct: 'A', difficulty: 'EASY' },
  ],
  'wave-properties': [
    { stem: 'رابطه سرعت موج با طول موج و فرکانس کدام است؟', a: 'v = λ/f', b: 'v = fλ', c: 'v = λ+f', d: 'v = λ-f', correct: 'B', difficulty: 'EASY' },
    { stem: 'اگر طول موج ۲ متر و فرکانس ۵ هرتز باشد، سرعت موج چقدر است؟', a: '۲.۵ م/ث', b: '۷ م/ث', c: '۱۰ م/ث', d: '۳ م/ث', correct: 'C', difficulty: 'EASY' },
  ],
  'sound-speed': [
    { stem: 'سرعت صوت در هوا در دمای اتاق تقریباً چقدر است؟', a: '۱۵۰ م/ث', b: '۳۴۰ م/ث', c: '۱۵۰۰ م/ث', d: '۳۰۰۰ م/ث', correct: 'B', difficulty: 'EASY' },
    { stem: 'سرعت صوت در محیط چگال‌تر معمولاً:', a: 'کمتر است', b: 'بیشتر است', c: 'ثابت می‌ماند', d: 'صفر است', correct: 'B', difficulty: 'MEDIUM' },
  ],
  'doppler-effect': [
    { stem: 'وقتی منبع صوت به شنونده نزدیک می‌شود، فرکانس دریافتی:', a: 'افزایش می‌یابد', b: 'کاهش می‌یابد', c: 'ثابت می‌ماند', d: 'صفر می‌شود', correct: 'A', difficulty: 'EASY' },
    { stem: 'پدیده دوپلر در کدام مورد کاربرد ندارد؟', a: 'رادار', b: 'تشخیص ستارگان دور', c: 'اولتراسوند پزشکی', d: 'برش فلز', correct: 'D', difficulty: 'MEDIUM' },
  ],
  'interference': [
    { stem: 'وقتی دو موج هم‌فاز هم‌دیگر را تقویت می‌کنند، تداخل... رخ می‌دهد.', a: 'ویرانگر', b: 'سازنده', c: 'تصادفی', d: 'هیچ‌کدام', correct: 'B', difficulty: 'MEDIUM' },
    { stem: 'برای تداخل ویرانگر، اختلاف فاز باید برابر باشد با:', a: 'nλ', b: '(n+½)λ', c: '2nλ', d: 'nλ/2', correct: 'B', difficulty: 'HARD' },
  ],
  'gas-laws': [
    { stem: 'در دما ثابت، اگر فشار گازی سه برابر شود، حجم آن:', a: 'سه برابر', b: 'یک‌سوم', c: 'ثابت', d: 'نصف', correct: 'B', difficulty: 'EASY' },
    { stem: 'قانون بویل در چه شرایطی برقرار است؟', a: 'دما و حجم ثابت', b: 'فشار و دما ثابت', c: 'دما ثابت', d: 'حجم ثابت', correct: 'C', difficulty: 'MEDIUM' },
  ],
  'heat-transfer': [
    { stem: 'انتقال گرما در فلزات عمدتاً از طریق... صورت می‌گیرد.', a: 'هدایت', b: 'همرفت', c: 'تشعشع', d: 'جابجایی', correct: 'A', difficulty: 'EASY' },
    { stem: 'گرمای لازم برای افزایش دمای ۲ کیلوگرم آب به اندازه ۱۰ درجه چقدر است؟ (c=۴۱۸۶)', a: '۸۳۷۲۰ ژول', b: '۲۰۹۳۰ ژول', c: '۴۱۸۶۰ ژول', d: '۴۱۸۶ ژول', correct: 'A', difficulty: 'MEDIUM' },
  ],
  'first-law': [
    { stem: 'قانون اول ترمودینامیک برابر است با:', a: 'ΔU = Q - W', b: 'ΔU = Q + W', c: 'Q = ΔU + W', d: 'W = Q - U', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'در فرآیند هم‌حجم، کار انجام‌شده برابر است با:', a: 'صفر', b: 'حداکثر', c: 'Q', d: 'ΔU', correct: 'A', difficulty: 'HARD' },
  ],
  'coulomb-law': [
    { stem: 'نیروی بین دو بار ۲ و ۳ میکروکولن در فاصله ۳ متری چقدر است؟ (k=۹×۱۰⁹)', a: '۰.۰۰۶ نیوتن', b: '۰.۰۶ نیوتن', c: '۶ نیوتن', d: '۶۰ نیوتن', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'اگر فاصله بین دو بار دو برابر شود، نیروی کولن:', a: 'نصف', b: 'یک‌چهارم', c: 'دو برابر', d: 'چهار برابر', correct: 'B', difficulty: 'EASY' },
  ],
  'electric-field': [
    { stem: 'میدان الکتریکی ناشی از بار نقطه‌ای Q در فاصله r برابر است با:', a: 'kQ/r', b: 'kQ/r²', c: 'kQ²/r', d: 'kQ²/r²', correct: 'B', difficulty: 'EASY' },
    { stem: 'جهت میدان الکتریکی در اطراف بار منفی:', a: 'به سمت بار', b: 'دور از بار', c: 'عمود بر شعاع', d: 'صفر', correct: 'A', difficulty: 'MEDIUM' },
  ],
  'potential': [
    { stem: 'پتانسیل الکتریکی ناشی از بار نقطه‌ای در فاصله r برابر است با:', a: 'kQ/r', b: 'kQ/r²', c: 'kQ²/r', d: 'kQ/r³', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'واحد پتانسیل الکتریکی کدام است؟', a: 'کولن', b: 'فاراد', c: 'ولت', d: 'آمپر', correct: 'C', difficulty: 'EASY' },
  ],
  'capacitors': [
    { stem: 'ظرفیت خازن صفحه‌ای با مساحت A و فاصله d برابر است با:', a: 'ε₀A/d', b: 'ε₀Ad', c: 'ε₀d/A', d: 'A/d', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'انرژی ذخیره‌شده در خازن برابر است با:', a: 'QV', b: '½QV', c: '½CV', d: 'Q/V', correct: 'B', difficulty: 'HARD' },
  ],
  'ohm-law': [
    { stem: 'جریان عبوری از مقاومت ۱۰ اهم با ولتاژ ۲۰ ولت چقدر است؟', a: '۰.۵ آمپر', b: '۲ آمپر', c: '۱۰ آمپر', d: '۲۰۰ آمپر', correct: 'B', difficulty: 'EASY' },
    { stem: 'قانون اهم کدام است؟', a: 'V = IR', b: 'V = I/R', c: 'I = VR', d: 'R = V/I', correct: 'A', difficulty: 'EASY' },
  ],
  'kirchhoff': [
    { stem: 'قانون اول کیرشهف مربوط به پایستگی... است.', a: 'بار', b: 'انرژی', c: 'تکانه', d: 'جرم', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'قانون دوم کیرشهف بر پایه پایستگی... استوار است.', a: 'بار', b: 'انرژی', c: 'تکانه', d: 'جرم', correct: 'B', difficulty: 'MEDIUM' },
  ],
  'resistor-networks': [
    { stem: 'دو مقاومت ۶ و ۳ اهم موازی باشند. مقاومت معادل چقدر است؟', a: '۲ اهم', b: '۹ اهم', c: '۱۸ اهم', d: '۳ اهم', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'سه مقاومت ۲ اهمی به طور سری وصل شده‌اند. مقاومت کل چقدر است؟', a: '۲/۳ اهم', b: '۳ اهم', c: '۶ اهم', d: '۸ اهم', correct: 'C', difficulty: 'EASY' },
  ],
  'magnetic-force': [
    { stem: 'نیروی وارد بر بار q با سرعت v در میدان B برابر است با:', a: 'qvB sin θ', b: 'qvB cos θ', c: 'qB/v', d: 'qv/B', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'بار مثبت در میدان مغناطیسی به سمت... منحرف می‌شود اگر سرعت عمود بر میدان باشد.', a: 'موازی میدان', b: 'عمود بر میدان و سرعت', c: 'در امتداد سرعت', d: 'هیچ‌کدام', correct: 'B', difficulty: 'HARD' },
  ],
  'faraday-law': [
    { stem: 'نیروی محرکه الکترومغناطیسی القایی برابر است با تغییر:', a: 'شار مغناطیسی بر زمان', b: 'جریان بر زمان', c: 'ولتاژ', d: 'مقاومت', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'قانون لنز جهت جریان القایی را چگونه تعیین می‌کند؟', a: 'هم‌جهت با تغییر شار', b: 'مخالف تغییر شار', c: 'عمود بر شار', d: 'تصادفی', correct: 'B', difficulty: 'HARD' },
  ],
  'inductance': [
    { stem: 'واحد سلف کدام است؟', a: 'هنری', b: 'فاراد', c: 'تسلا', d: 'وبر', correct: 'A', difficulty: 'EASY' },
    { stem: 'انرژی ذخیره‌شده در سلف برابر است با:', a: 'LI', b: '½LI²', c: 'L²I', d: 'I/L', correct: 'B', difficulty: 'HARD' },
  ],
  'photoelectric': [
    { stem: 'در اثر فوتوالکتریک، افزایش شدت نور باعث... جریان واکنش می‌شود.', a: 'افزایش', b: 'کاهش', c: 'عدم تغییر', d: 'صفر شدن', correct: 'A', difficulty: 'MEDIUM' },
    { stem: 'حداقل فرکانس برای ایجاد اثر فوتوالکتریک را... می‌گویند.', a: 'فرکانس آستانه', b: 'فرکانس بحرانی', c: 'فرکانس شکست', d: 'فرکانس پایه', correct: 'A', difficulty: 'EASY' },
  ],
  'atom-models': [
    { stem: 'در مدل بور، الکترون‌ها در مدارهای... حرکت می‌کنند.', a: 'تصادفی', b: 'اجازه‌پذیر', c: 'دایره‌ای نامحدود', d: 'مربعی', correct: 'B', difficulty: 'EASY' },
    { stem: 'انرژی فوتون گسیل‌شده هنگام انتقال الکترون برابر است با:', a: 'E = hf', b: 'E = mc²', c: 'E = ½mv²', d: 'E = kQ/r', correct: 'A', difficulty: 'MEDIUM' },
  ],
  'nuclear': [
    { stem: 'در واپاشی بتا، ذره... گسیل می‌شود.', a: 'آلفا', b: 'پوزیترون', c: 'الکترون', d: 'نوترون', correct: 'C', difficulty: 'MEDIUM' },
    { stem: 'نیمه‌عمر ایزوتوپ برابر است با زمانی که:', a: 'نصف جرم باقی می‌ماند', b: 'همه جرم واپاشی شود', c: 'یک‌چهارم جرم باقی بماند', d: 'دو برابر جرم باقی بماند', correct: 'A', difficulty: 'EASY' },
  ],
}

// ============== Sample Video URLs ==============
// Use a public sample HLS / mp4 stream. These are placeholders; in production
// they'd point to the Iranian secure video CDN with tokenized URLs.
const SAMPLE_VIDEO_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

// ============== Main Seed ==============

async function main() {
  console.log('🌱 Seeding Smart Educational Platform...')

  // 1. Manager
  const manager = await db.user.upsert({
    where: { phone: '09120000001' },
    update: {},
    create: {
      phone: '09120000001',
      name: 'مدیر آموزشگاه',
      passwordHash: hash('1234'),
      role: 'MANAGER',
      avatarColor: '#9333ea',
    },
  })

  // 2. Teacher
  const teacher = await db.user.upsert({
    where: { phone: '09120000002' },
    update: {},
    create: {
      phone: '09120000002',
      name: 'دکتر رضایی — دبیر فیزیک',
      passwordHash: hash('1234'),
      role: 'TEACHER',
      avatarColor: '#0891b2',
    },
  })

  // 3. Class
  const klass = await db.class.upsert({
    where: { id: 'class-konkur-morning' },
    update: { teacherId: teacher.id },
    create: {
      id: 'class-konkur-morning',
      name: 'کلاس کنکور فیزیک — شیفت صبح',
      teacherId: teacher.id,
      grade: 'GRADE_12_PHYSICS',
      studentIds: [],
      schedule: 'شنبه، دوشنبه، چهارشنبه ۸ تا ۱۰ صبح',
    },
  })

  // 4. Students
  const studentNames = [
    'علی محمدی', 'زهرا کریمی', 'محمدحسین رستمی', 'فاطمه اکبری', 'سارا موسوی',
    'امیرحسین نظری', 'نگار شریفی', 'بهراد جعفری', 'مریم صادقی', 'آرش قاسمی',
    'الناز حسینی', 'پویا نوری', 'مهتاب یوسفی', 'سینا امینی', 'دنیا رحیمی',
    'کاوه مرادی', 'هانیه فلاح', 'نیما کاظمی', 'آناهیتا تابش', 'سامان عابدی',
  ]
  const students: { id: string; name: string; phone: string }[] = []
  for (let i = 0; i < studentNames.length; i++) {
    const phone = `091200${(10003 + i).toString()}`
    const s = await db.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        name: studentNames[i],
        passwordHash: hash('1234'),
        role: 'STUDENT',
        parentPhone: `091200${(20003 + i).toString()}`,
        referralCode: `REF${(1001 + i).toString()}`,
        avatarColor: pick(['#0ea5a4', '#dc2626', '#16a34a', '#ea580c', '#0891b2', '#7c3aed']),
      },
    })
    students.push({ id: s.id, name: s.name, phone })
  }
  await db.class.update({
    where: { id: klass.id },
    data: { studentIds: students.map((s) => s.id) },
  })

  // 5. Chapters & topics
  const chapterMap = new Map<string, { id: string; topics: Map<string, string> }>()
  for (const ch of CHAPTERS_GRADE_12) {
    const created = await db.chapter.upsert({
      where: { slug: ch.slug },
      update: { title: ch.title, order: ch.order },
      create: {
        slug: ch.slug,
        title: ch.title,
        order: ch.order,
        grade: 'GRADE_12_PHYSICS',
      },
    })
    const topicsMap = new Map<string, string>()
    for (const t of ch.topics) {
      const createdT = await db.topic.upsert({
        where: { chapterId_slug: { chapterId: created.id, slug: t.slug } },
        update: { title: t.title, order: t.order },
        create: {
          chapterId: created.id,
          slug: t.slug,
          title: t.title,
          order: t.order,
        },
      })
      topicsMap.set(t.slug, createdT.id)
    }
    chapterMap.set(ch.slug, { id: created.id, topics: topicsMap })
  }

  // 6. Videos — one per topic, plus an extra per chapter
  for (const ch of CHAPTERS_GRADE_12) {
    const chInfo = chapterMap.get(ch.slug)!
    // chapter overview video
    await db.video.upsert({
      where: { id: `video-ch-${ch.slug}` },
      update: {},
      create: {
        id: `video-ch-${ch.slug}`,
        title: `مرور کلی فصل — ${ch.title}`,
        description: `ویدیوی مفهومی مرور فصل ${ch.title} شامل نکات کلیدی و فرمول‌های پایه.`,
        chapterId: chInfo.id,
        durationSec: randInt(900, 1800),
        hlsUrl: SAMPLE_VIDEO_URL,
        thumbnail: null,
        uploadedById: teacher.id,
        isPublished: true,
      },
    })
    for (const t of ch.topics) {
      const topicId = chInfo.topics.get(t.slug)!
      await db.video.upsert({
        where: { id: `video-${t.slug}` },
        update: {},
        create: {
          id: `video-${t.slug}`,
          title: `درس کامل — ${t.title}`,
          description: `تدریس کامل مبحث ${t.title} با مثال‌های حل‌شده و نکات کنکوری.`,
          chapterId: chInfo.id,
          topicId,
          durationSec: randInt(600, 1800),
          hlsUrl: SAMPLE_VIDEO_URL,
          thumbnail: null,
          uploadedById: teacher.id,
          isPublished: true,
        },
      })
    }
  }

  // 7. Questions — from templates, attach to topics
  const allQuestionIds: { id: string; topicId: string; correct: string; difficulty: string }[] = []
  for (const ch of CHAPTERS_GRADE_12) {
    const chInfo = chapterMap.get(ch.slug)!
    for (const t of ch.topics) {
      const topicId = chInfo.topics.get(t.slug)!
      const templates = QUESTION_TEMPLATES[t.slug] || []
      for (let i = 0; i < templates.length; i++) {
        const q = templates[i]
        const created = await db.question.upsert({
          where: { id: `q-${t.slug}-${i}` },
          update: {},
          create: {
            id: `q-${t.slug}-${i}`,
            chapterId: chInfo.id,
            topicId,
            stem: q.stem,
            optionA: q.a,
            optionB: q.b,
            optionC: q.c,
            optionD: q.d,
            correctOption: q.correct,
            difficulty: q.difficulty,
            authoredById: teacher.id,
            approvedById: teacher.id,
            approvalStatus: 'APPROVED',
          },
        })
        allQuestionIds.push({ id: created.id, topicId, correct: q.correct, difficulty: q.difficulty })
      }
    }
  }

  // 8. Exams — one topic quiz per topic, one chapter exam per chapter, one Konkur sim
  //    Use ExamQuestion join table so a single Question can appear in multiple exams.
  // 8a. Topic quizzes
  for (const ch of CHAPTERS_GRADE_12) {
    const chInfo = chapterMap.get(ch.slug)!
    for (const t of ch.topics) {
      const topicId = chInfo.topics.get(t.slug)!
      const topicQuestions = allQuestionIds.filter((q) => q.topicId === topicId)
      if (topicQuestions.length === 0) continue
      const exam = await db.exam.create({
        data: {
          title: `آزمونک موضوعی — ${t.title}`,
          type: 'TOPIC_QUIZ',
          chapterId: chInfo.id,
          grade: 'GRADE_12_PHYSICS',
          durationMin: Math.max(5, topicQuestions.length * 2),
          questionCount: topicQuestions.length,
          isActive: true,
        },
      })
      for (let i = 0; i < topicQuestions.length; i++) {
        await db.examQuestion.create({
          data: { examId: exam.id, questionId: topicQuestions[i].id, order: i },
        })
      }
    }
  }

  // 8b. Chapter exams — pick all questions of that chapter's topics
  for (const ch of CHAPTERS_GRADE_12) {
    const chInfo = chapterMap.get(ch.slug)!
    const chapterTopics = ch.topics.map((t) => chInfo.topics.get(t.slug)!)
    const chapterQuestions = allQuestionIds.filter((q) => chapterTopics.includes(q.topicId))
    const exam = await db.exam.create({
      data: {
        title: `آزمون جامع فصل — ${ch.title}`,
        type: 'CHAPTER_EXAM',
        chapterId: chInfo.id,
        grade: 'GRADE_12_PHYSICS',
        durationMin: 30,
        questionCount: chapterQuestions.length,
        isActive: true,
      },
    })
    for (let i = 0; i < chapterQuestions.length; i++) {
      await db.examQuestion.create({
        data: { examId: exam.id, questionId: chapterQuestions[i].id, order: i },
      })
    }
  }

  // 8c. Konkur simulator — 30 random questions across all chapters
  const shuffled = [...allQuestionIds].sort(() => Math.random() - 0.5).slice(0, 30)
  const konkur = await db.exam.create({
    data: {
      title: 'شبیه‌ساز کنکور فیزیک — آزمون کامل',
      type: 'KONKUR_SIM',
      grade: 'GRADE_12_PHYSICS',
      durationMin: 90,
      questionCount: 30,
      isActive: true,
    },
  })
  for (let i = 0; i < shuffled.length; i++) {
    await db.examQuestion.create({
      data: { examId: konkur.id, questionId: shuffled[i].id, order: i },
    })
  }

  // 9. Sample exam attempts for ~half the students, on first 3 chapters' topic quizzes
  console.log('📝 Generating sample exam attempts...')
  const sampleStudents = students.slice(0, 12)
  for (const s of sampleStudents) {
    // pick 4-6 topic quizzes
    const topicExams = await db.exam.findMany({
      where: { type: 'TOPIC_QUIZ' },
      take: 8,
      include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } },
    })
    for (const exam of topicExams.slice(0, randInt(3, 6))) {
      const attempt = await db.examAttempt.create({
        data: {
          examId: exam.id,
          userId: s.id,
          finishedAt: new Date(Date.now() - randInt(1, 14) * 24 * 60 * 60 * 1000),
          durationSec: randInt(120, exam.durationMin * 60),
          isFinished: true,
        },
      })
      let correct = 0, wrong = 0, blank = 0
      for (const eq of exam.questions) {
        const q = eq.question
        // simulate accuracy based on student skill (random per student)
        const skill = (sampleStudents.indexOf(s) % 3) / 3 + 0.4 // 0.4..0.93
        const r = Math.random()
        let selected: 'A' | 'B' | 'C' | 'D' | null = null
        if (r < 0.1) {
          blank++
        } else if (r < skill) {
          selected = q.correctOption
          correct++
        } else {
          // pick a wrong one
          const opts = ['A', 'B', 'C', 'D'].filter((o) => o !== q.correctOption) as ('A' | 'B' | 'C' | 'D')[]
          selected = pick(opts)
          wrong++
        }
        await db.questionAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: q.id,
            userId: s.id,
            selected,
            isCorrect: selected === q.correctOption,
            timeSpentSec: randInt(15, 120),
          },
        })
      }
      const total = exam.questions.length
      const score = total > 0 ? (correct - wrong * 0.25) * (20 / total) : 0
      await db.examAttempt.update({
        where: { id: attempt.id },
        data: {
          correctCount: correct,
          wrongCount: wrong,
          blankCount: blank,
          score: Math.max(0, Number(score.toFixed(2))),
        },
      })
    }
  }

  // 10. Leitner cards (formulas) — a few per sample student
  const FORMULAS = [
    { front: 'سرعت در حرکت یکنواخت', back: 'v = Δx / Δt' },
    { front: 'معادله حرکت شتاب‌دار', back: 'x = x₀ + v₀t + ½at²' },
    { front: 'قانون دوم نیوتن', back: 'F = ma' },
    { front: 'انرژی جنبشی', back: 'K = ½mv²' },
    { front: 'انرژی پتانسیل گرانشی', back: 'U = mgh' },
    { front: 'انرژی پتانسیل فنر', back: 'U = ½kx²' },
    { front: 'قانون کولن', back: 'F = k|q₁q₂|/r²' },
    { front: 'قانون اهم', back: 'V = IR' },
    { front: 'نیروی لورنتز', back: 'F = qvB sin θ' },
    { front: 'دوره پاندول ساده', back: 'T = 2π√(L/g)' },
    { front: 'دوره نوسانگر جرم-فنر', back: 'T = 2π√(m/k)' },
    { front: 'سرعت موج', back: 'v = fλ' },
  ]
  for (const s of sampleStudents.slice(0, 6)) {
    for (let i = 0; i < 6; i++) {
      const f = FORMULAS[i]
      await db.leitnerCard.create({
        data: {
          userId: s.id,
          front: f.front,
          back: f.back,
          box: pick([1, 1, 1, 2, 2, 3]),
          nextReview: new Date(Date.now() + randInt(0, 3) * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  // 11. A notification from manager
  await db.notification.create({
    data: {
      scope: 'ALL',
      title: 'آزمونک موضوعی فصل دینامیک فعال شد',
      body: 'پس از جلسه امروز، آزمونک مبحث «اصطکاک در سطح شیب‌دار» به‌عنوان تکلیف فعال است. تا کلاس بعد تکمیل کنید.',
      type: 'REMINDER',
    },
  })

  // 12. Subscription for each student (paid annual phase 1)
  for (const s of students) {
    await db.subscription.create({
      data: {
        userId: s.id,
        plan: 'annual_phase1',
        amount: 1_200_000, // 1.2M toman
        isPaid: true,
        startDate: new Date(Date.now() - randInt(1, 60) * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        refCode: `TRX${randomUUID().slice(0, 8)}`,
      },
    })
  }

  console.log('✅ Seeded successfully.')
  console.log(`   Manager: ${manager.phone} / 1234`)
  console.log(`   Teacher: ${teacher.phone} / 1234`)
  console.log(`   Students: 09120010003 .. 09120010022 / 1234`)
  console.log(`   Total questions: ${allQuestionIds.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
