export interface NavItem {
  href: string;
  label: string;
  shortLabel: string; // phone tab bar, where all five share one row
  icon: 'home' | 'pin' | 'person' | 'arrow' | 'bookmark';
}

export const navItems: NavItem[] = [
  { href: '/local', label: 'Local Jobs', shortLabel: 'Local', icon: 'pin' },
  { href: '/remote', label: 'Remote Work', shortLabel: 'Remote', icon: 'home' },
  { href: '/workers-50-plus', label: 'Workers 50+', shortLabel: '50+', icon: 'person' },
  { href: '/second-chance', label: 'Second-Chance Hiring', shortLabel: 'Second Chance', icon: 'arrow' },
  { href: '/saved', label: 'Saved Jobs', shortLabel: 'Saved', icon: 'bookmark' },
];
