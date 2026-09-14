export interface ModelVariableDef {
  key: string;
  label: string;
  category: 'Property' | 'Customer' | 'Invoice' | 'Lead' | 'Agency';
  type: 'string' | 'number' | 'date' | 'array' | 'object' | 'image' | '3d_model';
  example: string;
  loopSyntax?: string;
  description: string;
}

export function getModelVariables(): ModelVariableDef[] {
  return [
    // --- PROPERTY VARIABLES ---
    {
      key: 'property.title',
      label: 'Property Title',
      category: 'Property',
      type: 'string',
      example: 'The Royal Penthouse Suite',
      description: 'The primary headline of the listing',
    },
    {
      key: 'property.price',
      label: 'Property Price',
      category: 'Property',
      type: 'number',
      example: '1,850,000',
      description: 'Formatted property price in target currency',
    },
    {
      key: 'property.currency',
      label: 'Currency',
      category: 'Property',
      type: 'string',
      example: 'USD',
      description: 'Currency code',
    },
    {
      key: 'property.location.city',
      label: 'City',
      category: 'Property',
      type: 'string',
      example: 'Islamabad',
      description: 'City where property is situated',
    },
    {
      key: 'property.location.address',
      label: 'Full Address',
      category: 'Property',
      type: 'string',
      example: 'Sector F-7/2, Hill View Lane',
      description: 'Detailed physical address',
    },
    {
      key: 'property.specs.bedrooms',
      label: 'Bedrooms',
      category: 'Property',
      type: 'number',
      example: '4',
      description: 'Number of bedrooms',
    },
    {
      key: 'property.specs.bathrooms',
      label: 'Bathrooms',
      category: 'Property',
      type: 'number',
      example: '5',
      description: 'Number of bathrooms',
    },
    {
      key: 'property.specs.areaSqFt',
      label: 'Area (Sq Ft)',
      category: 'Property',
      type: 'number',
      example: '4,500',
      description: 'Total covered area in sq ft',
    },
    {
      key: 'property.amenities',
      label: 'Amenities List (Array)',
      category: 'Property',
      type: 'array',
      example: '["Swimming Pool", "Smart Automation", "Panoramic Balcony"]',
      loopSyntax: '{{#each property.amenities}}<li>{{this}}</li>{{/each}}',
      description: 'Array of property amenities for repeating lists/cards',
    },
    {
      key: 'property.model3dUrl',
      label: 'PlayCanvas 3D Model URL',
      category: 'Property',
      type: '3d_model',
      example: 'https://cdn.domain.com/models/villa.glb',
      description: 'URL to interactive 3D GLB file',
    },

    // --- CUSTOMER VARIABLES ---
    {
      key: 'customer.fullName',
      label: 'Customer Full Name',
      category: 'Customer',
      type: 'string',
      example: 'Sheikh Muhammad Farooq',
      description: 'Full name of the verified client',
    },
    {
      key: 'customer.email',
      label: 'Customer Email',
      category: 'Customer',
      type: 'string',
      example: 'client@domain.com',
      description: 'Primary customer email address',
    },
    {
      key: 'customer.phone',
      label: 'Customer Phone',
      category: 'Customer',
      type: 'string',
      example: '+92 300 1234567',
      description: 'WhatsApp or direct calling phone',
    },

    // --- INVOICE VARIABLES ---
    {
      key: 'invoice.invoiceNumber',
      label: 'Invoice Number',
      category: 'Invoice',
      type: 'string',
      example: 'INV-2026-8801',
      description: 'Unique sequential invoice reference',
    },
    {
      key: 'invoice.amount',
      label: 'Invoice Total Amount',
      category: 'Invoice',
      type: 'number',
      example: '250,000',
      description: 'Gross invoice balance due',
    },
    {
      key: 'invoice.dueDate',
      label: 'Due Date',
      category: 'Invoice',
      type: 'date',
      example: 'October 15, 2026',
      description: 'Payment milestone due date',
    },
    {
      key: 'invoice.milestones',
      label: 'Payment Milestones (Array)',
      category: 'Invoice',
      type: 'array',
      example: '[{ "name": "Down Payment", "amount": 50000, "isPaid": true }]',
      loopSyntax:
        '{{#each invoice.milestones}}<tr><td>{{this.name}}</td><td>${{this.amount}}</td></tr>{{/each}}',
      description: 'Array of installment breakdown rows for tables',
    },

    // --- AGENCY / COMPANY VARIABLES ---
    {
      key: 'agency.name',
      label: 'Agency Name',
      category: 'Agency',
      type: 'string',
      example: 'Aura Heights Real Estate Ltd.',
      description: 'Platform branding name',
    },
    {
      key: 'agency.supportPhone',
      label: 'Support Phone',
      category: 'Agency',
      type: 'string',
      example: '+92 51 9876543',
      description: 'Official WhatsApp / phone contact',
    },
  ];
}
