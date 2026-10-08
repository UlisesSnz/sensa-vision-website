export type TableLink = {
  _type: "link";
  _key: string;
  href: string;
};

export type TableTextBlock = {
  _type: "block";
  _key: string;
  style?: "normal";
  children: Array<{
    _type: "span";
    _key: string;
    text: string;
    marks?: string[];
  }>;
  markDefs?: TableLink[];
};

export type PortableTextTableCell = {
  _type: "cell";
  _key: string;
  value?: TableTextBlock[];
};

export type PortableTextTableRow = {
  _type: "row";
  _key: string;
  cells: PortableTextTableCell[];
};

export type PortableTextTable = {
  _type: "table";
  _key: string;
  caption?: string;
  headerRows?: 0 | 1;
  rows: PortableTextTableRow[];
};
