export interface NavItem {
  href: string;
  label: string;
  icon: 'home' | 'pin' | 'person' | 'arrow' | 'bookmark';
}

export const navItems: NavItem[] = [
  { href: '/remote', label: 'Remote Work', icon: 'home' },
  { href: '/local', label: 'Local Jobs', icon: 'pin' },
  { href: '/workers-50-plus', label: 'Workers 50+', icon: 'person' },
  { href: '/second-chance', label: 'Second-Chance Hiring', icon: 'arrow' },
  { href: '/saved', label: 'Saved Jobs', icon: 'bookmark' },
];
