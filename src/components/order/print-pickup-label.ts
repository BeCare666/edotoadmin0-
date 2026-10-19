// Étiquette colis (19/10/2026) : imprimée automatiquement quand le super admin traite une commande,
// pour être collée sur le colis. Contenu : numéro de commande, code de retrait, client, point de retrait,
// nombre d'articles. Impression par un cadre caché (pas de fenêtre surgissante bloquée par le navigateur).

export type PickupLabelData = {
  tracking_number: string;
  otp_code?: string | null;
  otp_expires_at?: string | null;
  customer_name?: string | null;
  customer_contact?: string | null;
  pickup_point_name?: string | null;
  home_delivery?: boolean;
  items_count?: number;
  campaign_title?: string | null;
  processed_at?: string | null;
};

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const benin = (iso?: string | null, withTime = true) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        timeZone: 'Africa/Porto-Novo',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '';

export function pickupLabelHtml(d: PickupLabelData) {
  const code = d.otp_code ? esc(d.otp_code) : '';
  const where = d.home_delivery ? 'Livraison à domicile' : d.pickup_point_name ? esc(d.pickup_point_name) : 'Point de retrait non choisi';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Étiquette ${esc(d.tracking_number)}</title>
<style>
  @page { size: 100mm 70mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100mm; height: 70mm; }
  body { font-family: Poppins, Arial, Helvetica, sans-serif; color: #1A1814; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .label { width: 100mm; height: 70mm; padding: 4mm 5mm; display: flex; flex-direction: column; border: 0.3mm solid #1A1814; }
  .top { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.3mm solid #1A1814; padding-bottom: 2mm; }
  .brand { font-size: 11pt; font-weight: 600; letter-spacing: 0.02em; }
  .ref { font-size: 9pt; font-family: 'Courier New', monospace; }
  .codebox { margin: 3mm 0 2mm; text-align: center; }
  .cap { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.18em; color: #57524B; }
  .code { font-family: 'Courier New', monospace; font-size: 30pt; font-weight: 700; letter-spacing: 0.22em; line-height: 1.15; }
  .nocode { font-size: 11pt; padding: 3mm 0; }
  .rows { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm 4mm; font-size: 8pt; }
  .rows b { display: block; font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.12em; color: #57524B; font-weight: 500; }
  .rows span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .foot { margin-top: 2mm; font-size: 6.5pt; color: #57524B; text-align: center; }
</style></head><body>
<div class="label">
  <div class="top"><span class="brand">E.doto family</span><span class="ref">${esc(d.tracking_number)}</span></div>
  <div class="codebox">
    <div class="cap">Code de retrait</div>
    ${code ? `<div class="code">${code}</div>` : '<div class="nocode">Code non généré</div>'}
  </div>
  <div class="rows">
    <div><b>Client</b><span>${esc(d.customer_name || 'Non renseigné')}</span></div>
    <div><b>Contact</b><span>${esc(d.customer_contact || 'Non renseigné')}</span></div>
    <div><b>Retrait</b><span>${where}</span></div>
    <div><b>Articles</b><span>${d.items_count ?? 0}</span></div>
    ${d.campaign_title ? `<div><b>Campagne</b><span>${esc(d.campaign_title)}</span></div>` : ''}
    <div><b>Traitée le</b><span>${esc(benin(d.processed_at || new Date().toISOString()))}</span></div>
  </div>
  ${d.otp_expires_at ? `<div class="foot">Code valable jusqu'au ${esc(benin(d.otp_expires_at, false))}</div>` : ''}
</div>
</body></html>`;
}

/** Imprime l'étiquette ; résout quand la boîte d'impression est ouverte (ou en cas d'échec). */
export function printPickupLabel(d: PickupLabelData): Promise<void> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) {
      frame.remove();
      resolve();
      return;
    }
    doc.open();
    doc.write(pickupLabelHtml(d));
    doc.close();
    const go = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } finally {
        // Retrait du cadre après la fermeture de la boîte d'impression
        setTimeout(() => frame.remove(), 60_000);
        resolve();
      }
    };
    // Laisse le temps au navigateur de mettre en page l'étiquette
    setTimeout(go, 250);
  });
}
