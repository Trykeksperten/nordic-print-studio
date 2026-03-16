export type ProductPriceLine = {
  da: string;
  en: string;
};

export type ProductPricing = {
  from: string;
  lines: ProductPriceLine[];
};

export const productPricingById: Record<string, ProductPricing> = {
  "basic-tshirt": {
    from: "49,-",
    lines: [
      { da: "Hvid: 49,-", en: "White: 49,-" },
      { da: "Andre farver: 59,-", en: "Other colors: 59,-" },
    ],
  },
  "heavyweight-tshirt": {
    from: "69,-",
    lines: [
      { da: "Hvid: 69,-", en: "White: 69,-" },
      { da: "Andre farver: 79,-", en: "Other colors: 79,-" },
    ],
  },
  "performance-tshirt": {
    from: "69,-",
    lines: [{ da: "Fra: 69,-", en: "From: 69,-" }],
  },
  "byb-oversized-acid-wash-tee": {
    from: "129,-",
    lines: [{ da: "Pris: 129,-", en: "Price: 129,-" }],
  },
  "authentic-sweat": {
    from: "199,-",
    lines: [{ da: "Pris: 199,-", en: "Price: 199,-" }],
  },
  "standard-hoodie": {
    from: "259,-",
    lines: [{ da: "Pris: 259,-", en: "Price: 259,-" }],
  },
  "premium-hoodie": {
    from: "299,-",
    lines: [{ da: "Pris: 299,-", en: "Price: 299,-" }],
  },
  "byb-ladies-fluffy-sweatpants": {
    from: "249,-",
    lines: [{ da: "Pris: 249,-", en: "Price: 249,-" }],
  },
};
