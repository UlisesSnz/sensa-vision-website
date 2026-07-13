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

export type LocaleAlternates = Partial<
  Record<import("@/i18n/config").Locale, string>
>;

export type BreadcrumbLink = {
  label: string;
  href: string;
};
