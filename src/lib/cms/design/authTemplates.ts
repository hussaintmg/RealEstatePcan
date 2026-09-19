export interface AuthPageTemplate {
  key: string;
  name: string;
  type: 'login' | 'forgot_password' | 'otp' | 'reset_password' | 'invitation';
  layout: 'split_screen' | 'centered_card' | 'full_background' | 'minimal_inline' | 'luxury_curtain';
  showBrandLogo: boolean;
  showBackdropImage: boolean;
  backdropImageUrl?: string;
  cardRadius: string;
  hasTestimonial?: boolean;
  description: string;
}

export const AUTH_PAGE_TEMPLATES: AuthPageTemplate[] = [
  // Login Templates
  {
    key: 'auth-login-split-luxury',
    name: 'Luxury Architectural Split Screen',
    type: 'login',
    layout: 'split_screen',
    showBrandLogo: true,
    showBackdropImage: true,
    backdropImageUrl: '/images/luxury_penthouse_night.jpg',
    cardRadius: 'var(--radius-lg)',
    hasTestimonial: true,
    description: '50% photography showcase on left with client/staff authentication card on right.',
  },
  {
    key: 'auth-login-centered-card',
    name: 'Centered Floating Glass Card',
    type: 'login',
    layout: 'centered_card',
    showBrandLogo: true,
    showBackdropImage: false,
    cardRadius: 'var(--radius-lg)',
    hasTestimonial: false,
    description: 'Centered frosted glass panel with glowing borders over dark background.',
  },
  {
    key: 'auth-login-minimal-stark',
    name: 'Minimal Stark Broadside',
    type: 'login',
    layout: 'minimal_inline',
    showBrandLogo: true,
    showBackdropImage: false,
    cardRadius: '0px',
    hasTestimonial: false,
    description: 'Distraction-free black and white login focused on speed and high security.',
  },

  // Forgot Password Templates
  {
    key: 'auth-forgot-centered',
    name: 'Centered Password Recovery Card',
    type: 'forgot_password',
    layout: 'centered_card',
    showBrandLogo: true,
    showBackdropImage: false,
    cardRadius: 'var(--radius-lg)',
    description: 'Secure email verification dispatch card with spam folder hint.',
  },
  {
    key: 'auth-forgot-split',
    name: 'Split Panel Recovery Screen',
    type: 'forgot_password',
    layout: 'split_screen',
    showBrandLogo: true,
    showBackdropImage: true,
    backdropImageUrl: '/images/architectural_exterior.jpg',
    cardRadius: 'var(--radius-lg)',
    description: 'Split screen presenting concierge assistance phone line alongside reset form.',
  },

  // OTP Verification Templates
  {
    key: 'auth-otp-centered-six-box',
    name: 'Six-Box Security Verification Code',
    type: 'otp',
    layout: 'centered_card',
    showBrandLogo: true,
    showBackdropImage: false,
    cardRadius: 'var(--radius-lg)',
    description: 'Features high-entropy 6-box input with auto-advance and countdown resend timer.',
  },

  // Reset Password Templates
  {
    key: 'auth-reset-secure-card',
    name: 'Token-Validated Reset Password Card',
    type: 'reset_password',
    layout: 'centered_card',
    showBrandLogo: true,
    showBackdropImage: false,
    cardRadius: 'var(--radius-lg)',
    description: 'Password confirmation and real-time entropy strength meter.',
  },

  // Invitation Acceptance Templates
  {
    key: 'auth-invite-vip-welcome',
    name: 'VIP Private Client Portal Welcome',
    type: 'invitation',
    layout: 'split_screen',
    showBrandLogo: true,
    showBackdropImage: true,
    backdropImageUrl: '/images/penthouse_pool_sunset.jpg',
    cardRadius: 'var(--radius-lg)',
    description: 'Custom portal activation flow for verified buyers and deal participants.',
  },
];

export function getAuthTemplateByKey(key: string): AuthPageTemplate {
  return AUTH_PAGE_TEMPLATES.find((t) => t.key === key) || AUTH_PAGE_TEMPLATES[0];
}
