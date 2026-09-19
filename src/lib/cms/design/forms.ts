export interface FormLayoutTemplate {
  key: string;
  name: string;
  layout: 'stacked' | 'two_column' | 'card_form' | 'underline_minimal' | 'floating_label' | 'luxury_modal';
  spacing: string;
  fieldRadius: string;
  labelPlacement: 'top' | 'floating' | 'inline' | 'none';
  submitButtonWidth: 'auto' | 'full';
  description: string;
}

export const FORM_LAYOUT_TEMPLATES: FormLayoutTemplate[] = [
  {
    key: 'form-stacked-standard',
    name: 'Standard Vertical Stacked Form',
    layout: 'stacked',
    spacing: '1.25rem',
    fieldRadius: 'var(--radius)',
    labelPlacement: 'top',
    submitButtonWidth: 'full',
    description: 'Clean vertical form with accessible top labels, helper hints, and full-width CTA.',
  },
  {
    key: 'form-two-column-grid',
    name: 'Two-Column Responsive Grid Form',
    layout: 'two_column',
    spacing: '1.5rem',
    fieldRadius: 'var(--radius)',
    labelPlacement: 'top',
    submitButtonWidth: 'auto',
    description: 'Side-by-side field columns on desktop collapsing gracefully to a single stack on mobile.',
  },
  {
    key: 'form-card-enclosed',
    name: 'Enclosed Card Form with Header',
    layout: 'card_form',
    spacing: '1.25rem',
    fieldRadius: 'var(--radius)',
    labelPlacement: 'top',
    submitButtonWidth: 'full',
    description: 'Contained inside an elevated card container with title, description, and security badges.',
  },
  {
    key: 'form-underline-minimal',
    name: 'Minimal Underline Architectural Form',
    layout: 'underline_minimal',
    spacing: '1.75rem',
    fieldRadius: '0px',
    labelPlacement: 'top',
    submitButtonWidth: 'auto',
    description: 'Zero-border input fields with subtle bottom underline, ideal for luxury inquiries.',
  },
  {
    key: 'form-floating-label',
    name: 'Material Floating Label Form',
    layout: 'floating_label',
    spacing: '1.25rem',
    fieldRadius: 'var(--radius)',
    labelPlacement: 'floating',
    submitButtonWidth: 'full',
    description: 'Labels smoothly elevate into the border line upon input focus or value presence.',
  },
  {
    key: 'form-luxury-modal',
    name: 'VIP Private Viewing Modal Form',
    layout: 'luxury_modal',
    spacing: '1.5rem',
    fieldRadius: 'var(--radius-lg)',
    labelPlacement: 'top',
    submitButtonWidth: 'full',
    description: 'Tailored specifically for penthouse private inspection appointments with date/time picker.',
  },
];

export function getFormLayoutByKey(key: string): FormLayoutTemplate {
  return FORM_LAYOUT_TEMPLATES.find((f) => f.key === key) || FORM_LAYOUT_TEMPLATES[0];
}
