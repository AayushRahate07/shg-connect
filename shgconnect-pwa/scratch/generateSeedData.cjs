const fs = require('fs');
const path = require('path');

const groups = [
  {
    name: "Savitri Mahila Bachat Gat",
    nameRegional: "सावित्री महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0089",
    village: "Shirwal",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 84500,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Khandala",
      gramPanchayat: "Shirwal Prabhag",
      villageOrganization: "Shirwal Gram Sangha",
      clfName: "Khandala Mahila Cluster Federation"
    }
  },
  {
    name: "Jijau Mahila Bachat Gat",
    nameRegional: "जिजाऊ महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0090",
    village: "Lonand",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 62000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Khandala",
      gramPanchayat: "Lonand Rural",
      villageOrganization: "Lonand Gram Sangha",
      clfName: "Khandala Mahila Cluster Federation"
    }
  },
  {
    name: "Muktai Mahila Bachat Gat",
    nameRegional: "मुक्ताई महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0091",
    village: "Bhuinj",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 48000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Wai",
      gramPanchayat: "Bhuinj Prabhag",
      villageOrganization: "Bhuinj Gram Sangha",
      clfName: "Wai Taluka Mahila Federation"
    }
  },
  {
    name: "Ahilyabai Holkar Mahila Bachat Gat",
    nameRegional: "अहिल्याबाई होळकर महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0092",
    village: "Pachwad",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 55000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Wai",
      gramPanchayat: "Pachwad Prabhag",
      villageOrganization: "Pachwad Gram Sangha",
      clfName: "Wai Taluka Mahila Federation"
    }
  },
  {
    name: "Anandibai Joshi Mahila Bachat Gat",
    nameRegional: "आनंदीबाई जोशी महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0093",
    village: "Khandala Khurd",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 71000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Khandala",
      gramPanchayat: "Khandala Prabhag",
      villageOrganization: "Khandala Gram Sangha",
      clfName: "Khandala Mahila Cluster Federation"
    }
  },
  {
    name: "Krantijyoti Savitribai Gat",
    nameRegional: "क्रांतिज्योती महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0094",
    village: "Wathar",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 64000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Koregaon",
      gramPanchayat: "Wathar Station",
      villageOrganization: "Wathar Gram Sangha",
      clfName: "Koregaon Taluka Mahila Federation"
    }
  },
  {
    name: "Yashaswini Mahila Bachat Gat",
    nameRegional: "यशस्विनी महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0095",
    village: "Pargaon",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 52000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Khandala",
      gramPanchayat: "Pargaon Rural",
      villageOrganization: "Pargaon Gram Sangha",
      clfName: "Khandala Mahila Cluster Federation"
    }
  }
];

const avatarColors = [
  "bg-amber-500", "bg-emerald-600", "bg-blue-600", "bg-purple-600", "bg-rose-600",
  "bg-[#14532D]", "bg-indigo-600", "bg-teal-600", "bg-cyan-600", "bg-fuchsia-600"
];

// 7 SHGs * 10 members = 70 members
const members = [
  // ── SHG 1: Savitri Mahila Bachat Gat (SHG-MH-SAT-2024-0089) ──
  { id: "mem-1", shgId: "SHG-MH-SAT-2024-0089", name: "Kamal-tai Patil", nameRegional: "कमलताई पाटील", phone: "8767993248", role: "OFFICE_BEARER", occupation: "Dairy Farming", totalSavings: 18500, activeLoanBalance: 0, trustScore: 98, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-2", shgId: "SHG-MH-SAT-2024-0089", name: "Sunita-bai Deshmukh", nameRegional: "सुनिताबाई देशमुख", phone: "9422033445", role: "OFFICE_BEARER", occupation: "Tailoring & Textile", totalSavings: 21000, activeLoanBalance: 12000, trustScore: 96, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-3", shgId: "SHG-MH-SAT-2024-0089", name: "Anita-tai Shinde", nameRegional: "अनिताताई शिंदे", phone: "9765088990", role: "OFFICE_BEARER", occupation: "Retail Grocery", totalSavings: 14500, activeLoanBalance: 5000, trustScore: 94, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-4", shgId: "SHG-MH-SAT-2024-0089", name: "Meena-bai Jadhav", nameRegional: "मीनाबाई जाधव", phone: "9890122334", role: "MEMBER", occupation: "Goat Farming", totalSavings: 16000, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-5", shgId: "SHG-MH-SAT-2024-0089", name: "Rukmini-tai Kulkarni", nameRegional: "रुक्मिणीताई कुलकर्णी", phone: "9158044556", role: "MEMBER", occupation: "Papad & Pickle Unit", totalSavings: 14500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-6", shgId: "SHG-MH-SAT-2024-0089", name: "Asha-tai Pawar", nameRegional: "आशाताई पवार", phone: "9822155667", role: "MEMBER", occupation: "Organic Farming", totalSavings: 12000, activeLoanBalance: 8000, trustScore: 93, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-7", shgId: "SHG-MH-SAT-2024-0089", name: "Sangeeta-bai Chavan", nameRegional: "संगीताबाई चव्हाण", phone: "9423988776", role: "MEMBER", occupation: "Flour Mill", totalSavings: 15500, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-8", shgId: "SHG-MH-SAT-2024-0089", name: "Lata-bai More", nameRegional: "लताबाई मोरे", phone: "9850123456", role: "MEMBER", occupation: "Poultry Farming", totalSavings: 13000, activeLoanBalance: 6000, trustScore: 89, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-9", shgId: "SHG-MH-SAT-2024-0089", name: "Shobha-tai Bhosale", nameRegional: "शोभाताई भोसले", phone: "9822334455", role: "MEMBER", occupation: "Vegetable Vendor", totalSavings: 11500, activeLoanBalance: 14000, trustScore: 88, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-10", shgId: "SHG-MH-SAT-2024-0089", name: "Ujjwala-bai Gaikwad", nameRegional: "उज्ज्वलाबाई गायकवाड", phone: "9867012345", role: "MEMBER", occupation: "Dairy Farming", totalSavings: 17000, activeLoanBalance: 0, trustScore: 95, avatarColor: "bg-fuchsia-600", entityVersion: 1 },

  // ── SHG 2: Jijau Mahila Bachat Gat (SHG-MH-SAT-2024-0090) ──
  { id: "mem-201", shgId: "SHG-MH-SAT-2024-0090", name: "Radhabai Jagtap", nameRegional: "राधाबाई जगताप", phone: "9822110001", role: "OFFICE_BEARER", occupation: "Vegetable Wholesale", totalSavings: 16500, activeLoanBalance: 8000, trustScore: 94, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-202", shgId: "SHG-MH-SAT-2024-0090", name: "Savitri Khopade", nameRegional: "सावित्री खोपडे", phone: "9822110002", role: "OFFICE_BEARER", occupation: "Dairy Collection", totalSavings: 19000, activeLoanBalance: 0, trustScore: 95, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-203", shgId: "SHG-MH-SAT-2024-0090", name: "Indubai Salunkhe", nameRegional: "इंदूबाई साळुंखे", phone: "9822110003", role: "OFFICE_BEARER", occupation: "Tailoring", totalSavings: 15000, activeLoanBalance: 6000, trustScore: 91, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-204", shgId: "SHG-MH-SAT-2024-0090", name: "Laxmi Thorat", nameRegional: "लक्ष्मी थोरात", phone: "9822110004", role: "MEMBER", occupation: "Goat Rearing", totalSavings: 12500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-205", shgId: "SHG-MH-SAT-2024-0090", name: "Chhaya Mane", nameRegional: "छाया माने", phone: "9822110005", role: "MEMBER", occupation: "General Store", totalSavings: 14000, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-206", shgId: "SHG-MH-SAT-2024-0090", name: "Shobha Nikam", nameRegional: "शोभा निकम", phone: "9822110006", role: "MEMBER", occupation: "Spices & Masala", totalSavings: 11000, activeLoanBalance: 5000, trustScore: 88, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-207", shgId: "SHG-MH-SAT-2024-0090", name: "Vimal Ghorpade", nameRegional: "विमल घोरपडे", phone: "9822110007", role: "MEMBER", occupation: "Flour Mill", totalSavings: 13500, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-208", shgId: "SHG-MH-SAT-2024-0090", name: "Mangal Bhosale", nameRegional: "मंगल भोसले", phone: "9822110008", role: "MEMBER", occupation: "Nursery Plants", totalSavings: 10500, activeLoanBalance: 0, trustScore: 87, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-209", shgId: "SHG-MH-SAT-2024-0090", name: "Tarabai Kadam", nameRegional: "ताराबाई कदम", phone: "9822110009", role: "MEMBER", occupation: "Poultry Farming", totalSavings: 15500, activeLoanBalance: 0, trustScore: 93, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-210", shgId: "SHG-MH-SAT-2024-0090", name: "Kalpana Shinde", nameRegional: "कल्पना शिंदे", phone: "9822110010", role: "MEMBER", occupation: "Dairy Farming", totalSavings: 12000, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-fuchsia-600", entityVersion: 1 },

  // ── SHG 3: Muktai Mahila Bachat Gat (SHG-MH-SAT-2024-0091) ──
  { id: "mem-301", shgId: "SHG-MH-SAT-2024-0091", name: "Parvati Pisal", nameRegional: "पार्वती पिसाळ", phone: "9822220001", role: "OFFICE_BEARER", occupation: "Strawberry Farming", totalSavings: 17000, activeLoanBalance: 10000, trustScore: 92, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-302", shgId: "SHG-MH-SAT-2024-0091", name: "Anandi Chikane", nameRegional: "आनंदी चिकणे", phone: "9822220002", role: "OFFICE_BEARER", occupation: "Food Processing", totalSavings: 15500, activeLoanBalance: 0, trustScore: 94, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-303", shgId: "SHG-MH-SAT-2024-0091", name: "Kausalya Nalawade", nameRegional: "कौशल्या नलवडे", phone: "9822220003", role: "OFFICE_BEARER", occupation: "Dairy Production", totalSavings: 14000, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-304", shgId: "SHG-MH-SAT-2024-0091", name: "Shakuntala Barge", nameRegional: "शकुंतला बर्गे", phone: "9822220004", role: "MEMBER", occupation: "Tailoring", totalSavings: 11500, activeLoanBalance: 4000, trustScore: 88, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-305", shgId: "SHG-MH-SAT-2024-0091", name: "Usha Babar", nameRegional: "उषा बाबर", phone: "9822220005", role: "MEMBER", occupation: "Organic Vegetables", totalSavings: 13000, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-306", shgId: "SHG-MH-SAT-2024-0091", name: "Sunanda Sanas", nameRegional: "सुनंदा सणस", phone: "9822220006", role: "MEMBER", occupation: "Handicraft Bags", totalSavings: 9500, activeLoanBalance: 0, trustScore: 86, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-307", shgId: "SHG-MH-SAT-2024-0091", name: "Pushpa Shinde", nameRegional: "पुष्पा शिंदे", phone: "9822220007", role: "MEMBER", occupation: "Goat Farming", totalSavings: 12000, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-308", shgId: "SHG-MH-SAT-2024-0091", name: "Suvarna Pol", nameRegional: "सुवर्णा पोळ", phone: "9822220008", role: "MEMBER", occupation: "Poultry Unit", totalSavings: 10000, activeLoanBalance: 0, trustScore: 87, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-309", shgId: "SHG-MH-SAT-2024-0091", name: "Shanta More", nameRegional: "शांता मोरे", phone: "9822220009", role: "MEMBER", occupation: "Bangles & Stitching", totalSavings: 14500, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-310", shgId: "SHG-MH-SAT-2024-0091", name: "Manisha Jadhav", nameRegional: "मनीषा जाधव", phone: "9822220010", role: "MEMBER", occupation: "Dairy Farming", totalSavings: 16000, activeLoanBalance: 0, trustScore: 93, avatarColor: "bg-fuchsia-600", entityVersion: 1 },

  // ── SHG 4: Ahilyabai Holkar Mahila Bachat Gat (SHG-MH-SAT-2024-0092) ──
  { id: "mem-401", shgId: "SHG-MH-SAT-2024-0092", name: "Mandakini Kadam", nameRegional: "मंदाकिनी कदम", phone: "9822330001", role: "OFFICE_BEARER", occupation: "Dairy Farming", totalSavings: 18000, activeLoanBalance: 0, trustScore: 95, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-402", shgId: "SHG-MH-SAT-2024-0092", name: "Rohini Phadtare", nameRegional: "रोहिणी फडतरे", phone: "9822330002", role: "OFFICE_BEARER", occupation: "Agrotourism Unit", totalSavings: 16000, activeLoanBalance: 7000, trustScore: 93, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-403", shgId: "SHG-MH-SAT-2024-0092", name: "Vaishali Jagtap", nameRegional: "वैशाली जगताप", phone: "9822330003", role: "OFFICE_BEARER", occupation: "Retail Clothes", totalSavings: 14500, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-404", shgId: "SHG-MH-SAT-2024-0092", name: "Jayashree Patil", nameRegional: "जयश्री पाटील", phone: "9822330004", role: "MEMBER", occupation: "Food Mess / Tiffin", totalSavings: 13000, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-405", shgId: "SHG-MH-SAT-2024-0092", name: "Alka Waghmare", nameRegional: "अलका वाघमारे", phone: "9822330005", role: "MEMBER", occupation: "Vegetable Cultivation", totalSavings: 11500, activeLoanBalance: 5000, trustScore: 89, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-406", shgId: "SHG-MH-SAT-2024-0092", name: "Deepali Chavan", nameRegional: "दीपाली चव्हाण", phone: "9822330006", role: "MEMBER", occupation: "Papad & Khakhra", totalSavings: 10500, activeLoanBalance: 0, trustScore: 87, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-407", shgId: "SHG-MH-SAT-2024-0092", name: "Sarita Shinde", nameRegional: "सरिता शिंदे", phone: "9822330007", role: "MEMBER", occupation: "Goat Rearing", totalSavings: 12500, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-408", shgId: "SHG-MH-SAT-2024-0092", name: "Anuradha Mohite", nameRegional: "अनुराधा मोहिते", phone: "9822330008", role: "MEMBER", occupation: "Poultry Farm", totalSavings: 14000, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-409", shgId: "SHG-MH-SAT-2024-0092", name: "Pratibha Pawar", nameRegional: "प्रतिभा पवार", phone: "9822330009", role: "MEMBER", occupation: "Tailoring", totalSavings: 9000, activeLoanBalance: 0, trustScore: 86, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-410", shgId: "SHG-MH-SAT-2024-0092", name: "Kavita Salunkhe", nameRegional: "कविता साळुंखे", phone: "9822330010", role: "MEMBER", occupation: "Dairy Animals", totalSavings: 15000, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-fuchsia-600", entityVersion: 1 },

  // ── SHG 5: Anandibai Joshi Mahila Bachat Gat (SHG-MH-SAT-2024-0093) ──
  { id: "mem-501", shgId: "SHG-MH-SAT-2024-0093", name: "Surekha Dhaygude", nameRegional: "सुरेखा धायगुडे", phone: "9822440001", role: "OFFICE_BEARER", occupation: "Flour Mill & Masala", totalSavings: 20000, activeLoanBalance: 10000, trustScore: 96, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-502", shgId: "SHG-MH-SAT-2024-0093", name: "Ashwini Ghadge", nameRegional: "अश्विनी घाडगे", phone: "9822440002", role: "OFFICE_BEARER", occupation: "Beauty Parlour & Stitching", totalSavings: 17500, activeLoanBalance: 0, trustScore: 94, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-503", shgId: "SHG-MH-SAT-2024-0093", name: "Manjusha Raut", nameRegional: "मंजूषा राऊत", phone: "9822440003", role: "OFFICE_BEARER", occupation: "Dairy Products", totalSavings: 16000, activeLoanBalance: 0, trustScore: 93, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-504", shgId: "SHG-MH-SAT-2024-0093", name: "Varsha Yadav", nameRegional: "वर्षा यादव", phone: "9822440004", role: "MEMBER", occupation: "Organic Jaggery", totalSavings: 14000, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-505", shgId: "SHG-MH-SAT-2024-0093", name: "Anita Shedge", nameRegional: "अनिता शेडगे", phone: "9822440005", role: "MEMBER", occupation: "Stationery Store", totalSavings: 12500, activeLoanBalance: 6000, trustScore: 89, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-506", shgId: "SHG-MH-SAT-2024-0093", name: "Maya Sawant", nameRegional: "माया सावंत", phone: "9822440006", role: "MEMBER", occupation: "Vegetable Farm", totalSavings: 11000, activeLoanBalance: 0, trustScore: 88, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-507", shgId: "SHG-MH-SAT-2024-0093", name: "Pallavi Deshmukh", nameRegional: "पल्लवी देशमुख", phone: "9822440007", role: "MEMBER", occupation: "Goat Farming", totalSavings: 13500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-508", shgId: "SHG-MH-SAT-2024-0093", name: "Seema Gaikwad", nameRegional: "सीमा गायकवाड", phone: "9822440008", role: "MEMBER", occupation: "Poultry Unit", totalSavings: 10000, activeLoanBalance: 0, trustScore: 87, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-509", shgId: "SHG-MH-SAT-2024-0093", name: "Ranjana More", nameRegional: "रंजना मोरे", phone: "9822440009", role: "MEMBER", occupation: "Papad Unit", totalSavings: 15000, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-510", shgId: "SHG-MH-SAT-2024-0093", name: "Rupali Malusare", nameRegional: "रूपाली मालुसरे", phone: "9822440010", role: "MEMBER", occupation: "Dairy Farming", totalSavings: 18000, activeLoanBalance: 0, trustScore: 95, avatarColor: "bg-fuchsia-600", entityVersion: 1 },

  // ── SHG 6: Krantijyoti Savitribai Gat (SHG-MH-SAT-2024-0094) ──
  { id: "mem-601", shgId: "SHG-MH-SAT-2024-0094", name: "Housabai Shinde", nameRegional: "हौसाबाई शिंदे", phone: "9822550001", role: "OFFICE_BEARER", occupation: "Dairy Unit", totalSavings: 19000, activeLoanBalance: 0, trustScore: 95, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-602", shgId: "SHG-MH-SAT-2024-0094", name: "Sindhu Sapkal", nameRegional: "सिंधू सपकाळ", phone: "9822550002", role: "OFFICE_BEARER", occupation: "Garment Making", totalSavings: 16500, activeLoanBalance: 8000, trustScore: 93, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-603", shgId: "SHG-MH-SAT-2024-0094", name: "Bhagirathi Gore", nameRegional: "भागीरथी गोरे", phone: "9822550003", role: "OFFICE_BEARER", occupation: "Spice Mill", totalSavings: 15000, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-604", shgId: "SHG-MH-SAT-2024-0094", name: "Sulochana Mane", nameRegional: "सुलोचना माने", phone: "9822550004", role: "MEMBER", occupation: "Retail Kirana", totalSavings: 13500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-605", shgId: "SHG-MH-SAT-2024-0094", name: "Yamuna Kadam", nameRegional: "यमुना कदम", phone: "9822550005", role: "MEMBER", occupation: "Organic Farming", totalSavings: 12000, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-606", shgId: "SHG-MH-SAT-2024-0094", name: "Dagadubai Salve", nameRegional: "दगडूबाई साळवे", phone: "9822550006", role: "MEMBER", occupation: "Goat Rearing", totalSavings: 10500, activeLoanBalance: 4000, trustScore: 87, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-607", shgId: "SHG-MH-SAT-2024-0094", name: "Godavari Kamble", nameRegional: "गोदावरी कांबळे", phone: "9822550007", role: "MEMBER", occupation: "Handicraft", totalSavings: 11000, activeLoanBalance: 0, trustScore: 88, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-608", shgId: "SHG-MH-SAT-2024-0094", name: "Gangubai Kharat", nameRegional: "गंगूबाई खरात", phone: "9822550008", role: "MEMBER", occupation: "Poultry Farming", totalSavings: 14000, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-609", shgId: "SHG-MH-SAT-2024-0094", name: "Hirabai Lokhande", nameRegional: "हिराबाई लोखंडे", phone: "9822550009", role: "MEMBER", occupation: "Flour Mill", totalSavings: 12500, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-610", shgId: "SHG-MH-SAT-2024-0094", name: "Sitabai Gaikwad", nameRegional: "सीताबाई गायकवाड", phone: "9822550010", role: "MEMBER", occupation: "Dairy Farming", totalSavings: 17500, activeLoanBalance: 0, trustScore: 94, avatarColor: "bg-fuchsia-600", entityVersion: 1 },

  // ── SHG 7: Yashaswini Mahila Bachat Gat (SHG-MH-SAT-2024-0095) ──
  { id: "mem-701", shgId: "SHG-MH-SAT-2024-0095", name: "Kalawati Jadhav", nameRegional: "कलावती जाधव", phone: "9822660001", role: "OFFICE_BEARER", occupation: "Dairy Unit", totalSavings: 17500, activeLoanBalance: 9000, trustScore: 93, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-702", shgId: "SHG-MH-SAT-2024-0095", name: "Pramila Pisal", nameRegional: "प्रमिला पिसाळ", phone: "9822660002", role: "OFFICE_BEARER", occupation: "Organic Vegetables", totalSavings: 16000, activeLoanBalance: 0, trustScore: 94, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-703", shgId: "SHG-MH-SAT-2024-0095", name: "Sarubai Jagtap", nameRegional: "सारुबाई जगताप", phone: "9822660003", role: "OFFICE_BEARER", occupation: "Tailoring Shop", totalSavings: 14000, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-704", shgId: "SHG-MH-SAT-2024-0095", name: "Chandrabhaga More", nameRegional: "चंद्रभागा मोरे", phone: "9822660004", role: "MEMBER", occupation: "Dairy Collection", totalSavings: 12000, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-705", shgId: "SHG-MH-SAT-2024-0095", name: "Anusaya Pawar", nameRegional: "अनुसया पवार", phone: "9822660005", role: "MEMBER", occupation: "General Store", totalSavings: 13500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-706", shgId: "SHG-MH-SAT-2024-0095", name: "Janabai Nikam", nameRegional: "जनाबाई निकम", phone: "9822660006", role: "MEMBER", occupation: "Goat Farming", totalSavings: 10000, activeLoanBalance: 5000, trustScore: 87, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-707", shgId: "SHG-MH-SAT-2024-0095", name: "Mathura Shinde", nameRegional: "मथुरा शिंदे", phone: "9822660007", role: "MEMBER", occupation: "Flour Mill", totalSavings: 11500, activeLoanBalance: 0, trustScore: 88, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-708", shgId: "SHG-MH-SAT-2024-0095", name: "Sundarabai Kadam", nameRegional: "सुंदराबाई कदम", phone: "9822660008", role: "MEMBER", occupation: "Spices & Pickles", totalSavings: 12500, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-709", shgId: "SHG-MH-SAT-2024-0095", name: "Bayadabai Salunkhe", nameRegional: "बायडाबाई साळुंखे", phone: "9822660009", role: "MEMBER", occupation: "Poultry Unit", totalSavings: 10500, activeLoanBalance: 0, trustScore: 87, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-710", shgId: "SHG-MH-SAT-2024-0095", name: "Sakubai Chavan", nameRegional: "सकूबाई चव्हाण", phone: "9822660010", role: "MEMBER", occupation: "Dairy Animals", totalSavings: 15000, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-fuchsia-600", entityVersion: 1 }
];

const loans = [
  // Loans for SHG 1
  { id: "loan-101", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-2", memberName: "Sunita-bai Deshmukh", principal: 20000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 8000, remainingBalance: 12000, status: 'ACTIVE', dateDisbursed: "2024-05-15", entityVersion: 1 },
  { id: "loan-102", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-3", memberName: "Anita-tai Shinde", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 6, totalPaid: 5000, remainingBalance: 5000, status: 'ACTIVE', dateDisbursed: "2024-06-10", entityVersion: 1 },
  { id: "loan-103", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-6", memberName: "Asha-tai Pawar", principal: 15000, interestRateMonthly: 1.5, tenureMonths: 12, totalPaid: 7000, remainingBalance: 8000, status: 'ACTIVE', dateDisbursed: "2024-04-01", entityVersion: 1 },
  { id: "loan-104", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-8", memberName: "Lata-bai More", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 4000, remainingBalance: 6000, status: 'ACTIVE', dateDisbursed: "2024-07-20", entityVersion: 1 },
  { id: "loan-105", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-9", memberName: "Shobha-tai Bhosale", principal: 20000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 6000, remainingBalance: 14000, status: 'ACTIVE', dateDisbursed: "2024-08-05", entityVersion: 1 },
  // Loans for SHG 2
  { id: "loan-201", shgId: "SHG-MH-SAT-2024-0090", memberId: "mem-201", memberName: "Radhabai Jagtap", principal: 15000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 7000, remainingBalance: 8000, status: 'ACTIVE', dateDisbursed: "2024-05-10", entityVersion: 1 },
  { id: "loan-202", shgId: "SHG-MH-SAT-2024-0090", memberId: "mem-203", memberName: "Indubai Salunkhe", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 8, totalPaid: 4000, remainingBalance: 6000, status: 'ACTIVE', dateDisbursed: "2024-06-15", entityVersion: 1 },
  // Loans for SHG 3
  { id: "loan-301", shgId: "SHG-MH-SAT-2024-0091", memberId: "mem-301", memberName: "Parvati Pisal", principal: 18000, interestRateMonthly: 1.5, tenureMonths: 12, totalPaid: 8000, remainingBalance: 10000, status: 'ACTIVE', dateDisbursed: "2024-04-12", entityVersion: 1 },
  // Loans for SHG 4
  { id: "loan-401", shgId: "SHG-MH-SAT-2024-0092", memberId: "mem-402", memberName: "Rohini Phadtare", principal: 12000, interestRateMonthly: 1.5, tenureMonths: 8, totalPaid: 5000, remainingBalance: 7000, status: 'ACTIVE', dateDisbursed: "2024-06-20", entityVersion: 1 },
  // Loans for SHG 5
  { id: "loan-501", shgId: "SHG-MH-SAT-2024-0093", memberId: "mem-501", memberName: "Surekha Dhaygude", principal: 20000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 10000, remainingBalance: 10000, status: 'ACTIVE', dateDisbursed: "2024-05-18", entityVersion: 1 },
  // Loans for SHG 6
  { id: "loan-601", shgId: "SHG-MH-SAT-2024-0094", memberId: "mem-602", memberName: "Sindhu Sapkal", principal: 15000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 7000, remainingBalance: 8000, status: 'ACTIVE', dateDisbursed: "2024-05-01", entityVersion: 1 },
  // Loans for SHG 7
  { id: "loan-701", shgId: "SHG-MH-SAT-2024-0095", memberId: "mem-701", memberName: "Kalawati Jadhav", principal: 16000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 7000, remainingBalance: 9000, status: 'ACTIVE', dateDisbursed: "2024-06-01", entityVersion: 1 }
];

const meetings = [
  { id: "meet-12", shgId: "SHG-MH-SAT-2024-0089", date: "2026-09-18", meetingNumber: 12, totalSavingsCollected: 5000, totalEmiCollected: 7200, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true }, checkpointFingerprint: "CHK-8F2A-99B1-4C10" },
  { id: "meet-11", shgId: "SHG-MH-SAT-2024-0089", date: "2026-08-18", meetingNumber: 11, totalSavingsCollected: 5000, totalEmiCollected: 7200, totalDisbursed: 20000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true }, checkpointFingerprint: "CHK-7D1E-03A8-912F" },
  { id: "meet-10", shgId: "SHG-MH-SAT-2024-0089", date: "2026-07-18", meetingNumber: 10, totalSavingsCollected: 5000, totalEmiCollected: 6500, totalDisbursed: 10000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true }, checkpointFingerprint: "CHK-4B8C-7E1A-22DF" },
  { id: "meet-9", shgId: "SHG-MH-SAT-2024-0089", date: "2026-06-18", meetingNumber: 9, totalSavingsCollected: 5000, totalEmiCollected: 6000, totalDisbursed: 10000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true }, checkpointFingerprint: "CHK-1E99-4A3C-80EF" }
];

const denominations = [
  { denomination: 500, count: 12, total: 6000 },
  { denomination: 200, count: 25, total: 5000 },
  { denomination: 100, count: 48, total: 4800 },
  { denomination: 50, count: 22, total: 1100 },
  { denomination: 20, count: 35, total: 700 },
  { denomination: 10, count: 50, total: 500 }
];

const fileContent = `import { Member, Loan, Meeting, GroupInfo } from '../types/shg';

export const DEMO_GROUP_INFO: GroupInfo = ${JSON.stringify(groups[0], null, 2)};

export const DEMO_ASSIGNED_GROUPS: GroupInfo[] = ${JSON.stringify(groups, null, 2)};

export const DEMO_CASH_BOX_DENOMINATIONS = ${JSON.stringify(denominations, null, 2)};

export const DEMO_MEMBERS: Member[] = ${JSON.stringify(members, null, 2)};

export const DEMO_LOANS: Loan[] = ${JSON.stringify(loans, null, 2)};

export const DEMO_MEETINGS: Meeting[] = ${JSON.stringify(meetings, null, 2)};
`;

const targetPath = path.resolve(__dirname, '../src/services/demoData.ts');
fs.writeFileSync(targetPath, fileContent, 'utf-8');
console.log('Successfully generated demoData.ts with:');
console.log('Groups:', groups.length);
console.log('Total members:', members.length);
groups.forEach(g => {
  const count = members.filter(m => m.shgId === g.shgCode).length;
  console.log('  - ' + g.name + ' (' + g.shgCode + '): ' + count + ' members');
});
