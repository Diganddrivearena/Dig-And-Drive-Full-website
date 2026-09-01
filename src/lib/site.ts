export const SITE = {
  name: "DIG & DRIVE ARENA",
  tagline: "India’s Ultimate RC Adventure Destination",
  phone: "+91 9703455666",
  phoneRaw: "+919703455666",
  whatsapp: "919703455666",
  email: "digdrivearena@gmail.com",
  address: "Shop 29, APR Praneeth Antilia, Bachupally, Hyderabad",
  location: "Hyderabad, India",
  url: "https://diganddrive.in",
};

export function waLink(message: string) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function productWaMessage(name: string, price: number) {
  return `Hello DIG & DRIVE ARENA,\n\nI would like to order:\n\nProduct: ${name}\nPrice: ₹${price.toLocaleString("en-IN")}\n\nPlease share availability.`;
}
