import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  Settings,
  Building2,
  FileText,
  Wallet,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  group?: string;
};

export const INSTITUTE_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Staff", href: "/staff", icon: GraduationCap, group: "Academics" },
  { label: "Students", href: "/students", icon: Users, group: "Academics" },
  { label: "Classes", href: "/classes", icon: BookOpen, group: "Academics" },
  { label: "Subjects", href: "/subjects", icon: ClipboardCheck, group: "Academics" },
  { label: "Enrollments", href: "/enrollments", icon: ClipboardCheck, group: "Academics" },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, group: "Operations" },
  { label: "Exams", href: "/exams", icon: FileText, group: "Operations" },
  { label: "Fees", href: "/fees", icon: Wallet, group: "Operations" },
  { label: "Expenses", href: "/expenses", icon: TrendingDown, group: "Finance" },
  { label: "Income", href: "/income", icon: TrendingUp, group: "Finance" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, group: "Engage" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const INSTITUTE_STAFF_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Courses", href: "/courses", icon: BookOpen, group: "Teaching" },
  { label: "My Classes", href: "/my-classes", icon: BookOpen, group: "Teaching" },
  { label: "My Subjects", href: "/my-subjects", icon: ClipboardCheck, group: "Teaching" },
  { label: "Students", href: "/students", icon: Users, disabled: true, group: "Teaching" },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, group: "Operations" },
  { label: "Exams", href: "/exams", icon: FileText, group: "Operations" },
  { label: "Grades", href: "/grades", icon: BarChart3, group: "Operations" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, group: "Engage" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Institutes", href: "/institutes", icon: Building2, group: "Platform" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "My Courses", href: "/my-courses", icon: BookOpen, group: "Learning" },
  { label: "My Classes", href: "/my-classes", icon: BookOpen, group: "Learning" },
  { label: "My Subjects", href: "/my-subjects", icon: ClipboardCheck, group: "Learning" },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, group: "Progress" },
  { label: "Grades", href: "/grades", icon: BarChart3, group: "Progress" },
  { label: "Fees", href: "/fees", icon: Wallet, group: "Progress" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, group: "Engage" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const NAV_BY_ROLE = {
  "institute-admin": INSTITUTE_ADMIN_NAV,
  "institute-staff": INSTITUTE_STAFF_NAV,
  "super-admin": SUPER_ADMIN_NAV,
  student: STUDENT_NAV,
} as const;

export type NavKey = keyof typeof NAV_BY_ROLE;
