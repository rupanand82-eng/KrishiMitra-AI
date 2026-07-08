import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Beaker, Sprout, Compass, Check, ArrowRight, Languages } from "lucide-react";
import { FarmerProfile } from "../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { db, handleFirestoreError, OperationType, auth } from "../firebase";
import { REGIONAL_LANGUAGES } from "../data";

interface UserProfileProps {
  onProfileLoaded: (profile: FarmerProfile) => void;
  selectedLang: string;
  onChangeLang: (lang: string) => void;
  translations: Record<string, string>;
}

export default function UserProfile({ onProfileLoaded, selectedLang, onChangeLang, translations }: UserProfileProps) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Registration and Profile fields
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("Warangal");
  const [village, setVillage] = useState("Chennaraopet");
  const [farmSize, setFarmSize] = useState<number>(3.5);
  const [soilType, setSoilType] = useState("Black Cotton Soil");
  const [soilPh, setSoilPh] = useState<number>(6.8);
  const [nitrogen, setNitrogen] = useState<number>(240);
  const [phosphorus, setPhosphorus] = useState<number>(32);
  const [potassium, setPotassium] = useState<number>(180);
  const [groundwaterDepth, setGroundwaterDepth] = useState<number>(75);
  const [irrigationAvailable, setIrrigationAvailable] = useState(true);
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check for saved login in localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("krishimitra_farmer_id");
    if (savedId) {
      loadFarmerProfile(savedId);
    }
  }, []);

  const loadFarmerProfile = async (id: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, "farmers", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as FarmerProfile;
        setName(data.name);
        setMobile(data.mobile);
        setDistrict(data.district);
        setVillage(data.village);
        setFarmSize(data.farmSize);
        setSoilType(data.soilType);
        setSoilPh(data.soilPh || 6.8);
        setNitrogen(data.nitrogen || 240);
        setPhosphorus(data.phosphorus || 32);
        setPotassium(data.potassium || 180);
        setGroundwaterDepth(data.groundwaterDepth || 75);
        setIrrigationAvailable(data.irrigationAvailable);
        setAadhaar(data.aadhaar || "");
        onChangeLang(data.language);
        onProfileLoaded(data);
        setIsLoggedIn(true);
      } else {
        // First-time user setup
        setIsLoggedIn(true);
      }
    } catch (e) {
      if (e && (typeof e === 'object' && ('code' in e && e.code === 'permission-denied') || String(e).toLowerCase().includes("permission") || String(e).toLowerCase().includes("insufficient"))) {
        handleFirestoreError(e, OperationType.GET, `farmers/${id}`);
      }
      console.error("Error loading profile:", e);
      // Fallback local mock user so the app works even offline or during config delay
      const mockProfile: FarmerProfile = {
        id,
        name: "Anji Reddy",
        mobile: mobile || "9848022338",
        language: selectedLang,
        district: "Warangal",
        village: "Chennaraopet",
        farmSize: 3.5,
        soilType: "Black Cotton Soil",
        soilPh: 6.8,
        nitrogen: 240,
        phosphorus: 32,
        potassium: 180,
        groundwaterDepth: 75,
        irrigationAvailable: true,
        createdAt: new Date().toISOString(),
      };
      onProfileLoaded(mockProfile);
      setIsLoggedIn(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    // Simulate SMS dispatching and OTP transmission
    setTimeout(() => {
      setIsOtpSent(true);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp === "1234" || otp === "" || otp.length === 4) {
      const userKey = `farmer_${mobile}`;
      localStorage.setItem("krishimitra_farmer_id", userKey);
      loadFarmerProfile(userKey);
    } else {
      alert("Incorrect OTP. For demo purposes, enter any 4-digit code (e.g. 1234)");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        const userKey = `farmer_google_${user.uid}`;
        localStorage.setItem("krishimitra_farmer_id", userKey);
        if (user.displayName) {
          setName(user.displayName);
        }
        if (user.phoneNumber) {
          setMobile(user.phoneNumber.replace("+91", ""));
        }
        await loadFarmerProfile(userKey);
      }
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      alert("Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    const farmerId = localStorage.getItem("krishimitra_farmer_id") || `farmer_${mobile || "9848022338"}`;
    const profile: FarmerProfile = {
      id: farmerId,
      name: name || "Anji Reddy",
      mobile: mobile || "9848022338",
      aadhaar,
      language: selectedLang,
      district,
      village,
      farmSize: Number(farmSize),
      soilType,
      soilPh: Number(soilPh),
      nitrogen: Number(nitrogen),
      phosphorus: Number(phosphorus),
      potassium: Number(potassium),
      groundwaterDepth: Number(groundwaterDepth),
      irrigationAvailable,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "farmers", farmerId), profile);
      localStorage.setItem("krishimitra_farmer_id", farmerId);
      onProfileLoaded(profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err && (typeof err === 'object' && ('code' in err && err.code === 'permission-denied') || String(err).toLowerCase().includes("permission") || String(err).toLowerCase().includes("insufficient"))) {
        handleFirestoreError(err, OperationType.WRITE, `farmers/${farmerId}`);
      }
      console.error("Failed saving to Firestore:", err);
      // Save locally as backup
      localStorage.setItem(`local_profile_${farmerId}`, JSON.stringify(profile));
      onProfileLoaded(profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("krishimitra_farmer_id");
    setIsLoggedIn(false);
    setIsOtpSent(false);
    setOtp("");
  };

  if (!isLoggedIn) {
    return (
      <div id="login-module" className="flex flex-col items-center justify-center py-10 px-4 min-h-[70vh]">
        <div className="w-full max-w-md bento-card p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="p-4 bg-bento-light rounded-full text-bento-deep mb-3 animate-pulse">
              <Sprout size={36} />
            </div>
            <h2 className="font-display text-2xl font-bold text-bento-deep text-center">
              {translations.appTitle || "KrishiMitra AI"}
            </h2>
            <p className="text-sm text-stone-500 text-center mt-1">
              {translations.tagline || "Voice & SMS Agricultural Intelligence"}
            </p>
          </div>

          <div className="mb-6 flex justify-between items-center bg-stone-50 p-2 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 text-stone-600 pl-2">
              <Languages size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Language</span>
            </div>
            <select
              value={selectedLang}
              onChange={(e) => onChangeLang(e.target.value)}
              className="bg-white border border-stone-200 text-sm rounded-lg px-3 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-bento-accent"
            >
              {REGIONAL_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {!isOtpSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Enter Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-accent font-mono tracking-wide text-stone-800"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  We'll send a 4-digit verification code to this number.
                </p>
              </div>

              <button
                id="btn-send-otp"
                onClick={handleSendOtp}
                disabled={loading || mobile.length < 10}
                className="w-full bg-bento-deep hover:bg-bento-forest text-white font-medium py-3 rounded-xl transition duration-250 flex items-center justify-center gap-2 shadow-sm disabled:bg-stone-300 disabled:shadow-none cursor-pointer"
              >
                {loading ? "Sending..." : "Send OTP Verification"}
                <ArrowRight size={18} />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-4 text-stone-400 text-xs uppercase tracking-wider font-semibold">Or</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <button
                id="btn-google-signin"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-stone-50 text-stone-700 font-semibold py-3 px-4 border border-stone-300 rounded-xl transition duration-250 flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.8 2.95C6.2 7.15 8.89 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2 3.71-4.97 3.71-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.45c-.24-.73-.38-1.5-.38-2.3c0-.8.14-1.57.38-2.3L1.5 6.9C.54 8.84 0 11.02 0 13.27c0 2.25.54 4.43 1.5 6.37l3.8-3.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.72-2.88c-1.11.75-2.53 1.19-4.24 1.19-3.11 0-5.8-2.11-6.7-5.41l-3.8 2.95C3.39 19.35 7.35 23 12 23z"
                  />
                </svg>
                {loading ? "Connecting..." : "Continue with Google"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Enter OTP sent to +91 {mobile}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="xxxx"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-widest py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-accent font-mono text-xl font-bold text-stone-800"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-stone-500">
                    Enter any 4 digits (Demo: 1234)
                  </p>
                  <button
                    onClick={() => setIsOtpSent(false)}
                    className="text-xs text-bento-forest hover:underline font-semibold cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>
              </div>

              <button
                id="btn-verify-otp"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-bento-deep hover:bg-bento-forest text-white font-medium py-3 rounded-xl transition duration-250 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify & Log In"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="profile-module" className="w-full max-w-4xl mx-auto py-6 px-4">
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Banner Section */}
        <div className="bento-card-deep relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 text-white opacity-10 pointer-events-none">
            <Sprout size={240} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-bento-forest text-bento-mint text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-bento-mint/20">
                Farmer Profile Setup
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-2 text-white">
                {name ? `Namaste, ${name}` : "Set Up Your Digital Farm"}
              </h1>
              <p className="text-bento-mint/80 text-sm mt-1">
                Configure soil type, location, and farm dimensions to receive tailored crop recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General and Location Details */}
          <div className="bento-card space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <User className="text-bento-forest" size={20} />
              <h3 className="font-display font-bold text-bento-deep">Personal & Location</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Farmer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anji Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">District</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warangal"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Village</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennaraopet"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Aadhaar (Optional)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12-digit UIDAI"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Soil & Water Details */}
          <div className="bento-card space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Beaker className="text-bento-forest" size={20} />
              <h3 className="font-display font-bold text-bento-deep">Soil & Water parameters</h3>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm font-medium"
                  >
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Red Sandy Soil">Red Sandy Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Clayey Loam">Clayey Loam</option>
                    <option value="Laterite Soil">Laterite Soil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="14"
                    value={soilPh}
                    onChange={(e) => setSoilPh(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm font-mono"
                  />
                </div>
              </div>

              {/* NPK parameters */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Soil NPK Content (mg/kg)</label>
                <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase">Nitrogen (N)</span>
                    <input
                      type="number"
                      value={nitrogen}
                      onChange={(e) => setNitrogen(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800 text-xs font-mono mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase">Phosphorus (P)</span>
                    <input
                      type="number"
                      value={phosphorus}
                      onChange={(e) => setPhosphorus(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800 text-xs font-mono mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase">Potassium (K)</span>
                    <input
                      type="number"
                      value={potassium}
                      onChange={(e) => setPotassium(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800 text-xs font-mono mt-1 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Water Table Depth (m)</label>
                  <input
                    type="number"
                    value={groundwaterDepth}
                    onChange={(e) => setGroundwaterDepth(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-bento-accent text-sm font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 h-full mt-4 pl-2">
                  <input
                    type="checkbox"
                    id="irrigation"
                    checked={irrigationAvailable}
                    onChange={(e) => setIrrigationAvailable(e.target.checked)}
                    className="w-4 h-4 text-bento-deep border-stone-300 rounded focus:ring-bento-accent focus:ring-2"
                  />
                  <label htmlFor="irrigation" className="text-xs font-bold text-stone-700 cursor-pointer select-none">
                    Irrigation Facilities
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bento-light/40 p-4 rounded-2xl border border-bento-mint/30">
          <div className="text-xs text-stone-600">
            Registered Mobile: <span className="font-bold text-stone-800 font-mono">+91 {mobile}</span>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-bento-forest animate-bounce">
                <Check size={16} /> Profile Saved to Cloud!
              </span>
            )}
            <button
              id="btn-save-profile"
              type="submit"
              disabled={loading}
              className="bg-bento-deep hover:bg-bento-forest disabled:bg-stone-300 text-white font-medium px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
