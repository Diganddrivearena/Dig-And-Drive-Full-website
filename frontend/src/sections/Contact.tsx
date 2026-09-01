import { Phone, Mail, MapPin } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { SITE, waLink } from "@/lib/site";

export function Contact() {
  return (
    <section id="contact" className="section-pad bg-brand-gray">
      <div className="container-x">
        <div className="mb-10 text-center">
          <span className="chip">Get in touch</span>
          <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">Visit the arena.</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-8">
            <h3 className="font-display text-2xl text-brand-black">DIG & DRIVE ARENA</h3>
            <p className="mt-2 text-muted-foreground">Pop in to test drive, or order on WhatsApp from anywhere in India.</p>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-yellow text-brand-black"><MapPin className="h-5 w-5" /></span>
                <div><div className="font-semibold text-brand-black">Store address</div><div className="text-muted-foreground">{SITE.address}</div></div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-yellow text-brand-black"><Phone className="h-5 w-5" /></span>
                <div><div className="font-semibold text-brand-black">Phone</div><a href={`tel:${SITE.phoneRaw}`} className="text-muted-foreground hover:text-brand-orange">{SITE.phone}</a></div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-whatsapp text-white"><WhatsAppIcon className="h-6 w-6" /></span>
                <div>
                  <div className="font-semibold text-brand-black">WhatsApp</div>
                  <a href={waLink("Hello DIG & DRIVE ARENA")} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand-orange">{SITE.phone}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-orange text-white"><Mail className="h-5 w-5" /></span>
                <div><div className="font-semibold text-brand-black">Email</div><a href={`mailto:${SITE.email}`} className="text-muted-foreground hover:text-brand-orange">{SITE.email}</a></div>
              </li>
            </ul>

            <a href={waLink("Hello DIG & DRIVE ARENA, I'd like to place an order.")} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-8 w-full">
              <WhatsAppIcon className="h-6 w-6" /> Start a WhatsApp chat
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <iframe
              title="DIG & DRIVE ARENA location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3804.137101194968!2d78.37155560000001!3d17.54865805!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb8dc55d38f3f3%3A0xb87c96f56a1d9e4a!2sAPR%20PRANAV%20ANTILIA%2C%20Bachupally%2C%20Hyderabad%2C%20Telangana%20500118!5e0!3m2!1sen!2sin!4v1781764584669!5m2!1sen!2sin"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[400px] w-full border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
