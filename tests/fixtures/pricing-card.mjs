// Spanish headings/badges match the published and draft pricing page.
// English and stress cases are synthetic fixtures, not CMS translations.
export const pricingCases = [
  {
    id: "es",
    locale: "es",
    cards: [
      { title: "Sensa Free", tagLine: "1 pantalla incluida", value: 0, period: "MXN al mes" },
      { title: "Pantallas adicionales", tagLine: "Más pantallas, mismas funciones", value: 149, period: "MXN por pantalla al mes" },
      { title: "Sensa Max", tagLine: "Complemento opcional", value: 70, period: "MXN por pantalla al mes" },
    ],
  },
  {
    id: "en",
    locale: "en",
    cards: [
      { title: "Sensa Free", tagLine: "One screen included", value: 0 },
      { title: "Additional screens", tagLine: "More screens, the same features for every additional screen", value: 149 },
      { title: "Sensa Max", tagLine: "Optional add-on", value: 70 },
    ],
  },
  {
    id: "edge-cases",
    locale: "es",
    cards: [
      { title: "Plan", tagLine: "Nuevo", value: 0 },
      { title: "Un título largo para administrar todas las pantallas de tu organización", tagLine: "Más pantallas con todas las funciones disponibles en cualquier tamaño de pantalla", value: 149 },
      { title: "PantallasAdicionales".repeat(6), tagLine: "MismasFunciones".repeat(12), value: 70 },
    ],
  },
  {
    id: "without-badge",
    locale: "es",
    cards: [
      { title: "Sin etiqueta", tagLine: "", value: 0 },
      { title: "Etiqueta no definida", value: 149 },
      { title: "Con selector de facturación", tagLine: "Prueba", value: 70,
        pricingTiers: [{ label: "2 pantallas", price: "$298 MXN", annualPrice: "$3,576 MXN" }] },
    ],
  },
];
