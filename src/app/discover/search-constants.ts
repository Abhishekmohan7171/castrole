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
  
  // Personality Traits
  'hero',
  'villain',
  'anti-hero',
  'comic relief',
  'mentor',
  'sidekick',
  'rebel',
  'leader',
  'follower',
  'innocent',
  'wise',
  'naive',
  'cunning',
  'loyal',
  'betrayer',
  'protector',
  'survivor',
  
  // Social Roles
  'parent',
  'child',
  'sibling',
  'friend',
  'lover',
  'enemy',
  'stranger',
  'authority figure',
  'outcast',
  'popular',
  
  // Professional/Occupational
  'student',
  'teacher',
  'doctor',
  'lawyer',
  'cop',
  'criminal',
  'artist',
  'athlete',
  'businessman',
  'soldier',
  
  // Age-related
  'young',
  'old',
  'middle-aged',
  'teenager',
  'elderly'
];

// Synonym mapping for smart search
export const CHARACTER_TYPE_SYNONYMS: Record<string, string> = {
  'mad': 'angry',
  'furious': 'angry',
  'enraged': 'angry',
  'upset': 'sad',
  'depressed': 'sad',
  'joyful': 'happy',
  'cheerful': 'happy',
  'scared': 'fearful',
  'afraid': 'fearful',
  'worried': 'anxious',
  'nervous': 'anxious',
  'sure': 'confident',
  'weak': 'vulnerable',
  'fun': 'playful',
  'grave': 'serious',
  'ironic': 'sarcastic',
  'loving': 'romantic',
  'cold': 'cold detached',
  'warm': 'warm affectionate',
  'enigmatic': 'mysterious',
  'torn': 'conflicted',
  'envious': 'jealous',
  'optimistic': 'hopeful',
  'annoyed': 'frustrated',
  'wistful': 'nostalgic',
  'good guy': 'hero',
  'bad guy': 'villain',
  'antagonist': 'villain',
  'protagonist': 'hero',
  'funny': 'comic relief',
  'guide': 'mentor',
  'assistant': 'sidekick',
  'revolutionary': 'rebel',
  'boss': 'leader',
  'chief': 'leader',
  'subordinate': 'follower',
  'pure': 'innocent',
  'smart': 'wise',
  'foolish': 'naive',
  'clever': 'cunning',
  'faithful': 'loyal',
  'traitor': 'betrayer',
  'guardian': 'protector',
  'fighter': 'survivor',
  'mom': 'parent',
  'dad': 'parent',
  'father': 'parent',
  'mother': 'parent',
  'kid': 'child',
  'brother': 'sibling',
  'sister': 'sibling',
  'buddy': 'friend',
  'partner': 'lover',
  'foe': 'enemy',
  'rival': 'enemy',
  'unknown': 'stranger',
  'authority': 'authority figure',
  'loner': 'outcast',
  'misfit': 'outcast',
  'famous': 'popular',
  'pupil': 'student',
  'professor': 'teacher',
  'physician': 'doctor',
  'attorney': 'lawyer',
  'police': 'cop',
  'thief': 'criminal',
  'painter': 'artist',
  'sportsman': 'athlete',
  'entrepreneur': 'businessman',
  'military': 'soldier',
  'youth': 'young',
  'senior': 'old',
  'adult': 'middle-aged',
  'teen': 'teenager',
  'aged': 'elderly'
};

// Gender options (matching Edit Profile)
export const GENDER_OPTIONS = [
  { value: 'any', label: 'any' },
  { value: 'male', label: 'male' },
  { value: 'female', label: 'female' },
  { value: 'non-binary', label: 'non-binary' },
  { value: 'transgender', label: 'transgender' },
  { value: 'genderqueer', label: 'genderqueer' },
  { value: 'genderfluid', label: 'genderfluid' },
  { value: 'agender', label: 'agender' },
  { value: 'two-spirit', label: 'two-spirit' },
  { value: 'other', label: 'other' }
];

// Skills list (from Edit Profile)
// export const AVAILABLE_SKILLS = [
//   'Acting', 'Dance', 'Singing', 'Voice Acting', 'Dubbing',
//   'Stage Performance', 'Classical Dance', 'Contemporary Dance',
//   'Hip Hop', 'Ballet', 'Bharatanatyam', 'Kathak', 'Kuchipudi',
//   'Odissi', 'Mohiniyattam', 'Kathakali', 'Martial Arts', 'Stunts',
//   'Horse Riding', 'Swimming', 'Gymnastics', 'Acrobatics',
//   'Comedy', 'Stand-up Comedy', 'Improv', 'Mimicry',
//   'Musical Instrument', 'Guitar', 'Piano', 'Drums', 'Tabla',
//   'Flute', 'Harmonium', 'Method Acting', 'Classical Acting',
//   'Physical Theatre', 'Puppetry', 'Mime', 'Sketch Comedy',
//   'Voice Modulation', 'Dialect/Accent', 'Action Choreography',
//   'Fight Choreography'
// ];

export const AVAILABLE_SKILLS = [
  // Combat & Action
  'Boxing',
  'Kickboxing',
  'Karate',
  'Taekwondo',
  'Judo',
  'Kung Fu',
  'Kalaripayattu',
  'Martial Arts',
  'Stunts',
  'Stage Combat',
  'Fight Choreography',
  'Action Choreography',
  // Sports & Physical
  'Gym / Weight Training',
  'Gymnastics',
  'Acrobatics',
  'Parkour',
  'Athletics',
  'Yoga',
  'Swimming',
  'Diving',
  'Cycling',
  // Adventure & Riding
  'Horse Riding',
  'Bike Riding',
  'Car Driving',
  'Skateboarding',
  'Roller Skating',
  'Rock Climbing',
  // Music & Voice
  'Singing',
  'Classical Singing',
  'Western Singing',
  'Voice Acting',
  'Voice Modulation',
  'Dubbing',
  'Beatboxing',
  // Musical Instruments
  'Guitar',
  'Electric Guitar',
  'Bass Guitar',
  'Piano',
  'Keyboard',
  'Drums',
  'Tabla',
  'Flute',
  'Harmonium',
  'Violin',
  'Ukulele',
  // Performance Add-ons
  'Dance',
  'Classical Dance',
  'Contemporary Dance',
  'Hip Hop',
  'Freestyle Dance',
  'Bharatanatyam',
  'Kathak',
  'Kuchipudi',
  'Odissi',
  'Mohiniyattam',
  'Kathakali',
  // Presentation
  'Stand-up Comedy',
  'Improv',
  'Mimicry',
  'Anchoring',
  'Public Speaking'
];

// Languages list (from Edit Profile)
// export const AVAILABLE_LANGUAGES = [
//   // Indian languages
//   'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
//   'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi',
//   'Assamese', 'Maithili', 'Konkani', 'Manipuri', 'Sindhi',
//   'Kashmiri', 'Dogri',
//   // Other widely-used languages
//   'Spanish', 'French', 'German', 'Italian', 'Portuguese',
//   'Russian', 'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic'
// ];
export const AVAILABLE_LANGUAGES = [
  // Indian languages
  'English',
  'Hindi',
  'Malayalam',
  'Tamil',
  'Telugu',
  'Kannada',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Odia',
  'Assamese',
  'Konkani',
  'Sindhi',
  'Kashmiri',
  'Dogri',
  'Maithili',
  'Manipuri (Meitei)',
  'Nepali',
  'Bodo',
  'Santhali',

  // International
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Arabic',
  'Chinese (Mandarin)',
  'Chinese (Cantonese)',
  'Japanese',
  'Korean',
  'Turkish',
  'Persian (Farsi)',
  'Hebrew',
  'Thai',
  'Vietnamese',
  'Indonesian',
  'Malay',

  // Classical / Special
  'Sanskrit',
  'Latin'
];

export const AVAILABLE_DISTRICTS_INDIA = [

  // =========================
  // ANDHRA PRADESH (26)
  // =========================
  'Anakapalli','Anantapur','Annamayya','Bapatla','Chittoor',
  'East Godavari','Eluru','Guntur','Kakinada','Konaseema',
  'Krishna','Kurnool','Nandyal','NTR','Palnadu',
  'Parvathipuram Manyam','Prakasam','Srikakulam',
  'Sri Sathya Sai','Tirupati','Visakhapatnam',
  'Vizianagaram','West Godavari','YSR Kadapa',

  // =========================
  // ARUNACHAL PRADESH (25)
  // =========================
  'Anjaw','Changlang','Dibang Valley','East Kameng','East Siang',
  'Kamle','Kra Daadi','Kurung Kumey','Lepa Rada','Lohit',
  'Longding','Lower Dibang Valley','Lower Siang','Lower Subansiri',
  'Namsai','Pakke Kessang','Papum Pare','Shi Yomi','Siang',
  'Tawang','Tirap','Upper Siang','Upper Subansiri',
  'West Kameng','West Siang',

  // =========================
  // ASSAM (35)
  // =========================
  'Baksa','Barpeta','Biswanath','Bongaigaon','Cachar',
  'Charaideo','Chirang','Darrang','Dhemaji','Dhubri',
  'Dibrugarh','Dima Hasao','Goalpara','Golaghat',
  'Hailakandi','Hojai','Jorhat','Kamrup','Kamrup Metropolitan',
  'Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur',
  'Majuli','Morigaon','Nagaon','Nalbari','Sivasagar',
  'Sonitpur','South Salmara-Mankachar','Tinsukia',
  'Udalguri','West Karbi Anglong',

  // =========================
  // BIHAR (38)
  // =========================
  'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur',
  'Bhojpur','Buxar','Darbhanga','East Champaran','Gaya',
  'Gopalganj','Jamui','Jehanabad','Kaimur','Katihar',
  'Khagaria','Kishanganj','Lakhisarai','Madhepura',
  'Madhubani','Munger','Muzaffarpur','Nalanda','Nawada',
  'Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran',
  'Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul',
  'Vaishali','West Champaran',

  // =========================
  // CHHATTISGARH (33)
  // =========================
  'Balod','Baloda Bazar','Balrampur','Bastar','Bemetara',
  'Bijapur','Bilaspur','Dantewada','Dhamtari','Durg',
  'Gariaband','Gaurela-Pendra-Marwahi','Janjgir-Champa',
  'Jashpur','Kabirdham','Kanker','Khairagarh-Chhuikhadan-Gandai',
  'Kondagaon','Korba','Koriya','Mahasamund',
  'Manendragarh-Chirmiri-Bharatpur','Mohla-Manpur-Ambagarh Chowki',
  'Mungeli','Narayanpur','Raigarh','Raipur','Rajnandgaon',
  'Sarangarh-Bilaigarh','Sukma','Surajpur','Surguja',

  // =========================
  // GOA (2)
  // =========================
  'North Goa','South Goa',

  // =========================
  // GUJARAT (33)
  // =========================
  'Ahmedabad','Amreli','Anand','Aravalli','Banaskantha',
  'Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod',
  'Dang','Devbhoomi Dwarka','Gandhinagar','Gir Somnath',
  'Jamnagar','Junagadh','Kheda','Kutch','Mahisagar',
  'Mehsana','Morbi','Narmada','Navsari','Panchmahal',
  'Patan','Porbandar','Rajkot','Sabarkantha','Surat',
  'Surendranagar','Tapi','Vadodara','Valsad',

  // =========================
  // HARYANA (22)
  // =========================
  'Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad',
  'Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal',
  'Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula',
  'Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar',

  // =========================
  // HIMACHAL PRADESH (12)
  // =========================
  'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu',
  'Lahaul and Spiti','Mandi','Shimla','Sirmaur','Solan','Una',

  // =========================
  // JHARKHAND (24)
  // =========================
  'Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum',
  'Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara',
  'Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu',
  'Ramgarh','Ranchi','Sahebganj','Seraikela Kharsawan',
  'Simdega','West Singhbhum',

  // =========================
  // KARNATAKA (31)
  // =========================
  'Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban',
  'Bidar','Chamarajanagar','Chikkaballapur','Chikkamagaluru',
  'Chitradurga','Dakshina Kannada','Davanagere','Dharwad',
  'Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar',
  'Koppal','Mandya','Mysuru','Raichur','Ramanagara',
  'Shivamogga','Tumakuru','Udupi','Uttara Kannada',
  'Vijayanagara','Vijayapura','Yadgir',

  // =========================
  // KERALA (14)
  // =========================
  'Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam',
  'Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta',
  'Thiruvananthapuram','Thrissur','Wayanad',

  // =========================
  // MADHYA PRADESH (55)
  // =========================
  'Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat',
  'Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur',
  'Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna',
  'Gwalior','Harda','Indore','Jabalpur','Jhabua','Katni',
  'Khandwa','Khargone','Mandla','Mandsaur','Morena',
  'Narsinghpur','Neemuch','Niwari','Panna','Raisen','Rajgarh',
  'Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol',
  'Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli',
  'Tikamgarh','Ujjain','Umaria','Vidisha',

  // =========================
  // MAHARASHTRA (36)
  // =========================
  'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara',
  'Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli',
  'Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban',
  'Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar',
  'Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara',
  'Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal',

  // =========================
  // MANIPUR (16)
  // =========================
  'Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West',
  'Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl',
  'Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul',

  // =========================
  // MEGHALAYA (12)
  // =========================
  'East Garo Hills','East Jaintia Hills','East Khasi Hills',
  'North Garo Hills','Ri Bhoi','South Garo Hills',
  'South West Garo Hills','South West Khasi Hills',
  'West Garo Hills','West Jaintia Hills','West Khasi Hills',

  // =========================
  // MIZORAM (11)
  // =========================
  'Aizawl','Champhai','Hnahthial','Khawzawl','Kolasib',
  'Lawngtlai','Lunglei','Mamit','Saiha','Saitual','Serchhip',

  // =========================
  // NAGALAND (16)
  // =========================
  'Chümoukedima','Dimapur','Kiphire','Kohima','Longleng',
  'Mokokchung','Mon','Niuland','Noklak','Peren','Phek',
  'Shamator','Tseminyü','Tuensang','Wokha','Zunheboto',

  // =========================
  // ODISHA (30)
  // =========================
  'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh',
  'Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam',
  'Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal',
  'Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri',
  'Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri',
  'Rayagada','Sambalpur','Subarnapur','Sundargarh',

  // =========================
  // PUNJAB (23)
  // =========================
  'Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib',
  'Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar',
  'Kapurthala','Ludhiana','Malerkotla','Mansa','Moga',
  'Muktsar','Pathankot','Patiala','Rupnagar','SAS Nagar',
  'Sangrur','Shahid Bhagat Singh Nagar','Tarn Taran',

  // =========================
  // RAJASTHAN (50)
  // =========================
  'Ajmer','Alwar','Anupgarh','Balotra','Banswara','Baran','Barmer',
  'Beawar','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh',
  'Churu','Dausa','Deeg','Dholpur','Didwana-Kuchaman','Dudu',
  'Dungarpur','Gangapur City','Hanumangarh','Jaipur','Jaipur Rural',
  'Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur East',
  'Jodhpur West','Karauli','Kekri','Khairthal-Tijara','Kota',
  'Kotputli-Behror','Nagaur','Pali','Pratapgarh','Rajsamand',
  'Salumbar','Sanchore','Sawai Madhopur','Shahpura','Sikar',
  'Sirohi','Sri Ganganagar','Tonk','Udaipur',

  // =========================
  // SIKKIM (6)
  // =========================
  'East Sikkim','North Sikkim','Pakyong','Soreng','South Sikkim','West Sikkim',

  // =========================
  // TAMIL NADU (38)
  // =========================
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore',
  'Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram',
  'Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai',
  'Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai',
  'Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi',
  'Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli',
  'Tirupattur','Tiruppur','Tiruvallur','Tiruvannamalai',
  'Tiruvarur','Vellore','Viluppuram','Virudhunagar',

  // =========================
  // TELANGANA (33)
  // =========================
  'Adilabad','Bhadradri Kothagudem','Hanamkonda','Hyderabad',
  'Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal',
  'Kamareddy','Karimnagar','Khammam','Kumuram Bheem',
  'Mahabubabad','Mahabubnagar','Mancherial','Medak',
  'Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda',
  'Narayanpet','Nirmal','Nizamabad','Peddapalli',
  'Rajanna Sircilla','Ranga Reddy','Sangareddy','Siddipet',
  'Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri',

  // =========================
  // TRIPURA (8)
  // =========================
  'Dhalai','Gomati','Khowai','North Tripura',
  'Sepahijala','South Tripura','Unakoti','West Tripura',

  // =========================
  // UTTAR PRADESH (75)
  // =========================
  'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya',
  'Ayodhya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur',
  'Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor',
  'Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah',
  'Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar',
  'Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur',
  'Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj',
  'Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri',
  'Kushinagar','Lalitpur','Lucknow','Maharajganj','Mahoba',
  'Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad',
  'Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Raebareli',
  'Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur',
  'Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra',
  'Sultanpur','Unnao','Varanasi',

  // =========================
  // UTTARAKHAND (13)
  // =========================
  'Almora','Bageshwar','Chamoli','Champawat','Dehradun',
  'Haridwar','Nainital','Pauri Garhwal','Pithoragarh',
  'Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi',

  // =========================
  // WEST BENGAL (23)
  // =========================
  'Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur',
  'Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram',
  'Kalimpong','Kolkata','Malda','Murshidabad','Nadia',
  'North 24 Parganas','Paschim Bardhaman','Paschim Medinipur',
  'Purba Bardhaman','Purba Medinipur','Purulia',
  'South 24 Parganas','Uttar Dinajpur'
];

export const AVAILABLE_LOCATIONS_INTERNATIONAL = [
  // Americas
  'New York City','Los Angeles','Chicago','Atlanta','Toronto',
  'Vancouver','Mexico City','São Paulo','Buenos Aires',

  // Europe
  'London','Paris','Berlin','Rome','Madrid','Barcelona',
  'Amsterdam','Vienna','Zurich','Stockholm','Oslo','Copenhagen',

  // Middle East
  'Dubai','Abu Dhabi','Doha','Riyadh','Jeddah','Tel Aviv','Istanbul',

  // Asia
  'Tokyo','Osaka','Seoul','Busan','Beijing','Shanghai','Hong Kong',
  'Singapore','Bangkok','Kuala Lumpur','Jakarta','Manila',

  // Australia & Africa
  'Sydney','Melbourne','Auckland','Cape Town','Johannesburg','Nairobi'
];

// Combined and pre-sorted locations (computed once at module load)
export const AVAILABLE_LOCATIONS_ALL = [...AVAILABLE_DISTRICTS_INDIA, ...AVAILABLE_LOCATIONS_INTERNATIONAL].sort();