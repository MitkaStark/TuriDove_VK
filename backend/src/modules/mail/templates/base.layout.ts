export interface LayoutContent {
  title: string;
  preheader?: string;
  heading: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaText?: string;
  footerText?: string;
}

const NAVY_800 = '#10213A';
const NAVY_600 = '#1A365D';
const NAVY_400 = '#4A6FA3';
const GOLD_500 = '#C49A3D';
const CREAM    = '#FEFBF4';
const WHITE    = '#FFFFFF';

export function renderBaseLayout(c: LayoutContent): string {
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(c.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};font-family:Georgia,serif;color:${NAVY_600};">
${c.preheader ? `<div style="display:none;font-size:1px;color:${CREAM};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(c.preheader)}</div>` : ''}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${CREAM};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:${WHITE};border-radius:16px;overflow:hidden;">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #E0E5EF;text-align:center;">
        <div style="font-size:10px;letter-spacing:2px;color:${NAVY_400};text-transform:uppercase;">VIAJES</div>
        <div style="font-size:20px;font-weight:bold;color:${NAVY_800};margin-top:4px;">TuriDove</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:24px;color:${NAVY_800};font-weight:bold;">${escapeHtml(c.heading)}</h1>
        <div style="font-size:15px;line-height:1.6;color:${NAVY_600};font-family:Arial,sans-serif;">${c.bodyHtml}</div>
        ${c.ctaUrl && c.ctaText ? `<div style="text-align:center;margin:32px 0 8px;"><a href="${escapeAttr(c.ctaUrl)}" style="display:inline-block;background:${GOLD_500};color:${WHITE};text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(c.ctaText)}</a></div>` : ''}
      </td></tr>
      <tr><td style="padding:20px 32px;background-color:${NAVY_800};color:#A3B5D1;text-align:center;font-size:12px;font-family:Arial,sans-serif;">
        ${c.footerText ? `<p style="margin:0 0 8px;">${escapeHtml(c.footerText)}</p>` : ''}
        <p style="margin:0;">© ${new Date().getFullYear()} TuriDove · Todos los derechos reservados</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
