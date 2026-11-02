export interface LocationSuggestion {
  id: string;
  title: string;
  subtitle: string;
  address: string;
  lat: number;
  lng: number;
  category?: 'transit' | 'station' | 'tech_park' | 'area' | 'circle' | 'college' | 'mall';
}

/**
 * Comprehensive Nashik Intra-City Commute Locations & Hubs
 * Covers all railway stations, bus stands, arterial circles, industrial zones,
 * IT hubs, colleges, residential neighborhoods, and landmarks across Nashik.
 */
export const NASHIK_LOCATIONS: LocationSuggestion[] = [
  // 1. Primary Transit & Stations
  {
    id: 'nsk-rwy-stn',
    title: 'Nashik Road Railway Station',
    subtitle: 'Deolali Gaon, Subhash Road, Nashik Road',
    address: 'Nashik Road Railway Station, Nashik, Maharashtra',
    lat: 19.9582,
    lng: 73.8449,
    category: 'station',
  },
  {
    id: 'nsk-cbs-old',
    title: 'CBS (Central Bus Stand)',
    subtitle: 'Gole Colony, Old CBS Circle, Nashik',
    address: 'Central Bus Stand (CBS), Gole Colony, Nashik, Maharashtra',
    lat: 19.9975,
    lng: 73.7853,
    category: 'transit',
  },
  {
    id: 'nsk-thakkar-bazaar',
    title: 'Thakkar Bazaar Bus Stand (New CBS)',
    subtitle: 'Canada Corner / Sharanpur Road, Nashik',
    address: 'Thakkar Bazaar Bus Stand, Canada Corner, Nashik, Maharashtra',
    lat: 19.9961,
    lng: 73.7747,
    category: 'transit',
  },
  {
    id: 'nsk-mahamarg-bus',
    title: 'Mahamarg Bus Stand',
    subtitle: 'Mumbai Naka, Tidke Colony, Nashik',
    address: 'Mahamarg Bus Stand, Mumbai Naka, Nashik, Maharashtra',
    lat: 19.9867,
    lng: 73.7794,
    category: 'transit',
  },
  {
    id: 'nsk-nimani-bus',
    title: 'Nimani Bus Stand',
    subtitle: 'Panchavati, Peth Naka Corridor, Nashik',
    address: 'Nimani Bus Stand, Panchavati, Nashik, Maharashtra',
    lat: 20.0097,
    lng: 73.7994,
    category: 'transit',
  },
  {
    id: 'nsk-deolali-rwy',
    title: 'Deolali Railway Station',
    subtitle: 'Rest Camp Road, Deolali, Nashik',
    address: 'Deolali Railway Station, Deolali, Nashik, Maharashtra',
    lat: 19.9412,
    lng: 73.8344,
    category: 'station',
  },

  // 2. High-Frequency Commute Circles & Highway Junctions
  {
    id: 'nsk-dwarka-circle',
    title: 'Dwarka Circle',
    subtitle: 'Mumbai-Agra Highway & Pune Highway Junction, Nashik',
    address: 'Dwarka Circle, Nashik, Maharashtra',
    lat: 19.9886,
    lng: 73.7981,
    category: 'circle',
  },
  {
    id: 'nsk-mumbai-naka',
    title: 'Mumbai Naka',
    subtitle: 'Old Agra Road / Highway Interchange, Nashik',
    address: 'Mumbai Naka, Nashik, Maharashtra',
    lat: 19.9872,
    lng: 73.7788,
    category: 'circle',
  },
  {
    id: 'nsk-jehan-circle',
    title: 'Jehan Circle',
    subtitle: 'Gangapur Road, Anandwalli Corridor, Nashik',
    address: 'Jehan Circle, Gangapur Road, Nashik, Maharashtra',
    lat: 20.0152,
    lng: 73.7548,
    category: 'circle',
  },
  {
    id: 'nsk-abb-circle',
    title: 'ABB Circle',
    subtitle: 'Mahatma Nagar / Trimbak Road, Nashik',
    address: 'ABB Circle, Mahatma Nagar, Nashik, Maharashtra',
    lat: 19.9892,
    lng: 73.7517,
    category: 'circle',
  },
  {
    id: 'nsk-byk-circle',
    title: 'College Road (BYK Circle)',
    subtitle: 'Vidya Vikas Circle, Thatte Nagar, Nashik',
    address: 'BYK Circle, College Road, Nashik, Maharashtra',
    lat: 19.9989,
    lng: 73.7633,
    category: 'circle',
  },
  {
    id: 'nsk-ashok-stambh',
    title: 'Ashok Stambh',
    subtitle: 'Raviwar Peth / Old City, MG Road, Nashik',
    address: 'Ashok Stambh, Nashik, Maharashtra',
    lat: 20.0019,
    lng: 73.7858,
    category: 'circle',
  },
  {
    id: 'nsk-trimurti-chowk',
    title: 'Trimurti Chowk',
    subtitle: 'Pawan Nagar, CIDCO, Nashik',
    address: 'Trimurti Chowk, CIDCO, Nashik, Maharashtra',
    lat: 19.9678,
    lng: 73.7439,
    category: 'circle',
  },
  {
    id: 'nsk-pathardi-phata',
    title: 'Pathardi Phata',
    subtitle: 'Mumbai-Agra Highway / Ambad Link Road, Nashik',
    address: 'Pathardi Phata, Nashik, Maharashtra',
    lat: 19.9482,
    lng: 73.7543,
    category: 'circle',
  },
  {
    id: 'nsk-canada-corner',
    title: 'Canada Corner',
    subtitle: 'Sharanpur Road & College Road Junction, Nashik',
    address: 'Canada Corner, Sharanpur Road, Nashik, Maharashtra',
    lat: 19.9983,
    lng: 73.7758,
    category: 'circle',
  },
  {
    id: 'nsk-trimbak-naka',
    title: 'Trimbak Naka',
    subtitle: 'Golf Club Ground / District Court, Nashik',
    address: 'Trimbak Naka, Nashik, Maharashtra',
    lat: 19.9922,
    lng: 73.7828,
    category: 'circle',
  },
  {
    id: 'nsk-kthm-circle',
    title: 'KTHM College Circle',
    subtitle: 'Gangapur Road, Shivaji Nagar, Nashik',
    address: 'KTHM College Circle, Gangapur Road, Nashik, Maharashtra',
    lat: 20.0039,
    lng: 73.7744,
    category: 'circle',
  },
  {
    id: 'nsk-bitco-point',
    title: 'Bitco Point (Bytco Circle)',
    subtitle: 'Pune Road, Datta Mandir, Nashik Road',
    address: 'Bytco Point, Nashik Road, Nashik, Maharashtra',
    lat: 19.9547,
    lng: 73.8389,
    category: 'circle',
  },

  // 3. Key Neighborhoods & Residential Corridors
  {
    id: 'nsk-cidco-main',
    title: 'CIDCO (New Nashik)',
    subtitle: 'Trimurti Chowk, Pawan Nagar, Lekha Nagar, Nashik',
    address: 'CIDCO, Nashik, Maharashtra',
    lat: 19.9650,
    lng: 73.7480,
    category: 'area',
  },
  {
    id: 'nsk-cidco-trimurti',
    title: 'Trimurti Chowk, CIDCO',
    subtitle: 'Kamadhenu Nagar, CIDCO, Nashik',
    address: 'Trimurti Chowk, CIDCO, Nashik, Maharashtra',
    lat: 19.9678,
    lng: 73.7461,
    category: 'circle',
  },
  {
    id: 'nsk-cidco-bus-stand',
    title: 'CIDCO Bus Stand',
    subtitle: 'Lekha Nagar, New Nashik',
    address: 'CIDCO Bus Stand, Lekha Nagar, Nashik, Maharashtra',
    lat: 19.9620,
    lng: 73.7540,
    category: 'transit',
  },
  {
    id: 'nsk-cidco-pawan-nagar',
    title: 'Pawan Nagar, CIDCO',
    subtitle: 'Trimurti Chowk to Ambad Link, CIDCO, Nashik',
    address: 'Pawan Nagar, CIDCO, Nashik, Maharashtra',
    lat: 19.9720,
    lng: 73.7430,
    category: 'area',
  },
  {
    id: 'nsk-city-centre-mall',
    title: 'City Centre Mall',
    subtitle: 'Untwadi Road, Lawate Nagar, Nashik',
    address: 'City Centre Mall, Untwadi Road, Nashik, Maharashtra',
    lat: 19.9825,
    lng: 73.7655,
    category: 'mall',
  },
  {
    id: 'nsk-untwadi-sambhaji',
    title: 'Sambhaji Chowk, Untwadi',
    subtitle: 'CIDCO-Untwadi Link Road, Nashik',
    address: 'Sambhaji Chowk, Untwadi Road, Nashik, Maharashtra',
    lat: 19.9750,
    lng: 73.7580,
    category: 'circle',
  },
  {
    id: 'nsk-college-rd',
    title: 'College Road',
    subtitle: 'D\'souza Colony, Model Colony, Thatte Nagar, Nashik',
    address: 'College Road, Nashik, Maharashtra',
    lat: 20.0011,
    lng: 73.7622,
    category: 'area',
  },
  {
    id: 'nsk-gangapur-rd',
    title: 'Gangapur Road',
    subtitle: 'Anandwalli, Someshwar, Navshya Ganpati, Nashik',
    address: 'Gangapur Road, Nashik, Maharashtra',
    lat: 20.0189,
    lng: 73.7467,
    category: 'area',
  },
  {
    id: 'nsk-serene-meadows',
    title: 'Serene Meadows',
    subtitle: 'Off Gangapur Road, Anandwalli, Nashik',
    address: 'Serene Meadows, Gangapur Road, Nashik, Maharashtra',
    lat: 20.0278,
    lng: 73.7389,
    category: 'area',
  },
  {
    id: 'nsk-mahatma-nagar',
    title: 'Mahatma Nagar',
    subtitle: 'Parijat Nagar, Near Water Tank, Nashik',
    address: 'Mahatma Nagar, Nashik, Maharashtra',
    lat: 19.9933,
    lng: 73.7528,
    category: 'area',
  },
  {
    id: 'nsk-cidco',
    title: 'CIDCO (Pawan Nagar & Uttam Nagar)',
    subtitle: 'Untwadi to Trimurti Chowk, Nashik',
    address: 'CIDCO, Nashik, Maharashtra',
    lat: 19.9656,
    lng: 73.7422,
    category: 'area',
  },
  {
    id: 'nsk-indira-nagar',
    title: 'Indira Nagar',
    subtitle: 'Deepali Nagar, Rane Nagar Corridor, Nashik',
    address: 'Indira Nagar, Nashik, Maharashtra',
    lat: 19.9694,
    lng: 73.7739,
    category: 'area',
  },
  {
    id: 'nsk-govind-nagar',
    title: 'Govind Nagar',
    subtitle: 'Near City Centre Mall & Untwadi, Nashik',
    address: 'Govind Nagar, Nashik, Maharashtra',
    lat: 19.9789,
    lng: 73.7656,
    category: 'area',
  },
  {
    id: 'nsk-panchavati',
    title: 'Panchavati',
    subtitle: 'Ramkund, Sita Gumpha, Tapovan, Nashik',
    address: 'Panchavati, Nashik, Maharashtra',
    lat: 20.0089,
    lng: 73.7944,
    category: 'area',
  },
  {
    id: 'nsk-nashik-road',
    title: 'Nashik Road (Town)',
    subtitle: 'Muktidham, Shivaji Nagar, Jail Road, Nashik',
    address: 'Nashik Road, Nashik, Maharashtra',
    lat: 19.9575,
    lng: 73.8443,
    category: 'area',
  },
  {
    id: 'nsk-deolali-camp',
    title: 'Deolali Camp',
    subtitle: 'Lam Road, Temple Hill, Cantonment, Nashik',
    address: 'Deolali Camp, Nashik, Maharashtra',
    lat: 19.9289,
    lng: 73.8317,
    category: 'area',
  },
  {
    id: 'nsk-jail-road',
    title: 'Jail Road',
    subtitle: 'Dasak, Shivaji Nagar, Nashik Road',
    address: 'Jail Road, Nashik Road, Nashik, Maharashtra',
    lat: 19.9689,
    lng: 73.8422,
    category: 'area',
  },
  {
    id: 'nsk-untwadi',
    title: 'Untwadi',
    subtitle: 'Lawate Nagar, Near City Centre Mall, Nashik',
    address: 'Untwadi, Nashik, Maharashtra',
    lat: 19.9811,
    lng: 73.7611,
    category: 'area',
  },
  {
    id: 'nsk-ashoka-marg',
    title: 'Ashoka Marg',
    subtitle: 'Kalpataru Nagar, Wadala Road, Nashik',
    address: 'Ashoka Marg, Nashik, Maharashtra',
    lat: 19.9783,
    lng: 73.8056,
    category: 'area',
  },
  {
    id: 'nsk-rane-nagar',
    title: 'Rane Nagar',
    subtitle: 'Mumbai-Agra Highway, Lekha Nagar, Nashik',
    address: 'Rane Nagar, Nashik, Maharashtra',
    lat: 19.9578,
    lng: 73.7678,
    category: 'area',
  },
  {
    id: 'nsk-makhmalabad',
    title: 'Makhmalabad Road',
    subtitle: 'Panchavati, Makhmalabad Naka, Nashik',
    address: 'Makhmalabad Road, Nashik, Maharashtra',
    lat: 20.0311,
    lng: 73.7844,
    category: 'area',
  },
  {
    id: 'nsk-meri-mhasrul',
    title: 'Dindori Road (MERI Colony & Mhasrul)',
    subtitle: 'Dindori Naka, Mhasrul, Nashik',
    address: 'MERI Colony, Dindori Road, Nashik, Maharashtra',
    lat: 20.0389,
    lng: 73.8056,
    category: 'area',
  },
  {
    id: 'nsk-adgaon',
    title: 'Adgaon Naka',
    subtitle: 'Mumbai-Agra Highway, Medical Hub, Nashik',
    address: 'Adgaon Naka, Nashik, Maharashtra',
    lat: 20.0433,
    lng: 73.8478,
    category: 'area',
  },
  {
    id: 'nsk-sharanpur-rd',
    title: 'Sharanpur Road',
    subtitle: 'Canada Corner to Police Commissioner Office, Nashik',
    address: 'Sharanpur Road, Nashik, Maharashtra',
    lat: 19.9956,
    lng: 73.7722,
    category: 'area',
  },

  // 4. Industrial Zones & Corporate Tech Parks (Major daily commute nodes)
  {
    id: 'nsk-ambad-midc',
    title: 'Ambad MIDC (Garware Point)',
    subtitle: 'Industrial Area, Ambad, Nashik',
    address: 'Garware Point, Ambad MIDC, Nashik, Maharashtra',
    lat: 19.9490,
    lng: 73.7315,
    category: 'tech_park',
  },
  {
    id: 'nsk-mahindra-ambad',
    title: 'Mahindra & Mahindra (Ambad Gate)',
    subtitle: 'Ambad Industrial Area, MIDC, Nashik',
    address: 'Mahindra & Mahindra Gate, Ambad MIDC, Nashik, Maharashtra',
    lat: 19.9456,
    lng: 73.7267,
    category: 'tech_park',
  },
  {
    id: 'nsk-bosch-ambad',
    title: 'Bosch Plant (Ambad MIDC)',
    subtitle: 'Industrial Area, MIDC, Nashik',
    address: 'Bosch Ltd, Ambad MIDC, Nashik, Maharashtra',
    lat: 19.9389,
    lng: 73.7222,
    category: 'tech_park',
  },
  {
    id: 'nsk-xlo-point',
    title: 'XLO Point (Ambad)',
    subtitle: 'Ambad MIDC Industrial Corridor, Nashik',
    address: 'XLO Point, Ambad MIDC, Nashik, Maharashtra',
    lat: 19.9419,
    lng: 73.7289,
    category: 'tech_park',
  },
  {
    id: 'nsk-satpur-midc',
    title: 'Satpur MIDC (ABB India Gate)',
    subtitle: 'Trimbak Road, Satpur Industrial Area, Nashik',
    address: 'ABB India, Satpur MIDC, Nashik, Maharashtra',
    lat: 19.9867,
    lng: 73.7311,
    category: 'tech_park',
  },
  {
    id: 'nsk-satpur-iti',
    title: 'Satpur Colony (ITI Signal)',
    subtitle: 'Trimbak Road, Satpur, Nashik',
    address: 'Satpur Colony, Trimbak Road, Nashik, Maharashtra',
    lat: 19.9822,
    lng: 73.7294,
    category: 'tech_park',
  },
  {
    id: 'nsk-nice-area',
    title: 'NICE Industrial Area',
    subtitle: 'MIDC Satpur, Trimbak Road, Nashik',
    address: 'NICE Area, Satpur MIDC, Nashik, Maharashtra',
    lat: 19.9756,
    lng: 73.7233,
    category: 'tech_park',
  },
  {
    id: 'nsk-sinnar-midc',
    title: 'Sinnar MIDC (Musalgaon)',
    subtitle: 'Nashik-Pune Highway, Sinnar Corridor, Nashik',
    address: 'Sinnar MIDC, Nashik, Maharashtra',
    lat: 19.8511,
    lng: 73.9989,
    category: 'tech_park',
  },

  // 5. Colleges & University Campuses
  {
    id: 'nsk-kkwagh-clg',
    title: 'KK Wagh Institute of Engineering (KKWIEER)',
    subtitle: 'Amrutdham, Panchavati, Nashik',
    address: 'KK Wagh Engineering College, Amrutdham, Nashik, Maharashtra',
    lat: 20.0167,
    lng: 73.8244,
    category: 'college',
  },
  {
    id: 'nsk-kthm-clg',
    title: 'KTHM College Campus',
    subtitle: 'Gangapur Road, Shivaji Nagar, Nashik',
    address: 'KTHM College, Gangapur Road, Nashik, Maharashtra',
    lat: 20.0031,
    lng: 73.7742,
    category: 'college',
  },
  {
    id: 'nsk-byk-clg',
    title: 'BYK College of Commerce & HPT Arts',
    subtitle: 'College Road, Thatte Nagar, Nashik',
    address: 'BYK College, College Road, Nashik, Maharashtra',
    lat: 19.9994,
    lng: 73.7636,
    category: 'college',
  },
  {
    id: 'nsk-met-clg',
    title: 'MET Bhujbal Knowledge City',
    subtitle: 'Adgaon, Mumbai-Agra Highway, Nashik',
    address: 'MET League of Colleges, Adgaon, Nashik, Maharashtra',
    lat: 20.0478,
    lng: 73.8567,
    category: 'college',
  },
  {
    id: 'nsk-ndmvp-medical',
    title: 'NDMVP Medical College & Hospital',
    subtitle: 'Adgaon, Mumbai-Agra Highway, Nashik',
    address: 'NDMVP Medical College, Adgaon, Nashik, Maharashtra',
    lat: 20.0389,
    lng: 73.8389,
    category: 'college',
  },
  {
    id: 'nsk-sandip-uni',
    title: 'Sandip University / Sandip Foundation',
    subtitle: 'Mahiravani, Trimbak Road, Nashik',
    address: 'Sandip University, Trimbak Road, Nashik, Maharashtra',
    lat: 19.9578,
    lng: 73.6622,
    category: 'college',
  },
  {
    id: 'nsk-ggsf-clg',
    title: 'Guru Gobind Singh College of Engineering',
    subtitle: 'Khalsa Way, Pathardi Phata, Nashik',
    address: 'Guru Gobind Singh College, Pathardi Phata, Nashik, Maharashtra',
    lat: 19.9389,
    lng: 73.7633,
    category: 'college',
  },
  {
    id: 'nsk-ges-clg',
    title: 'Gokhale Education Society Campus',
    subtitle: 'College Road, Nashik',
    address: 'Gokhale Education Society, College Road, Nashik, Maharashtra',
    lat: 19.9989,
    lng: 73.7656,
    category: 'college',
  },
  {
    id: 'nsk-matoshri-clg',
    title: 'Matoshri College of Engineering',
    subtitle: 'Eklahare, Near Odha, Nashik',
    address: 'Matoshri College, Eklahare, Nashik, Maharashtra',
    lat: 19.9856,
    lng: 73.8911,
    category: 'college',
  },
  {
    id: 'nsk-siom-clg',
    title: 'SIOM (Symbiosis Institute)',
    subtitle: 'Plot No. 47, CIDCO, Nashik',
    address: 'SIOM, CIDCO, Nashik, Maharashtra',
    lat: 19.9633,
    lng: 73.7456,
    category: 'college',
  },

  // 6. Major Malls, Hospitals & Landmarks
  {
    id: 'nsk-city-centre-mall',
    title: 'Nashik City Centre Mall',
    subtitle: 'Untwadi Road, Lawate Nagar, Govind Nagar, Nashik',
    address: 'City Centre Mall, Untwadi Road, Nashik, Maharashtra',
    lat: 19.9806,
    lng: 73.7619,
    category: 'mall',
  },
  {
    id: 'nsk-pinnacle-mall',
    title: 'Pinnacle Mall',
    subtitle: 'Trimbak Naka, District Court Road, Nashik',
    address: 'Pinnacle Mall, Trimbak Naka, Nashik, Maharashtra',
    lat: 19.9928,
    lng: 73.7817,
    category: 'mall',
  },
  {
    id: 'nsk-sula-vineyards',
    title: 'Sula Vineyards',
    subtitle: 'Govardhan Village, Gangapur Dam Road, Nashik',
    address: 'Sula Vineyards, Gangapur Dam Road, Nashik, Maharashtra',
    lat: 20.0067,
    lng: 73.6889,
    category: 'area',
  },
  {
    id: 'nsk-muktidham',
    title: 'Muktidham Temple',
    subtitle: 'Gayatri Nagar, Nashik Road, Nashik',
    address: 'Muktidham Temple, Nashik Road, Nashik, Maharashtra',
    lat: 19.9528,
    lng: 73.8394,
    category: 'area',
  },
  {
    id: 'nsk-apollo-hospital',
    title: 'Apollo Hospitals',
    subtitle: 'Swaminarayan Nagar, Old Agra Road, Mumbai Naka, Nashik',
    address: 'Apollo Hospitals, Mumbai Naka, Nashik, Maharashtra',
    lat: 19.9856,
    lng: 73.7778,
    category: 'area',
  },
  {
    id: 'nsk-sahyadri-hospital',
    title: 'Sahyadri Super Speciality Hospital',
    subtitle: 'Wadala Naka, Near Dwarka Circle, Nashik',
    address: 'Sahyadri Hospital, Wadala Naka, Nashik, Maharashtra',
    lat: 19.9833,
    lng: 73.7917,
    category: 'area',
  },
  {
    id: 'nsk-medicover-hospital',
    title: 'Ashoka Medicover Hospital',
    subtitle: 'Wadala Road, Indira Nagar, Nashik',
    address: 'Ashoka Medicover Hospital, Indira Nagar, Nashik, Maharashtra',
    lat: 19.9722,
    lng: 73.7889,
    category: 'area',
  },
  {
    id: 'nsk-wockhardt-hospital',
    title: 'Wockhardt Hospital',
    subtitle: 'Wani House, Mumbai Naka, Nashik',
    address: 'Wockhardt Hospital, Mumbai Naka, Nashik, Maharashtra',
    lat: 19.9889,
    lng: 73.7756,
    category: 'area',
  },
  {
    id: 'nsk-golf-club',
    title: 'Golf Club Ground',
    subtitle: 'Trimbak Road, Old Agra Road, Nashik',
    address: 'Golf Club Ground, Nashik, Maharashtra',
    lat: 19.9906,
    lng: 73.7772,
    category: 'area',
  },
  {
    id: 'nsk-ramkund',
    title: 'Ramkund (Godavari Ghat)',
    subtitle: 'Panchavati, Old Nashik Heritage Zone',
    address: 'Ramkund, Panchavati, Nashik, Maharashtra',
    lat: 20.0078,
    lng: 73.7933,
    category: 'area',
  },
  {
    id: 'nsk-someshwar',
    title: 'Someshwar Waterfall & Temple',
    subtitle: 'Gangapur Road, Someshwar, Nashik',
    address: 'Someshwar, Gangapur Road, Nashik, Maharashtra',
    lat: 20.0289,
    lng: 73.7311,
    category: 'area',
  },
];

// Default top popular hubs to show on initial focus (All in Nashik)
export const POPULAR_LOCATIONS: LocationSuggestion[] = [
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-cbs-old')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-rwy-stn')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-byk-circle')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-jehan-circle')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-city-centre-mall')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-ambad-midc')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-dwarka-circle')!,
  NASHIK_LOCATIONS.find((l) => l.id === 'nsk-trimurti-chowk')!,
];

/**
 * Filter local Nashik database instantly with priority prefix scoring
 */
export function searchLocalLocations(query: string): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return POPULAR_LOCATIONS;

  const exactPrefixMatches: LocationSuggestion[] = [];
  const secondaryMatches: LocationSuggestion[] = [];

  for (const loc of NASHIK_LOCATIONS) {
    const title = loc.title.toLowerCase();
    const subtitle = loc.subtitle.toLowerCase();
    const address = loc.address.toLowerCase();

    if (title.startsWith(q)) {
      exactPrefixMatches.push(loc);
    } else if (title.includes(q) || subtitle.includes(q) || address.includes(q)) {
      secondaryMatches.push(loc);
    }
  }

  return [...exactPrefixMatches, ...secondaryMatches].slice(0, 8);
}

/**
 * Real-time geocoding query to OpenStreetMap Nominatim with Nashik geographical bounding box
 * Bounding Box for Nashik: approx minLon: 73.65, minLat: 19.88, maxLon: 73.95, maxLat: 20.12
 */
export async function fetchRemoteLocations(
  query: string,
  signal?: AbortSignal
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    // Append 'Nashik' if not present so remote geocoding always prioritizes Nashik points
    const searchQuery = q.toLowerCase().includes('nashik') ? q : `${q}, Nashik`;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery
    )}&format=json&addressdetails=1&limit=6&countrycodes=in&viewbox=73.65,20.12,73.95,19.88&bounded=0`;

    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const addr = item.address || {};
      const primaryName =
        item.name ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.city ||
        item.display_name.split(',')[0];

      // Formulate secondary subtitle hierarchy
      const secondaryParts = [
        addr.suburb || addr.neighbourhood || addr.road,
        addr.city || 'Nashik',
        addr.state || 'Maharashtra',
      ].filter((p): p is string => Boolean(p) && p !== primaryName);

      const uniqueParts = Array.from(new Set(secondaryParts));
      const subtitle = uniqueParts.slice(0, 3).join(', ') || item.display_name;

      return {
        id: `osm-${item.place_id}`,
        title: primaryName,
        subtitle,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        category: 'area',
      };
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return [];
    return [];
  }
}
