export interface FarmerProfile {
  id: string;
  name: string;
  mobile: string;
  aadhaar?: string;
  language: string; // telugu, hindi, tamil, kannada, marathi, english
  district: string;
  village: string;
  farmSize: number; // in acres
  soilType: string; // Red, Black, Clayey, Sandy, Loamy
  soilPh?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  groundwaterDepth?: number;
  irrigationAvailable: boolean;
  createdAt: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  advisory: string;
}

export interface CropRecommendation {
  cropName: string;
  confidence: number;
  expectedYield: string;
  profitPrediction: string;
  waterRequirement: string;
  fertilizerRequirement: string;
  bestSowingDate: string;
  riskLevel: string;
  riskDescription: string;
  marketDemand: string;
  expectedSellingPrice: string;
}

export interface DiseaseDiagnosis {
  diseaseName: string;
  confidence: number;
  severity: string; // Low, Medium, High, Critical
  cause: string;
  symptoms: string[];
  organicSolution: string;
  chemicalSolution: string;
  preventionTips: string[];
  healthyComparison: string;
}

export interface SMSLogEntry {
  id: string;
  farmerId: string;
  mobile: string;
  message: string;
  type: string; // "Rain Alert" | "Pest Alert" | "Fertilizer Reminder" | "Harvest Advisory"
  sentAt: string;
}

export interface ExpertTicket {
  id: string;
  farmerId: string;
  farmerName: string;
  title: string;
  description: string;
  imageUrl?: string;
  voiceUrl?: string;
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  replies: Array<{
    sender: "farmer" | "expert";
    message: string;
    sentAt: string;
    senderName: string;
  }>;
}

export interface MarketPrice {
  commodity: string;
  market: string;
  currentPrice: number;
  msp: number;
  demandTrend: "High" | "Medium" | "Low";
  priceForecast: Array<{ month: string; price: number }>;
  updatedAt: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  link: string;
  category: "Subsidies" | "Insurance" | "Direct Benefit" | "Loans" | "Seeds & Fertilisers";
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}
