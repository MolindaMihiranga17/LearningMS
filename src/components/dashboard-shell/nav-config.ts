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
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export const INSTITUTE_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Teachers", href: "/teachers", icon: GraduationCap },
  { label: "Students", href: "/students", icon: Users },
  { label: "Classes", href: "/classes", icon: BookOpen },
  { label: "Subjects", href: "/subjects", icon: ClipboardCheck },
  { label: "Enrollments", href: "/enrollments", icon: ClipboardCheck },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "My Classes", href: "/classes", icon: BookOpen, disabled: true },
  { label: "My Subjects", href: "/subjects", icon: ClipboardCheck, disabled: true },
  { label: "Students", href: "/students", icon: Users, disabled: true },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, disabled: true },
  { label: "Grades", href: "/grades", icon: BarChart3 },
  { label: "Announcements", href: "/announcements", icon: Megaphone, disabled: true },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Institutes", href: "/institutes", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/my-courses", icon: BookOpen },
  { label: "My Classes", href: "/classes", icon: BookOpen, disabled: true },
  { label: "My Subjects", href: "/subjects", icon: ClipboardCheck, disabled: true },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, disabled: true },
  { label: "Grades", href: "/grades", icon: BarChart3 },
  { label: "Announcements", href: "/announcements", icon: Megaphone, disabled: true },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export const NAV_BY_ROLE = {
  "institute-admin": INSTITUTE_ADMIN_NAV,
  teacher: TEACHER_NAV,
  "super-admin": SUPER_ADMIN_NAV,
  student: STUDENT_NAV,
} as const;

export type NavKey = keyof typeof NAV_BY_ROLE;
