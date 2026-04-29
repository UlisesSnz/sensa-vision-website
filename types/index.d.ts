export type NavChildItem = {
  label: string;
  href: string;
  target: boolean;
};

export type NavItem = {
  label: string;
  href?: string;
  target?: boolean;
  subLinks?: NavChildItem[];
};

export type BreadcrumbLink = {
  label: string;
  href: string;
};
