import { groq } from "next-sanity";

export const hero2Query = groq`
  _type == "hero-2" => {
    _type, tagLine, title, body, links[defined(@)], baseScene,
    slides[]{ _key, alt, scene, "assetRef": asset._ref }
  },
`;
