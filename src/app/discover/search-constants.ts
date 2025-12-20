/**
 * Constants for search component
 * Character types, synonyms, and predefined lists
 */

// Comprehensive character types list
export const CHARACTER_TYPES = [
  // Emotional States
  'angry',
  'sad',
  'happy',
  'intense',
  'calm',
  'romantic',
  'fearful',
  'anxious',
  'confident',
  'vulnerable',
  'playful',
  'serious',
  'sarcastic',
  'cold detached',
  'warm affectionate',
  'mysterious',
  'conflicted',
  'jealous',
  'hopeful',
  'frustrated',
  'nostalgic',
  
  // Energy Levels
  'high energy',
  'low energy',
  'subtle',
  'dramatic',
  'deadpan',
  'expressive',
  'emotional breakdown',
  
  // Genres
  'comedy',
  'drama',
  'dark drama',
  'romance',
  'romantic comedy',
  'thriller',
  'crime',
  'action',
  'horror',
  'psychological',
  'family',
  'slice of life',
  'social drama',
  'inspirational',
  'fantasy',
  'sci fi',
  'period historical',
  'musical',
  
  // Performance Styles
  'naturalistic',
  'stylised',
  'theatrical',
  'improvisational',
  'monologue heavy',
  'dialogue heavy',
  'physical performance',
  'comic timing',
  'expression driven'
];

// Synonym mapping for smart search
export const CHARACTER_TYPE_SYNONYMS: Record<string, string[]> = {
  "happy": [
    "joyful", "cheerful", "delighted", "bright", "positive",
    "light hearted", "uplifting", "smiling"
  ],
  "sad": [
    "melancholic", "depressed", "heartbroken", "grief",
    "tearful", "low mood", "sorrowful"
  ],
  "angry": [
    "rage", "furious", "irritated", "aggressive",
    "resentful", "hostile"
  ],
  "intense": [
    "powerful", "strong", "emotionally charged",
    "high intensity", "forceful"
  ],
  "calm": [
    "peaceful", "composed", "relaxed", "quiet", "soft"
  ],
  "romantic": [
    "love", "affectionate", "intimate", "tender"
  ],
  "fearful": [
    "scared", "terrified", "frightened", "afraid"
  ],
  "anxious": [
    "nervous", "restless", "uneasy", "worried"
  ],
  "confident": [
    "bold", "assured", "self assured", "assertive"
  ],
  "vulnerable": [
    "fragile", "exposed", "emotionally open"
  ],
  "playful": [
    "fun", "mischievous", "light", "quirky"
  ],
  "serious": [
    "grave", "stern", "focused", "no nonsense"
  ],
  "sarcastic": [
    "ironic", "dry humour", "witty"
  ],
  "cold detached": [
    "emotionless", "distant", "aloof", "reserved"
  ],
  "warm affectionate": [
    "kind", "gentle", "caring", "loving"
  ],
  "mysterious": [
    "enigmatic", "secretive", "unknown", "cryptic"
  ],
  "conflicted": [
    "torn", "internal struggle", "dual emotions"
  ],
  "jealous": [
    "possessive", "insecure", "envious"
  ],
  "hopeful": [
    "optimistic", "aspiring", "faith driven"
  ],
  "frustrated": [
    "annoyed", "irritated", "fed up"
  ],
  "nostalgic": [
    "sentimental", "reminiscent", "past longing"
  ],
  "high energy": [
    "energetic", "lively", "hyper", "fast paced"
  ],
  "low energy": [
    "slow", "lethargic", "tired", "subdued"
  ],
  "subtle": [
    "understated", "minimal", "soft performance"
  ],
  "dramatic": [
    "high drama", "over the top", "emotion heavy"
  ],
  "deadpan": [
    "flat delivery", "expressionless", "dry tone"
  ],
  "expressive": [
    "animated", "emotionally open", "visible emotions"
  ],
  "emotional breakdown": [
    "crying", "collapse", "outburst", "meltdown"
  ],
  "comedy": [
    "humour", "funny", "comic"
  ],
  "drama": [
    "emotional drama", "character driven"
  ],
  "dark drama": [
    "grim", "serious drama", "heavy themes"
  ],
  "thriller": [
    "suspense", "edge of seat", "tension"
  ],
  "psychological": [
    "mental", "mind driven", "internal conflict"
  ],
  "slice of life": [
    "real life", "everyday", "ordinary moments"
  ],
  "social drama": [
    "social issue", "real world issue", "societal"
  ],
  "inspirational": [
    "motivational", "uplifting story", "hope driven"
  ],
  "naturalistic": [
    "real", "raw", "lifelike"
  ],
  "stylised": [
    "artistic", "designed", "non realistic"
  ],
  "theatrical": [
    "stage like", "dramatic delivery"
  ],
  "improvisational": [
    "improv", "unscripted", "spontaneous"
  ],
  "physical performance": [
    "body driven", "movement heavy", "action based"
  ],
  "comic timing": [
    "timing based humour", "beat comedy"
  ],
  "expression driven": [
    "face acting", "micro expressions"
  ]
};

// Gender options (matching Edit Profile)
export const GENDER_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'transgender', label: 'Transgender' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'genderfluid', label: 'Genderfluid' },
  { value: 'agender', label: 'Agender' },
  { value: 'two-spirit', label: 'Two-Spirit' },
  { value: 'other', label: 'Other' }
];

// Skills list (from Edit Profile)
export const AVAILABLE_SKILLS = [
  'Acting', 'Dance', 'Singing', 'Voice Acting', 'Dubbing',
  'Stage Performance', 'Classical Dance', 'Contemporary Dance',
  'Hip Hop', 'Ballet', 'Bharatanatyam', 'Kathak', 'Kuchipudi',
  'Odissi', 'Mohiniyattam', 'Kathakali', 'Martial Arts', 'Stunts',
  'Horse Riding', 'Swimming', 'Gymnastics', 'Acrobatics',
  'Comedy', 'Stand-up Comedy', 'Improv', 'Mimicry',
  'Musical Instrument', 'Guitar', 'Piano', 'Drums', 'Tabla',
  'Flute', 'Harmonium', 'Method Acting', 'Classical Acting',
  'Physical Theatre', 'Puppetry', 'Mime', 'Sketch Comedy',
  'Voice Modulation', 'Dialect/Accent', 'Action Choreography',
  'Fight Choreography'
];

// Languages list (from Edit Profile)
export const AVAILABLE_LANGUAGES = [
  // Indian languages
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
  'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi',
  'Assamese', 'Maithili', 'Konkani', 'Manipuri', 'Sindhi',
  'Kashmiri', 'Dogri',
  // Other widely-used languages
  'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic'
];
