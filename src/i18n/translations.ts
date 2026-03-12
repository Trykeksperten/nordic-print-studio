export type Language = "da" | "en";

export const translations = {
  nav: {
    home: { da: "Forside", en: "Home" },
    textilePrint: { da: "Tekstiltryk", en: "Textile Printing" },
    largeFormat: { da: "Storformatprint", en: "Large Format Print" },
    products: { da: "Produkter", en: "Products" },
    uploadDesign: { da: "Upload design / Få tilbud", en: "Upload Design / Get Quote" },
    contact: { da: "Kontakt", en: "Contact" },
    getQuote: { da: "Få et tilbud", en: "Get a Quote" },
  },
  hero: {
    headline: {
      da: "Professionelt tekstiltryk til virksomheder, events og brands",
      en: "Professional textile printing for businesses, events and brands",
    },
    subheadline: {
      da: "Upload dit design og få et tilbud hurtigt og nemt.",
      en: "Upload your design and get a quote quickly and easily.",
    },
    uploadBtn: { da: "Upload design", en: "Upload Design" },
    productsBtn: { da: "Se produkter", en: "View Products" },
  },
  about: {
    title: { da: "Om Trykeksperten", en: "About Trykeksperten" },
    description: {
      da: "Trykeksperten er din partner inden for professionelt tekstiltryk og storformatprint. Vi leverer høj kvalitet til konkurrencedygtige priser med hurtig levering. Uanset om du har brug for firmatøj, merchandise eller eventmaterialer – vi har løsningen.",
      en: "Trykeksperten is your partner in professional textile printing and large format printing. We deliver high quality at competitive prices with fast delivery. Whether you need corporate wear, merchandise, or event materials – we have the solution.",
    },
  },
  services: {
    title: { da: "Vores services", en: "Our Services" },
    textile: {
      title: { da: "Tekstiltryk", en: "Textile Printing" },
      desc: { da: "Professionelt tryk på t-shirts, hoodies, arbejdstøj og meget mere.", en: "Professional printing on t-shirts, hoodies, workwear and more." },
    },
    largeFormat: {
      title: { da: "Storformatprint", en: "Large Format Print" },
      desc: { da: "Bannere, roll-ups, plakater og skilte i høj kvalitet.", en: "Banners, roll-ups, posters and signs in high quality." },
    },
    special: {
      title: { da: "Specialproduktion", en: "Special Production" },
      desc: { da: "Skræddersyede løsninger til unikke behov og projekter.", en: "Tailored solutions for unique needs and projects." },
    },
  },
  process: {
    title: { da: "Sådan fungerer det", en: "How It Works" },
    steps: [
      { da: { title: "Upload dit design", desc: "Send os dit logo eller design i PNG, SVG eller AI-format." }, en: { title: "Upload Your Design", desc: "Send us your logo or design in PNG, SVG or AI format." } },
      { da: { title: "Vælg produkter", desc: "Vælg blandt vores udvalg af kvalitetsprodukter." }, en: { title: "Choose Products", desc: "Choose from our selection of quality products." } },
      { da: { title: "Modtag tilbud", desc: "Vi sender dig et uforpligtende tilbud inden for 24 timer." }, en: { title: "Receive Quote", desc: "We send you a no-obligation quote within 24 hours." } },
      { da: { title: "Levering", desc: "Dit færdige produkt leveres til døren inden for 5-7 hverdage." }, en: { title: "Delivery", desc: "Your finished product is delivered to your door within 5-7 business days." } },
    ],
  },
  testimonials: {
    title: { da: "Hvad vores kunder siger", en: "What Our Customers Say" },
    items: [
      { name: "Maria Jensen", company: "EventPro ApS", da: "Fantastisk service og kvalitet. Trykeksperten leverede vores event t-shirts på rekordtid.", en: "Fantastic service and quality. Trykeksperten delivered our event t-shirts in record time." },
      { name: "Thomas Nielsen", company: "Nordic Tech A/S", da: "Vi har brugt Trykeksperten til alt vores firmatøj i over 2 år. Altid tilfredse.", en: "We've used Trykeksperten for all our corporate wear for over 2 years. Always satisfied." },
      { name: "Louise Andersen", company: "GreenWave Marketing", da: "Professionelt, hurtigt og altid høj kvalitet. Kan varmt anbefales.", en: "Professional, fast and always high quality. Highly recommended." },
    ],
  },
  cta: {
    title: { da: "Klar til at komme i gang?", en: "Ready to Get Started?" },
    desc: { da: "Upload dit design og modtag et uforpligtende tilbud.", en: "Upload your design and receive a no-obligation quote." },
    btn: { da: "Upload dit design", en: "Upload Your Design" },
  },
  footer: {
    contact: { da: "Kontakt", en: "Contact" },
    navigation: { da: "Navigation", en: "Navigation" },
    followUs: { da: "Følg os", en: "Follow Us" },
    rights: { da: "Alle rettigheder forbeholdes.", en: "All rights reserved." },
    address: "Trykeksperten\nDanmark",
    phone: "+45 XX XX XX XX",
    email: "kontakt@trykeksperten.dk",
  },
  textilePage: {
    title: { da: "Tekstiltryk", en: "Textile Printing" },
    subtitle: { da: "Professionelt tryk på alle typer tekstil", en: "Professional printing on all types of textiles" },
    products: {
      title: { da: "Hvilke produkter kan trykkes", en: "What Products Can Be Printed" },
      items: [
        { da: "T-shirts", en: "T-shirts" },
        { da: "Hoodies", en: "Hoodies" },
        { da: "Arbejdstøj", en: "Workwear" },
        { da: "Merchandise", en: "Merchandise" },
        { da: "Firmatøj", en: "Corporate Wear" },
      ],
    },
    placements: {
      title: { da: "Placeringer af tryk", en: "Print Placements" },
      items: [
        { da: "Hel front", en: "Full Front" },
        { da: "Hel ryg", en: "Full Back" },
        { da: "Venstre ærme", en: "Left Sleeve" },
        { da: "Højre ærme", en: "Right Sleeve" },
        { da: "Lille brysttryk", en: "Small Chest Print" },
        { da: "Lille tryk bagpå", en: "Small Back Print" },
      ],
    },
    minimum: {
      title: { da: "Minimumsantal", en: "Minimum Quantity" },
      desc: { da: "Minimum 10 stk. per ordre.", en: "Minimum 10 pcs per order." },
    },
    delivery: {
      title: { da: "Leveringstid", en: "Delivery Time" },
      desc: { da: "5-7 hverdage efter godkendelse af design.", en: "5-7 business days after design approval." },
    },
  },
  largeFormatPage: {
    title: { da: "Storformatprint", en: "Large Format Print" },
    subtitle: { da: "Professionelle printløsninger i stort format", en: "Professional large format print solutions" },
    items: [
      { da: { title: "Bannere", desc: "Holdbare bannere til indendørs og udendørs brug." }, en: { title: "Banners", desc: "Durable banners for indoor and outdoor use." } },
      { da: { title: "Roll-ups", desc: "Portable roll-up displays til messer og events." }, en: { title: "Roll-ups", desc: "Portable roll-up displays for trade shows and events." } },
      { da: { title: "Plakater", desc: "Højtopløselige plakater i alle størrelser." }, en: { title: "Posters", desc: "High-resolution posters in all sizes." } },
      { da: { title: "Skilte", desc: "Professionelle skilte til din virksomhed." }, en: { title: "Signs", desc: "Professional signs for your business." } },
      { da: { title: "Messemateriale", desc: "Alt til din næste messe eller event." }, en: { title: "Trade Show Materials", desc: "Everything for your next trade show or event." } },
    ],
  },
  productsPage: {
    title: { da: "Produkter", en: "Products" },
    subtitle: { da: "Udforsk vores udvalg af kvalitetsprodukter", en: "Explore our selection of quality products" },
    designBtn: { da: "Design og få tilbud", en: "Design and Get Quote" },
    sizes: { da: "Størrelser", en: "Sizes" },
    colors: { da: "Farver", en: "Colors" },
  },
  designPage: {
    title: { da: "Upload design & Få tilbud", en: "Upload Design & Get Quote" },
    subtitle: { da: "Upload dit design, vælg placering og modtag et tilbud", en: "Upload your design, choose placement and receive a quote" },
    mockupTitle: { da: "Design forhåndsvisning", en: "Design Preview" },
    uploadFile: { da: "Upload dit design (PNG, SVG, AI)", en: "Upload your design (PNG, SVG, AI)" },
    placement: { da: "Vælg placering", en: "Choose Placement" },
    formTitle: { da: "Dine oplysninger", en: "Your Information" },
    name: { da: "Navn", en: "Name" },
    company: { da: "Virksomhed", en: "Company" },
    address: { da: "Adresse", en: "Address" },
    email: { da: "Email", en: "Email" },
    phone: { da: "Telefon", en: "Phone" },
    product: { da: "Produkt", en: "Product" },
    quantity: { da: "Antal", en: "Quantity" },
    notes: { da: "Bemærkninger", en: "Notes" },
    fileUpload: { da: "Design filer", en: "Design Files" },
    submit: { da: "Send forespørgsel", en: "Submit Request" },
    success: { da: "Tak for din forespørgsel. Vi vender tilbage hurtigst muligt.", en: "Thank you for your inquiry. We will get back to you as soon as possible." },
    estimatedPrice: { da: "Estimeret pris", en: "Estimated Price" },
    dragHint: { da: "Træk og tilpas dit design på t-shirten", en: "Drag and adjust your design on the t-shirt" },
  },
  contactPage: {
    title: { da: "Kontakt os", en: "Contact Us" },
    subtitle: { da: "Vi er klar til at hjælpe dig", en: "We're ready to help you" },
    name: { da: "Navn", en: "Name" },
    email: { da: "Email", en: "Email" },
    phone: { da: "Telefon", en: "Phone" },
    message: { da: "Besked", en: "Message" },
    send: { da: "Send besked", en: "Send Message" },
    success: { da: "Tak for din besked. Vi vender tilbage hurtigst muligt.", en: "Thank you for your message. We'll get back to you soon." },
    info: { da: "Kontaktoplysninger", en: "Contact Information" },
  },
  placements: {
    fullFront: { da: "Hel front", en: "Full Front" },
    fullBack: { da: "Hel ryg", en: "Full Back" },
    leftSleeve: { da: "Venstre ærme", en: "Left Sleeve" },
    rightSleeve: { da: "Højre ærme", en: "Right Sleeve" },
    smallChest: { da: "Lille brysttryk", en: "Small Chest Print" },
    smallBack: { da: "Lille tryk bagpå", en: "Small Back Print" },
  },
} as const;

export type TranslationKey = keyof typeof translations;
