import {
  BatteryCharging,
  BookOpen,
  Calculator,
  Camera,
  CircuitBoard,
  Cpu,
  DraftingCompass,
  Drill,
  Gauge,
  Glasses,
  Headphones,
  HeartPulse,
  Laptop,
  Lightbulb,
  Mic,
  Microscope,
  Monitor,
  MousePointerClick,
  Package,
  PenTool,
  PersonStanding,
  Presentation,
  Projector,
  Scissors,
  Shirt,
  Smartphone,
  Stethoscope,
  Tablet,
  Usb,
  Video,
  Wrench,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

// Picture for an item without a photo, chosen from what the item actually
// is. Rules are checked in order, so specific words ("headphones",
// "stethoscope") win over general ones ("electronics").
const RULES: { words: string[]; icon: LucideIcon }[] = [
  // "Anatomy & Physiology Textbook" is a book, not an anatomy model
  { words: ["textbook"], icon: BookOpen },
  { words: ["headphone", "earphone", "earbud", "airpod"], icon: Headphones },
  { words: ["stethoscope"], icon: Stethoscope },
  { words: ["blood pressure", "bp monitor", "heart rate", "pulse"], icon: HeartPulse },
  { words: ["multimeter", "voltmeter", "oscilloscope"], icon: Gauge },
  { words: ["arduino", "breadboard", "circuit"], icon: CircuitBoard },
  { words: ["raspberry pi", "microcontroller", "cpu"], icon: Cpu },
  { words: ["drill", "screwdriver"], icon: Drill },
  { words: ["drafting", "compass", "measuring", "ruler", "protractor"], icon: DraftingCompass },
  { words: ["projector"], icon: Projector },
  { words: ["whiteboard", "poster", "presentation board", "easel"], icon: Presentation },
  { words: ["clicker", "presenter", "laser pointer"], icon: MousePointerClick },
  { words: ["charger", "power bank", "powerbank", "battery"], icon: BatteryCharging },
  { words: ["microphone", " mic"], icon: Mic },
  { words: ["tripod", "gimbal", "webcam", "video camera", "camcorder"], icon: Video },
  { words: ["camera", "dslr", "mirrorless", "lens"], icon: Camera },
  { words: ["drawing tablet", "stylus", "wacom", "pen tablet"], icon: PenTool },
  { words: ["ipad", "tablet"], icon: Tablet },
  { words: ["phone", "iphone", "android phone"], icon: Smartphone },
  { words: ["monitor", "screen", "display"], icon: Monitor },
  { words: ["dock", "usb", "hub", "adapter", "cable"], icon: Usb },
  { words: ["laptop", "macbook", "notebook computer", "chromebook"], icon: Laptop },
  { words: ["calculator", "casio", "ti-84", "ti-83"], icon: Calculator },
  { words: ["ring light", "desk lamp", "lamp", " light"], icon: Lightbulb },
  { words: ["lab coat", "coat", "scrubs"], icon: Shirt },
  { words: ["goggles", "glasses"], icon: Glasses },
  { words: ["dissection", "scalpel", "scissors"], icon: Scissors },
  { words: ["anatomical", "anatomy", "skeleton", "model"], icon: PersonStanding },
  { words: ["microscope"], icon: Microscope },
  { words: ["beaker", "flask", "chemistry set", "pipette"], icon: FlaskConical },
  { words: ["toolkit", "tool kit", "wrench", "spanner"], icon: Wrench },
  { words: ["textbook", "book", "novel", "guide", "edition"], icon: BookOpen },
];

const CATEGORY_FALLBACK: Record<string, LucideIcon> = {
  Textbook: BookOpen,
  Calculator: Calculator,
  "Lab Equipment": FlaskConical,
  Electronics: Laptop,
  Tool: Wrench,
  "Nursing Equipment": Stethoscope,
  "Camera Equipment": Camera,
  "Study Equipment": Presentation,
};

export function itemIcon(title: string, category?: string | null): LucideIcon {
  const text = ` ${title.toLowerCase()} `;
  for (const rule of RULES) {
    if (rule.words.some((word) => text.includes(word))) return rule.icon;
  }
  return (category && CATEGORY_FALLBACK[category]) || Package;
}

// Each category gets its own soft tile colour from the brand palette
const TINTS: Record<string, { from: string; to: string; ink: string }> = {
  Textbook: { from: "#ede6fa", to: "#d6c9f1", ink: "#4a3a80" },
  Calculator: { from: "#eceaf3", to: "#d2cfdf", ink: "#3f3a5e" },
  Electronics: { from: "#eeedeb", to: "#cfcdca", ink: "#3a281f" },
  "Lab Equipment": { from: "#f1e8e3", to: "#dcc6ba", ink: "#5d3a29" },
  "Nursing Equipment": { from: "#f3e9ee", to: "#e0c9d6", ink: "#5e3550" },
  "Camera Equipment": { from: "#e7e2f4", to: "#c5b9e3", ink: "#3a2d63" },
  Tool: { from: "#efe6df", to: "#d4bfb0", ink: "#4b3428" },
  "Study Equipment": { from: "#e9eaf2", to: "#cdd0e0", ink: "#323a5c" },
};
const DEFAULT_TINT = { from: "#eeedeb", to: "#d8d6f0", ink: "#3a2d63" };

export function itemTint(category?: string | null) {
  return (category && TINTS[category]) || DEFAULT_TINT;
}
