import { renderBaseLayout, LayoutContent } from './base.layout';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderEmail(subject: string, layout: LayoutContent, plainText: string): RenderedEmail {
  return {
    subject,
    html: renderBaseLayout(layout),
    text: plainText,
  };
}
