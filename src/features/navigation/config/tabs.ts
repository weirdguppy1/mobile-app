import { CircleUser, Compass, type LucideIcon, Send } from 'lucide-react-native';

export interface TabConfig {
  /** Route file name within the (main) group. */
  name: string;
  label: string;
  icon: LucideIcon;
}

/** The bottom-nav tabs, left → right. `name` matches the route file. */
export const TABS: readonly TabConfig[] = [
  { name: 'discover', label: 'Discover', icon: Compass },
  { name: 'messages', label: 'Messages', icon: Send },
  { name: 'profile', label: 'Profile', icon: CircleUser },
];
