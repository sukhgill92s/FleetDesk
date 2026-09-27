"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "pa";

const en = {
  loading: "Loading…",
  save: "Save",
  cancel: "Cancel",
  back: "Back",
  retry: "Try again",
  errorGeneric: "Something went wrong. Please try again.",
  signOut: "Sign out",
  navDashboard: "Dashboard",
  navDrivers: "Drivers",
  navTrucks: "Trucks",

  navSettings: "Settings",
  settingsTitle: "Company settings",
  payPeriod: "Pay period",
  payPeriodWeekly: "Weekly",
  payPeriodBiweekly: "Every 2 weeks",
  payPeriodMonthly: "Monthly",
  settingsSaved: "Settings saved!",
  payType: "Pay type",
  payPerMile: "Per mile",
  payHourly: "Hourly",
  hourlyRate: "Hourly rate (CAD)",
  hours: "Hours",
  hoursPh: "e.g. 8.5",
  prevPeriod: "‹ Prev",
  nextPeriod: "Next ›",
  // Login
  welcomeBack: "Welcome back",
  signInSub: "Sign in to your fleet account.",
  email: "Email",
  password: "Password",
  signIn: "Sign in",
  signingIn: "Signing in…",
  noAccount: "No account?",
  createOne: "Create one",

  // Signup
  createAccount: "Create your account",
  signupSub: "Free pilot. Then sign in and choose your role.",
  createAccountBtn: "Create account",
  creating: "Creating…",
  haveAccount: "Already have an account?",
  checkEmail:
    "Account created! Check your email for a confirmation link (check spam too), then sign in.",

  // Invite (driver accepts owner's invite)
  inviteTitle: "You've been invited!",
  inviteWelcome: "Welcome to",
  inviteWelcomeGeneric:
    "Welcome to FleetDesk! Set a password to activate your driver account.",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  passwordTooShort: "Password must be at least 6 characters.",
  passwordMismatch: "Passwords do not match.",
  setPasswordContinue: "Set password & continue",
  saving: "Saving…",

  // Onboarding
  chooseRole: "What best describes you?",
  iAmOwner: "I own a trucking company",
  iAmDriver: "I'm a driver",
  companyName: "Company name",
  companyNamePh: "e.g. Gill Transport Ltd.",
  companyNameRequired: "Please enter your company name.",
  continue: "Continue",
  continuing: "Saving…",
  ownerNote: "You'll add your drivers and trucks next.",
  driverNote:
    "Ask your company owner to add you using your signup email address.",

  // Owner dashboard
  dashboardTitle: "Weekly dashboard",
  prevWeek: "← Prev",
  nextWeek: "Next →",
  driver: "Driver",
  miles: "Miles",
  payOwed: "Pay owed",
  expenses: "Expenses",
  rate: "Rate",
  total: "Total",
  manageDrivers: "Manage drivers",
  manageTrucks: "Manage trucks",
  noDrivers: "No drivers yet — add your first driver to get started.",
  noActivity: "No trips logged this week.",
  viewReceipt: "Receipt",
  tripsCount: "trips",

  // Drivers page
  driversTitle: "Drivers",
  name: "Name",
  namePh: "e.g. Harpreet Singh",
  phone: "Phone",
  phonePh: "e.g. 416-555-0123",
  loginEmail: "Driver's login email",
  loginEmailHelp: "Must match the email the driver signs up with.",
  perMileRate: "Pay rate (CAD per mile)",
  addDriver: "Add driver",
  adding: "Adding…",
  noDriversYet: "No drivers added yet.",
  deleteDriver: "Delete",
  deleting: "Deleting…",
  edit: "Edit",
  deleteDriverConfirm: "Delete this driver? Their trips and expenses will also be removed.",
  inviteSentTo: "Invite email sent to",
  inviteAlreadySignedUp: "They already have an account — no invite needed.",
  inviteFailed: "Driver added, but the invite email could not be sent.",

  // Trucks page
  trucksTitle: "Trucks",
  unitNumber: "Unit number",
  unitNumberPh: "e.g. 101",
  plate: "Licence plate",
  platePh: "e.g. AB 12345",
  addTruck: "Add truck",
  addingTruck: "Adding…",
  noTrucksYet: "No trucks added yet.",

  // Driver home
  myWeek: "My week",
  myMiles: "Miles this week",
  myPay: "Estimated pay",
  myExpenses: "My expenses",
  logTrip: "Log trip",
  logExpense: "Log expense",
  recentTrips: "Recent trips",
  recentExpenses: "Recent expenses",
  notLinked: "Your owner hasn't added you yet.",
  notLinkedHelp: "Ask them to add this login email:",
  noTripsYet: "No trips logged yet. Tap “Log trip” to start.",
  noExpensesYet: "No expenses logged yet.",
  from: "From",
  to: "To",

  // Trip form
  newTrip: "Log a trip",
  date: "Date",
  fromPh: "e.g. Brampton, ON",
  toPh: "e.g. Chicago, IL",
  milesPh: "e.g. 520",
  fuelLitres: "Fuel in litres (optional)",
  fuelCost: "Fuel cost in CAD (optional)",
  truck: "Truck (optional)",
  noTruck: "No truck",
  saveTrip: "Save trip",
  tripSaved: "Trip saved!",

  // Expense form
  newExpense: "Log an expense",
  category: "Category",
  catFuel: "Fuel",
  catRepair: "Repair",
  catFood: "Food",
  catToll: "Toll",
  catOther: "Other",
  amount: "Amount (CAD)",
  receipt: "Receipt photo (optional)",
  saveExpense: "Save expense",
  expenseSaved: "Expense saved!",
  choosePhoto: "Choose photo",

  // Auth hero (dark premium)
  heroTagline: "Fleet software for small trucking companies.",
  heroF1t: "Weekly dashboard",
  heroF1d: "Miles, pay and expenses per driver.",
  heroF2t: "Driver mobile app",
  heroF2d: "Drivers log trips and expenses from the road.",
  heroF3t: "Receipt photos",
  heroF3d: "Snap fuel and repair receipts on the go.",
};

export type StringKey = keyof typeof en;

const pa: Record<StringKey, string> = {
  loading: "Load ho reha…",
  save: "Save karo",
  cancel: "Cancel",
  back: "Pichhe",
  retry: "Dobara try karo",
  errorGeneric: "Kujh galat ho gaya. Dobara try karo.",
  signOut: "Sign out",
  navDashboard: "Dashboard",
  navDrivers: "Driver",
  navTrucks: "Truck",

  navSettings: "Settings",
  settingsTitle: "Company settings",
  payPeriod: "Pay da hisaab",
  payPeriodWeekly: "Har hafta",
  payPeriodBiweekly: "Har 2 hafte",
  payPeriodMonthly: "Har mahina",
  settingsSaved: "Settings save ho gayian!",
  payType: "Pay di kisam",
  payPerMile: "Per mile",
  payHourly: "Hourly",
  hourlyRate: "Hourly rate (CAD)",
  hours: "Ghante",
  hoursPh: "jivein 8.5",
  prevPeriod: "‹ Pichhla",
  nextPeriod: "Agla ›",
  welcomeBack: "Wapas aaye o",
  signInSub: "Apne fleet account vich sign in karo.",
  email: "Email",
  password: "Password",
  signIn: "Sign in karo",
  signingIn: "Sign in ho reha…",
  noAccount: "Account nahi hai?",
  createOne: "Banao",

  createAccount: "Apna account banao",
  signupSub: "Free pilot. Phir sign in karke apna role chuno.",
  createAccountBtn: "Account banao",
  creating: "Ban reha…",
  haveAccount: "Pehla to account hai?",
  checkEmail:
    "Account ban gaya! Email vich confirmation link check karo (spam vi), phir sign in karo.",

  inviteTitle: "Tuhanu invite aaya hai!",
  inviteWelcome: "Ji aayan nu",
  inviteWelcomeGeneric:
    "FleetDesk te ji aayan nu! Apna driver account chalu karan layi password set karo.",
  newPassword: "Nava password",
  confirmPassword: "Password dobara likho",
  passwordTooShort: "Password ghatt to ghatt 6 akhar da hove.",
  passwordMismatch: "Dove password milda nahi.",
  setPasswordContinue: "Password set karo te agge vadho",
  saving: "Save ho reha…",

  chooseRole: "Tusi kaun ho?",
  iAmOwner: "Meri apni trucking company hai",
  iAmDriver: "Main driver haan",
  companyName: "Company da naa",
  companyNamePh: "jivein Gill Transport Ltd.",
  companyNameRequired: "Apni company da naa likho.",
  continue: "Agge vacho",
  continuing: "Save ho reha…",
  ownerNote: "Agge tusi apne driver te truck add karoge.",
  driverNote: "Apne malak nu kaho ke tuhade signup email naal tuhanu add kare.",

  dashboardTitle: "Hafte da hisaab",
  prevWeek: "← Pichhla",
  nextWeek: "Agla →",
  driver: "Driver",
  miles: "Miles",
  payOwed: "Deni pay",
  expenses: "Kharche",
  rate: "Rate",
  total: "Total",
  manageDrivers: "Driver sambhalo",
  manageTrucks: "Truck sambhalo",
  noDrivers: "Koi driver nahi — pehla driver add karo.",
  noActivity: "Ess hafte koi trip nahi.",
  viewReceipt: "Receipt",
  tripsCount: "trips",

  driversTitle: "Driver",
  name: "Naa",
  namePh: "jivein Harpreet Singh",
  phone: "Phone",
  phonePh: "jivein 416-555-0123",
  loginEmail: "Driver da login email",
  loginEmailHelp: "Driver jis email naal signup karega, ohi likho.",
  perMileRate: "Rate (CAD per mile)",
  addDriver: "Driver pao",
  adding: "Add ho reha…",
  noDriversYet: "Hale koi driver add nahi hoya.",
  deleteDriver: "Delete karo",
  deleting: "Delete ho reha…",
  edit: "Edit karo",
  deleteDriverConfirm: "Eh driver delete karna? Ohde trips te kharche vi delete ho jange.",
  inviteSentTo: "Invite email bhej ditti:",
  inviteAlreadySignedUp: "Ohda account pehla hi hai — invite di lorh nahi.",
  inviteFailed: "Driver add ho gaya, par invite email nahi bheji gayi.",

  trucksTitle: "Truck",
  unitNumber: "Unit number",
  unitNumberPh: "jivein 101",
  plate: "Plate number",
  platePh: "jivein AB 12345",
  addTruck: "Truck pao",
  addingTruck: "Add ho reha…",
  noTrucksYet: "Hale koi truck add nahi hoya.",

  myWeek: "Mera hafta",
  myMiles: "Ess hafte de miles",
  myPay: "Andazan pay",
  myExpenses: "Mere kharche",
  logTrip: "Trip pao",
  logExpense: "Kharcha pao",
  recentTrips: "Aakhri trips",
  recentExpenses: "Aakhri kharche",
  notLinked: "Tuhade malak ne tuhanu hale add nahi kitta.",
  notLinkedHelp: "Ohna nu kaho eh login email add karan:",
  noTripsYet: "Hale koi trip nahi. Shuru karan layi “Trip pao” dabao.",
  noExpensesYet: "Hale koi kharcha nahi.",
  from: "Kithon",
  to: "Kithe",

  newTrip: "Trip pao",
  date: "Tareekh",
  fromPh: "jivein Brampton, ON",
  toPh: "jivein Chicago, IL",
  milesPh: "jivein 520",
  fuelLitres: "Diesel litre vich (optional)",
  fuelCost: "Diesel da kharcha CAD vich (optional)",
  truck: "Truck (optional)",
  noTruck: "Koi truck nahi",
  saveTrip: "Trip save karo",
  tripSaved: "Trip save ho gayi!",

  newExpense: "Kharcha pao",
  category: "Kisam",
  catFuel: "Diesel",
  catRepair: "Repair",
  catFood: "Khana",
  catToll: "Toll",
  catOther: "Hor",
  amount: "Rakam (CAD)",
  receipt: "Receipt di photo (optional)",
  saveExpense: "Kharcha save karo",
  expenseSaved: "Kharcha save ho gaya!",
  choosePhoto: "Photo chuno",

  heroTagline: "Chhoti trucking company layi fleet software.",
  heroF1t: "Hafte da hisaab",
  heroF1d: "Har driver de miles, pay te kharche.",
  heroF2t: "Driver mobile app",
  heroF2d: "Driver road to trip te kharche paun.",
  heroF3t: "Receipt di photo",
  heroF3d: "Diesel te repair diyan receipt kheecho.",
};

const dictionaries: Record<Lang, Record<StringKey, string>> = { en, pa };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}

const Ctx = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fm-lang");
      if (saved === "en" || saved === "pa") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("fm-lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: StringKey) => dictionaries[lang][key] ?? en[key],
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
