// Conversation-track scenarios. Language-neutral briefs: the AI tutor plays the role in the target language
// at the learner's level. Unlocked by level, never by time.
export interface Scenario { id: string; level: number; title: string; brief: string; goal: string }

export const SCENARIOS: Scenario[] = [
  { id: 'meet', level: 0, title: 'Meeting someone new', brief: 'You are a friendly stranger at a language café meeting the learner for the first time.', goal: 'Exchange names, origins and one hobby.' },
  { id: 'cafe', level: 0, title: 'Ordering at a café', brief: 'You are a waiter in a small café. Take the learner’s order, offer one alternative, and tell them the price.', goal: 'Order a drink and something to eat, and pay.' },
  { id: 'family', level: 0, title: 'Talking about family', brief: 'You are a new classmate asking about the learner’s family and telling them about yours.', goal: 'Describe family members and ages.' },
  { id: 'directions', level: 0, title: 'Asking for directions', brief: 'You are a local on the street. The learner is looking for the train station; give simple directions.', goal: 'Ask where a place is and confirm the route.' },
  { id: 'market', level: 0, title: 'At the market', brief: 'You are a market seller of fruit and vegetables. Quote prices and quantities.', goal: 'Buy three items and ask the total.' },
  { id: 'routine', level: 1, title: 'Your daily routine', brief: 'You are a curious friend asking what the learner does on a typical weekday and at weekends.', goal: 'Describe a day using times and frequency words.' },
  { id: 'taxi', level: 1, title: 'Taking a taxi', brief: 'You are a talkative taxi driver. Ask where to, discuss the route and make small talk about the city.', goal: 'Give a destination, ask the fare and chat.' },
  { id: 'hotel', level: 1, title: 'Checking into a hotel', brief: 'You are a hotel receptionist. There is a small problem with the booking that you must sort out with the guest.', goal: 'Check in, resolve the problem, ask about breakfast.' },
  { id: 'weekend', level: 1, title: 'What did you do last weekend?', brief: 'You are a colleague on Monday morning asking about the learner’s weekend and sharing yours.', goal: 'Narrate past events in order.' },
  { id: 'doctor', level: 1, title: 'At the doctor', brief: 'You are a doctor. Ask about symptoms, how long they have lasted, and give simple advice.', goal: 'Describe symptoms and understand instructions.' },
  { id: 'plans', level: 1, title: 'Making plans', brief: 'You are a friend trying to arrange to meet this week; your schedules clash at first.', goal: 'Suggest, decline and agree on a time and place.' },
  { id: 'shopping', level: 2, title: 'Returning a purchase', brief: 'You are a shop assistant. The learner wants to return an item without a receipt; be polite but follow the rules.', goal: 'Explain a problem and negotiate a solution.' },
  { id: 'interview', level: 2, title: 'Job interview', brief: 'You are an interviewer for an office job. Ask about experience, strengths and why they want the job.', goal: 'Talk about experience and motivations.' },
  { id: 'flat', level: 2, title: 'Renting a flat', brief: 'You are a landlord showing a flat. Answer questions about rent, bills and rules; one thing about the flat is a drawback.', goal: 'Ask detailed questions and state preferences.' },
  { id: 'childhood', level: 2, title: 'Childhood memories', brief: 'You are an old friend reminiscing. Ask what the learner used to do as a child and compare with your own childhood.', goal: 'Describe habits and scenes in the past.' },
  { id: 'travel-problem', level: 2, title: 'A travel mishap', brief: 'You are an airline desk agent. The learner’s flight was cancelled; offer options with trade-offs.', goal: 'Complain politely, compare options, decide.' },
  { id: 'advice', level: 3, title: 'Giving advice', brief: 'You are a friend with a dilemma: a good job offer abroad versus staying near family. Ask the learner what you should do and push back a little.', goal: 'Give advice, hypothesise, justify.' },
  { id: 'debate-city', level: 3, title: 'City or countryside?', brief: 'You are a debating partner who prefers the opposite of whatever the learner prefers. Argue respectfully.', goal: 'Defend an opinion and concede points.' },
  { id: 'news', level: 3, title: 'Discussing the news', brief: 'You are a colleague discussing a recent (invented, plausible) local news story about public transport prices.', goal: 'Summarise, react and speculate.' },
  { id: 'complaint', level: 3, title: 'A formal complaint', brief: 'You are a customer-service manager on the phone. The learner must complain formally about repeated internet outages.', goal: 'Use formal register, state demands, reach agreement.' },
  { id: 'culture', level: 4, title: 'Culture and identity', brief: 'You are a thoughtful interviewer for a cultural podcast, asking how language shapes identity and what is lost in translation.', goal: 'Develop abstract ideas with nuance.' },
  { id: 'negotiation', level: 4, title: 'Business negotiation', brief: 'You are a supplier negotiating price, delivery times and penalties. Be firm but open to creative trade-offs.', goal: 'Negotiate with hedging and diplomatic language.' },
  { id: 'ethics', level: 4, title: 'An ethical dilemma', brief: 'You are a philosophy seminar partner. Pose a dilemma about AI and privacy and challenge the learner’s reasoning.', goal: 'Build and defend a structured argument.' },
  { id: 'humour', level: 4, title: 'Idioms and humour', brief: 'You are a witty native friend who uses idioms, proverbs and wordplay, and explains one whenever the learner asks.', goal: 'Understand and use idiomatic language.' },
];
