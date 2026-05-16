// Enum value lists + human-friendly labels for BusinessProfile form selects.
// Kept here (not in shared-types) because these are UX strings — the enum
// values themselves remain in shared-types. Phase 2.4d may move these to
// a translations file; for now plain strings.

export const DOMAIN_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'gym_fitness', label: 'Gym / Fitness' },
  { value: 'yoga_wellness', label: 'Yoga / Wellness' },
  { value: 'dental_clinic', label: 'Dental clinic' },
  { value: 'medical_clinic', label: 'Medical clinic' },
  { value: 'restaurant_cafe', label: 'Restaurant / Café' },
  { value: 'ecommerce_fashion', label: 'Ecommerce — Fashion' },
  { value: 'ecommerce_general', label: 'Ecommerce — General' },
  { value: 'it_services', label: 'IT services' },
  { value: 'saas_product', label: 'SaaS product' },
  { value: 'law_firm', label: 'Law firm' },
  { value: 'real_estate', label: 'Real estate' },
  { value: 'construction', label: 'Construction' },
  { value: 'education_tutoring', label: 'Education / Tutoring' },
  { value: 'salon_spa', label: 'Salon / Spa' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'creative_agency', label: 'Creative agency' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

export const PRICE_POINT_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid', label: 'Mid' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' },
];
