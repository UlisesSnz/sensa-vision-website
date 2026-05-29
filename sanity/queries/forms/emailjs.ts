import { groq } from "next-sanity";

export const formEmailJsQuery = groq`
  _type == "form-emailjs" => {
    _type,
    padding,
    colorVariant,
    stackAlign,
    internalName,
    templateKey,
    title,
    description,
    fields[]{
      _key,
      name,
      label,
      placeholder,
      fieldType,
      required,
    },
    consentText,
    buttonText,
    successMessage,
    errorMessage,
  },
`;
