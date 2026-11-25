import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PortableTextRenderer from "@/components/portable-text-renderer";
import type { Locale } from "@/i18n/config";

interface FAQProps {
  padding: {
    top: boolean;
    bottom: boolean;
  };
  colorVariant:
    | "primary"
    | "secondary"
    | "card"
    | "accent"
    | "destructive"
    | "background"
    | "transparent";
  title: string;
  faqs: {
    _id: string;
    title: string;
    body: any;
  }[];
  locale: Locale;
  compactTop?: boolean;
}

export default function FAQs({
  padding,
  colorVariant,
  faqs,
  locale = "es",
  compactTop = false,
}: Partial<FAQProps>) {
  const color = stegaClean(colorVariant);
  return (
    <SectionContainer color={color} padding={padding} compactTop={compactTop}>
      {faqs && faqs?.length > 0 && (
        <Accordion className="space-y-4" type="multiple">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={`${faq._id}-${index}`}
              value={`item-${faq._id}-${index}`}
            >
              <AccordionTrigger>{faq.title}</AccordionTrigger>
              <AccordionContent>
                <PortableTextRenderer value={faq.body} locale={locale} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </SectionContainer>
  );
}
