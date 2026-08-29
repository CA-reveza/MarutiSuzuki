import { Brand, StoreCategory, NewArrivalCollection, TrendingEdit, InStoreEvent } from '../types';

const HERO_IMG = "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1600";
const HATCHBACK_IMG = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=900";
const SUV_IMG = "https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&q=80&w=900";
const SEDAN_IMG = "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&q=80&w=900";
const EV_IMG = "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=900";
const SALES_FLOOR_IMG = "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=900";
const SERVICE_BAY_IMG = "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=900";
const ACCESSORIES_IMG = "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=900";
const INSURANCE_IMG = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=900";

export const STORE_INFO = {
  name: "Maruti Suzuki Arena Flagship Showroom",
  location: "In-Store Wi-Fi • Sales Floor to Service Bay",
  address: "In-Store Guest Wi-Fi Network (MarutiSuzuki_Guest_HighSpeed)",
};

export const NEW_ARRIVALS: NewArrivalCollection[] = [
  {
    id: "hatchback-new",
    title: "New Season Hatchbacks",
    subtitle: "Fuel-efficient city runabouts with the latest infotainment suite",
    category: "HATCHBACK",
    badge: "Just Launched",
    imageUrl: HATCHBACK_IMG,
    description:
      "Explore the newest hatchback line-up on the Sales Floor, featuring updated SmartPlay infotainment, refreshed exteriors, and improved fuel efficiency.",
    highlights: ["SmartPlay Pro+ Infotainment", "Dual Front Airbags (Standard)", "Improved Mileage Variants"],
    storeLocation: "Ground Floor • Sales Bay A",
  },
  {
    id: "suv-lineup",
    title: "SUV & Crossover Range",
    subtitle: "Bold styling, higher ground clearance, and advanced safety tech",
    category: "SUV",
    badge: "Showroom Special",
    imageUrl: SUV_IMG,
    description:
      "Step up to the SUV line-up on display, with 360-degree camera options, all-wheel drive variants, and a spacious 3-row seating configuration on select models.",
    highlights: ["360° Camera Package", "AllGrip Select AWD Option", "3-Row Seating Variants"],
    storeLocation: "Ground Floor • Sales Bay B",
  },
  {
    id: "sedan-comfort",
    title: "Sedan Comfort Series",
    subtitle: "Refined ride quality and premium cabin finish for daily commutes",
    category: "SEDAN",
    badge: "Customer Favourite",
    imageUrl: SEDAN_IMG,
    description:
      "Sit inside our best-selling sedans on the showroom floor, finished with ventilated seats, a heads-up display, and a quieter cabin for daily commutes.",
    highlights: ["Ventilated Front Seats", "Head-Up Display", "6-Airbag Safety Package"],
    storeLocation: "Ground Floor • Sales Bay C",
  },
  {
    id: "ev-charge",
    title: "Electric & Hybrid Range",
    subtitle: "Zero and low-emission models with fast-charging capability",
    category: "EV",
    badge: "Future Mobility",
    imageUrl: EV_IMG,
    description:
      "Discover our electric and strong-hybrid models with live charging demonstrations and a dedicated EV product specialist on the floor.",
    highlights: ["Fast-Charging Compatible", "Regenerative Braking", "Home Charger Guidance"],
    storeLocation: "Ground Floor • EV Experience Zone",
  },
];

export const BRANDS: Brand[] = [
  {
    id: "model-swift-class",
    name: "SWIFT",
    category: "Hatchback",
    level: "Sales Floor",
    section: "Sales Bay A",
    description: "Sporty compact hatchback with punchy performance and a sharp turning radius, ideal for city driving.",
    featured: true,
    popularItems: ["ZXi+ Trim", "Dual-Tone Exterior", "Auto-Gear Shift"],
  },
  {
    id: "model-baleno-class",
    name: "BALENO",
    category: "Premium Hatchback",
    level: "Sales Floor",
    section: "Sales Bay A",
    description: "Premium hatchback with a spacious cabin, HeadUp Display, and a 360-degree camera package.",
    featured: true,
    popularItems: ["Alpha Variant", "HeadUp Display", "Wireless Charging"],
  },
  {
    id: "model-brezza-class",
    name: "BREZZA",
    category: "Compact SUV",
    level: "Sales Floor",
    section: "Sales Bay B",
    description: "Compact SUV with bold road presence, 360-degree camera, and a segment-leading boot space.",
    featured: true,
    popularItems: ["ZXi+ Dual Tone", "360° Camera", "Cruise Control"],
  },
  {
    id: "model-grandvitara-class",
    name: "GRAND VITARA",
    category: "Mid-Size SUV",
    level: "Sales Floor",
    section: "Sales Bay B",
    description: "Strong-hybrid mid-size SUV offering class-leading fuel efficiency and AllGrip Select AWD.",
    featured: true,
    popularItems: ["Strong Hybrid Powertrain", "AllGrip Select AWD", "Panoramic Sunroof"],
  },
  {
    id: "model-dzire-class",
    name: "DZIRE",
    category: "Compact Sedan",
    level: "Sales Floor",
    section: "Sales Bay C",
    description: "India's best-selling sedan, now with a refreshed cabin, 6 airbags, and a boot-mounted spoiler.",
    featured: true,
    popularItems: ["ZXi+ AGS", "6-Airbag Safety Suite", "Ventilated Seats"],
  },
  {
    id: "model-ertiga-class",
    name: "ERTIGA",
    category: "MPV",
    level: "Sales Floor",
    section: "Sales Bay D",
    description: "Family-friendly 7-seater MPV with flexible seating, ideal for long drives and larger families.",
    featured: false,
    popularItems: ["7-Seat Configuration", "Rear AC Vents", "SmartPlay Pro Infotainment"],
  },
  {
    id: "model-jimny-class",
    name: "JIMNY",
    category: "Off-Road SUV",
    level: "Sales Floor",
    section: "Sales Bay B",
    description: "Rugged 3-door and 5-door off-roader built on a ladder-frame chassis with AllGrip Pro 4x4.",
    featured: false,
    popularItems: ["AllGrip Pro 4x4", "Brake LSD Traction", "Ladder-Frame Chassis"],
  },
  {
    id: "model-eeco-class",
    name: "EECO",
    category: "Van / Cargo",
    level: "Sales Floor",
    section: "Sales Bay D",
    description: "Versatile van available in passenger and cargo configurations for business and family use.",
    featured: false,
    popularItems: ["Cargo Configuration", "5-Seater Passenger Trim", "CNG Option"],
  },
  {
    id: "true-value-class",
    name: "TRUE VALUE",
    category: "Certified Pre-Owned",
    level: "Ground Floor",
    section: "Pre-Owned Car Bay",
    description: "Certified pre-owned Maruti Suzuki cars, inspected on a 376-point checklist with warranty options.",
    featured: false,
    popularItems: ["376-Point Inspection", "RC Transfer Assistance", "Extended Warranty Add-on"],
  },
];

export const STORE_FLOOR_DIRECTORY: StoreCategory[] = [
  {
    id: "floor-sales",
    name: "SALES FLOOR",
    level: "Ground Floor",
    subtitle: "New car sales, test drive desk & finance counter",
    subcategories: [
      "Hatchback Display Bay (Swift, Baleno)",
      "SUV & Crossover Bay (Brezza, Grand Vitara, Jimny)",
      "Sedan Display Bay (Dzire)",
      "MPV & Van Bay (Ertiga, Eeco)",
      "Finance & Insurance Desk",
      "Test Drive Booking Counter",
    ],
    aisle: "Bays A – D",
    imageUrl: SALES_FLOOR_IMG,
  },
  {
    id: "floor-service",
    name: "SERVICE CENTER",
    level: "First Floor",
    subtitle: "Periodic service, repairs, body & paint work",
    subcategories: [
      "Periodic Service & Maintenance Bay",
      "Body & Paint Repair Shop",
      "Wheel Alignment & Balancing Bay",
      "Battery & Tyre Replacement Counter",
      "Service Advisor Desk",
      "Express Service (90-Minute) Lane",
    ],
    aisle: "Bays 1 – 6",
    imageUrl: SERVICE_BAY_IMG,
  },
  {
    id: "floor-accessories",
    name: "ACCESSORIES & CARE",
    level: "Ground Floor",
    subtitle: "Genuine accessories, detailing & car care products",
    subcategories: [
      "Genuine Accessories Counter",
      "Alloy Wheels & Styling Kits",
      "Car Care & Detailing Products",
      "Infotainment & Dashcam Upgrades",
      "Seat Cover & Upholstery Studio",
    ],
    aisle: "Bay E",
    imageUrl: ACCESSORIES_IMG,
  },
  {
    id: "floor-insurance",
    name: "INSURANCE & FINANCE",
    level: "Ground Floor",
    subtitle: "Motor insurance, extended warranty & loan assistance",
    subcategories: [
      "New Policy Issuance Desk",
      "Cashless Claim Assistance",
      "Extended Warranty Counter",
      "Loan & EMI Calculator Desk",
      "Exchange & Trade-In Valuation",
    ],
    aisle: "Bay F",
    imageUrl: INSURANCE_IMG,
  },
];

export const TRENDING_EDITS: TrendingEdit[] = [
  {
    id: "trend-suv",
    title: "SUV Season",
    tag: "Sales Floor Bay B",
    imageUrl: SUV_IMG,
    location: "Ground Floor Sales Bay B",
    description: "Grand Vitara and Brezza are the most test-driven models on the floor this month.",
  },
  {
    id: "trend-service-camp",
    title: "Monsoon Service Camp",
    tag: "Service Center",
    imageUrl: SERVICE_BAY_IMG,
    location: "First Floor Service Center",
    description: "Free multi-point vehicle inspection and battery health check, running through this week.",
  },
  {
    id: "trend-accessories",
    title: "Accessory Upgrades",
    tag: "Ground Floor Bay E",
    imageUrl: ACCESSORIES_IMG,
    location: "Ground Floor Accessories Bay",
    description: "Alloy wheel upgrades and dashcam installations trending among first-time buyers this week.",
  },
  {
    id: "trend-exchange",
    title: "Exchange & Upgrade",
    tag: "True Value Bay",
    imageUrl: HATCHBACK_IMG,
    location: "Ground Floor Pre-Owned Car Bay",
    description: "Trade in your current vehicle for an instant valuation and upgrade to a newer model today.",
  },
];

export const IN_STORE_EVENTS: InStoreEvent[] = [
  {
    id: "evt-test-drive",
    title: "Weekend Test Drive Marathon",
    location: "Ground Floor • Test Drive Desk",
    time: "Ongoing Today • 10:00 AM - 7:00 PM",
    badge: "Book a Slot",
    description: "Reserve a guided test drive across the SUV, sedan, and hatchback range with a product specialist.",
  },
  {
    id: "evt-finance",
    title: "On-the-Spot Loan Approval Desk",
    location: "Ground Floor • Finance Counter",
    time: "Ongoing Today • 10:00 AM - 6:00 PM",
    badge: "Finance Assist",
    description: "Get an instant EMI estimate and loan pre-approval from our partner banks at the finance desk.",
  },
];
