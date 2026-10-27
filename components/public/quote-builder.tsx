"use client";

import { useMemo, useState } from "react";
import { customQuoteServices, kitPresets, packageOptions, quoteItems, quoteOnlyCrew, quoteOnlyEquipment } from "@/features/services/package-options";
import { CONTACT_WHATSAPP_NUMBER } from "@/features/content/contact";

const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
export default function QuoteBuilder() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [days, setDays] = useState(1);
  const [eventType, setEventType] = useState<"small" | "large">("small");
  const [hours, setHours] = useState(5);
  const [smallFee, setSmallFee] = useState(150_000);
  const [production, setProduction] = useState(true);
  const [fullProduction, setFullProduction] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const visibleEquipment = quoteItems.filter((item) => item.group === "Equipment" && item.name.toLowerCase().includes(search.toLowerCase()));
  const visibleCrew = quoteItems.filter((item) => item.group === "Crew" && item.name.toLowerCase().includes(search.toLowerCase()));
  const visibleQuoteOnlyEquipment = quoteOnlyEquipment.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const visibleQuoteOnlyCrew = quoteOnlyCrew.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const visibleCustomQuoteServices = customQuoteServices.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const selected = quoteItems.filter((item) => (quantities[item.id] ?? 0) > 0);
  const selectedEquipment = selected.filter((item) => item.group === "Equipment");
  const selectedCrew = selected.filter((item) => item.group === "Crew");
  const itemSubtotal = selected.reduce((sum, item) => sum + item.rate * quantities[item.id] * (item.unit === "day" ? days : 1), 0);
  const productionFee = production ? (eventType === "large" ? hours * 100_000 : smallFee) : 0;
  const subtotal = itemSubtotal + productionFee;
  const useFullRules = fullProduction && production;
  const eventCredit = useFullRules && subtotal > 0 ? 15_000 : 0;
  const bookingDiscount = useFullRules && subtotal > 4_000_000 ? 100_000 : 0;
  const beforeMinimum = Math.max(0, subtotal - eventCredit - bookingDiscount);
  const minimumAdjustment = useFullRules && beforeMinimum > 0 && beforeMinimum < 300_000 ? 300_000 - beforeMinimum : 0;
  const total = beforeMinimum + minimumAdjustment;
  const estimateLines = [
    ...selected.map((item) => `${quantities[item.id]} × ${item.name}${item.unit === "day" ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}: ${money(item.rate * quantities[item.id] * (item.unit === "day" ? days : 1))}`),
    ...(production ? [`Production fee: ${money(productionFee)}`] : []),
  ];
  const estimateScope = [...estimateLines, `Subtotal: ${money(subtotal)}`, ...(eventCredit ? [`Event equipment credit: −${money(eventCredit)}`] : []), ...(bookingDiscount ? [`Large booking discount: −${money(bookingDiscount)}`] : []), ...(minimumAdjustment ? [`Full production minimum adjustment: +${money(minimumAdjustment)}`] : []), `Estimated total: ${money(total)}`].join("\n").slice(0, 2400);
  const whatsappMessage = `Hello D-Team, I built this planning estimate on your website.\n\n${estimateScope}\n\nPlease confirm the final availability and quotation.`;
  const whatsappUrl = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const setQuantity = (id: string, amount: number) => setQuantities((old) => ({ ...old, [id]: Math.max(0, Math.min(99, amount || 0)) }));
  const applyKit = (kitId: string) => {
    const preset = kitPresets[kitId];
    setQuantities((old) => Object.fromEntries(Object.entries({ ...old, ...Object.fromEntries(Object.entries(preset).map(([id, count]) => [id, (old[id] ?? 0) + count])) })));
  };
  const cartCount = useMemo(() => selected.reduce((sum, item) => sum + quantities[item.id], 0), [selected, quantities]);
  const renderRows = (items: typeof quoteItems) => items.map((item) => <article className="quote-item" key={item.id}><div><span>{item.unit === "included" ? "Included" : `Per ${item.unit}`}</span><strong>{item.name}</strong><small>{item.rate ? `${money(item.rate)}${item.unit === "day" ? " / day" : ` / ${item.unit}`}` : item.includedWith}</small></div><div className="quote-stepper"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => setQuantity(item.id, (quantities[item.id] ?? 0) - 1)}>−</button><input aria-label={`${item.name} quantity`} type="number" min="0" max="99" value={quantities[item.id] ?? 0} onChange={(e) => setQuantity(item.id, Number(e.target.value))} /><button type="button" aria-label={`Add one ${item.name}`} onClick={() => setQuantity(item.id, (quantities[item.id] ?? 0) + 1)}>+</button></div></article>);
  const renderWhatsAppRequests = (items: readonly { id: string; name: string; detail: string }[]) => items.map((service) => { const message = `Hello D-Team, please quote for: ${service.name}. My project details are: `; return <article key={service.id}><div><strong>{service.name}</strong><small>{service.detail}</small></div><a href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Ask for price ↗</a></article>; });

  return <section className="quote-builder section-wrap" id="budget-builder" aria-labelledby="quote-builder-title">
    <div className="quote-builder-intro"><p className="eyebrow">MAKE YOUR OWN BUDGET · LIVE ESTIMATE</p><h2 id="quote-builder-title">Build your<br /><em>production list.</em></h2><p>Add equipment and crew like a shopping list. Change quantities, set the duration, and see your estimate update instantly.</p>
      <div className="quote-kit-presets"><span>ADD A COMPLETE KIT TO YOUR EQUIPMENT LIST</span><p>Kit price is the total for its equipment per day. Selecting one adds only its equipment below; it does not add a second bundle charge or crew.</p>{packageOptions.map((kit) => <button type="button" key={kit.id} onClick={() => applyKit(kit.id)}><strong>{kit.name}</strong><small>{money(kit.rateAmount)} total per equipment day · add equipment only</small></button>)}</div>
    </div>
    <div className="quote-builder-workspace">
      <div className="quote-catalog">
        <div className="quote-controls">
          <label>Search items<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Camera, tripod, crew…" /></label>
          <label>Days for equipment and daily crew<input type="number" min="1" max="99" value={days} onChange={(e) => setDays(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} /></label>
        </div>
        <section className="quote-item-section" aria-labelledby="quote-equipment-title"><header><div><p className="eyebrow">EQUIPMENT · SELECT INDIVIDUALLY</p><h3 id="quote-equipment-title">Equipment</h3></div><span>{visibleEquipment.length} items listed</span></header><div className="quote-item-list">{renderRows(visibleEquipment)}{visibleEquipment.length === 0 && <p className="quote-empty">No equipment matches your search.</p>}</div>{visibleQuoteOnlyEquipment.length > 0 && <div className="quote-request-list quote-no-price"><h4>Equipment quoted to your event</h4><p>These items have no fixed rate. Ask for a price on WhatsApp.</p>{renderWhatsAppRequests(visibleQuoteOnlyEquipment)}</div>}</section>
        <section className="quote-item-section" aria-labelledby="quote-crew-title"><header><div><p className="eyebrow">CREW · SELECT INDIVIDUALLY</p><h3 id="quote-crew-title">Crew</h3></div><span>{visibleCrew.length} crew entries</span></header><div className="quote-item-list">{renderRows(visibleCrew)}{visibleCrew.length === 0 && <p className="quote-empty">No crew rates match your search.</p>}</div>{visibleQuoteOnlyCrew.length > 0 && <div className="quote-request-list quote-no-price"><h4>Crew quoted per job</h4><p>These crew rates aren’t fixed. Message D-Team to confirm their availability and price.</p>{renderWhatsAppRequests(visibleQuoteOnlyCrew)}</div>}<p className="quote-section-note">Daily crew uses the daily duration above. Monthly and per-video rates use their own units.</p></section>
        <section className="quote-item-section quote-request-section" aria-labelledby="quote-request-title"><header><div><p className="eyebrow">CUSTOM SERVICES · NO FIXED PRICE</p><h3 id="quote-request-title">Request a custom quote</h3></div><span>{visibleCustomQuoteServices.length} services</span></header><p className="quote-section-note">Printing, flagship productions, and specialist projects are priced to the brief.</p><div className="quote-request-list">{renderWhatsAppRequests(visibleCustomQuoteServices)}{visibleCustomQuoteServices.length === 0 && <p className="quote-empty">No custom services match your search.</p>}</div></section>
      </div>
      <aside className="quote-cart" aria-live="polite"><div className="quote-cart-head"><div><span>YOUR BUDGET</span><h3>Estimate <i>({cartCount})</i></h3></div><button type="button" onClick={() => setQuantities({})}>Clear</button></div>
        <div className="quote-cart-options"><label>Event production<select value={production ? "yes" : "no"} onChange={(e) => setProduction(e.target.value === "yes")}><option value="yes">Include production fee</option><option value="no">No production fee</option></select></label>{production && <><label>Event size<select value={eventType} onChange={(e) => setEventType(e.target.value as "small" | "large")}><option value="small">Small event · up to about 5 hours</option><option value="large">Large event · per hour</option></select></label>{eventType === "small" ? <label>Production fee<select value={smallFee} onChange={(e) => setSmallFee(Number(e.target.value))}><option value={100_000}>₦100,000</option><option value={150_000}>₦150,000</option><option value={200_000}>₦200,000</option></select></label> : <label>Event hours<input type="number" min="1" max="24" value={hours} onChange={(e) => setHours(Math.max(1, Math.min(24, Number(e.target.value) || 1)))} /></label>}</>}</div>
        <label className="quote-full-production"><input type="checkbox" checked={fullProduction} onChange={(e) => setFullProduction(e.target.checked)} /> Apply full production rules (₦300,000 minimum, event credit, and eligible booking discount)</label>
        <div className="quote-cart-lines">
          {selectedEquipment.length > 0 && <section><h4>Equipment</h4>{selectedEquipment.map((item) => <div key={item.id}><span>{quantities[item.id]} × {item.name}{item.unit === "day" ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}</span><strong>{money(item.rate * quantities[item.id] * (item.unit === "day" ? days : 1))}</strong><button type="button" aria-label={`Remove ${item.name}`} onClick={() => setQuantity(item.id, 0)}>×</button></div>)}</section>}
          {selectedCrew.length > 0 && <section><h4>Crew</h4>{selectedCrew.map((item) => <div key={item.id}><span>{quantities[item.id]} × {item.name}{item.unit === "day" ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}</span><strong>{money(item.rate * quantities[item.id] * (item.unit === "day" ? days : 1))}</strong><button type="button" aria-label={`Remove ${item.name}`} onClick={() => setQuantity(item.id, 0)}>×</button></div>)}</section>}
          {production && <section><h4>Production</h4><div><span>Production fee</span><strong>{money(productionFee)}</strong></div></section>}
          {cartCount === 0 && !production && <p>Your list is empty. Add equipment or crew to start an estimate.</p>}
        </div>
        <div className="quote-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{eventCredit > 0 && <div><span>Event equipment credit</span><strong>−{money(eventCredit)}</strong></div>}{bookingDiscount > 0 && <div><span>₦100,000 large booking discount</span><strong>−{money(bookingDiscount)}</strong></div>}{minimumAdjustment > 0 && <div><span>Full production minimum adjustment</span><strong>+{money(minimumAdjustment)}</strong></div>}<div className="quote-grand-total"><span>Estimated total</span><strong>{money(total)}</strong></div></div>
        <p className="quote-cart-note">Planning estimate only. Transport and negotiated extras are confirmed in your final quote. Event credit reflects one sound card and two HDMI cables included.</p><a className="contact-button" href={whatsappUrl} target="_blank" rel="noreferrer">Send this list to D-Team <span aria-hidden="true">↗</span></a><button type="button" className="quote-copy-button" onClick={async () => { try { await navigator.clipboard.writeText(whatsappMessage); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { setCopied(false); } }}>{copied ? "Estimate copied" : "Copy estimate details"}</button>
      </aside>
    </div>
  </section>;
}
