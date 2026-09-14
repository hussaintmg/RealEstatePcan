import mongoose from 'mongoose';
import { Property } from '../../models/Property';
import { Customer } from '../../models/Customer';
import { Lead } from '../../models/Lead';
import { Invoice } from '../../models/Invoice';
import { User } from '../../models/User';
import { SystemConfig } from '../../models/SystemConfig';
import { CmsTheme } from '../../models/CmsTheme';

export interface DiscoveredVariable {
  key: string;
  label: string;
  model: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'image' | 'url';
  sampleValue: any;
  source: 'database' | 'settings' | 'session' | 'computed';
  description: string;
}

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /hash/i,
  /salt/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /key/i,
  /__v/,
  /_id/,
];

function isFieldSafe(path: string): boolean {
  return !SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(path));
}

function mapMongooseTypeToCmsType(
  instance: string,
  path: string
): 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'image' | 'url' {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes('image') || lowerPath.includes('photo') || lowerPath.includes('avatar') || lowerPath.includes('logo')) {
    return 'image';
  }
  if (lowerPath.includes('url') || lowerPath.includes('link')) {
    return 'url';
  }

  switch (instance) {
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'date';
    case 'Array':
      return 'array';
    case 'Embedded':
    case 'Mixed':
      return 'object';
    default:
      return 'string';
  }
}

function getSampleValue(type: string, path: string): any {
  const lower = path.toLowerCase();
  if (type === 'image') return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
  if (type === 'url') return 'https://auraheights.local/properties';
  if (type === 'number') {
    if (lower.includes('price') || lower.includes('amount') || lower.includes('budget')) return 1850000;
    if (lower.includes('bedroom')) return 4;
    if (lower.includes('bathroom')) return 5;
    if (lower.includes('area')) return 5200;
    return 100;
  }
  if (type === 'boolean') return true;
  if (type === 'date') return new Date().toISOString().split('T')[0];
  if (type === 'array') {
    if (lower.includes('amenities')) return ['Infinity Pool', '3D Walkthrough', 'Smart Home', 'Solar Grid'];
    if (lower.includes('images')) return ['https://domain.com/photo1.jpg', 'https://domain.com/photo2.jpg'];
    return ['Item 1', 'Item 2', 'Item 3'];
  }
  if (lower.includes('city')) return 'Islamabad';
  if (lower.includes('address')) return 'Margalla Hillside Avenue, Sector F-7';
  if (lower.includes('name') || lower.includes('title')) return 'Signature Architectural Villa';
  if (lower.includes('email')) return 'contact@auraheights.local';
  if (lower.includes('phone')) return '+92 (51) 880-9911';
  return 'Sample Content';
}

export function discoverModelVariables(): DiscoveredVariable[] {
  const variables: DiscoveredVariable[] = [];

  const modelsToInspect = [
    { name: 'Property', model: Property, category: 'Properties & Estates', prefix: 'property' },
    { name: 'Customer', model: Customer, category: 'VIP Clients', prefix: 'customer' },
    { name: 'Lead', model: Lead, category: 'Inquiries & Leads', prefix: 'lead' },
    { name: 'Invoice', model: Invoice, category: 'Financials & Invoices', prefix: 'invoice' },
    { name: 'User', model: User, category: 'User Profile & Staff', prefix: 'user' },
  ];

  for (const item of modelsToInspect) {
    if (!item.model || !item.model.schema) continue;
    const paths = item.model.schema.paths;

    for (const [pathKey, schemaType] of Object.entries(paths)) {
      if (!isFieldSafe(pathKey)) continue;

      const instance = (schemaType as any).instance || 'String';
      const cmsType = mapMongooseTypeToCmsType(instance, pathKey);
      const varKey = `${item.prefix}.${pathKey}`;

      variables.push({
        key: varKey,
        label: pathKey
          .split('.')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        model: item.name,
        category: item.category,
        type: cmsType,
        sampleValue: getSampleValue(cmsType, pathKey),
        source: 'database',
        description: `Dynamically introspected field from ${item.name} model (${pathKey})`,
      });
    }
  }

  // Add Brand & Settings variables
  const brandVariables: DiscoveredVariable[] = [
    {
      key: 'brand.companyName',
      label: 'Agency Company Name',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'string',
      sampleValue: 'Aura Heights Luxury Estates',
      source: 'settings',
      description: 'Official brokerage company title',
    },
    {
      key: 'brand.tagline',
      label: 'Brand Tagline',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'string',
      sampleValue: 'Architectural 3D Living Spaces',
      source: 'settings',
      description: 'Secondary brand slogan',
    },
    {
      key: 'brand.logo.primary',
      label: 'Primary Brand Logo',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'image',
      sampleValue: '/images/logo.svg',
      source: 'settings',
      description: 'Main brand logo image asset',
    },
    {
      key: 'brand.logo.dark',
      label: 'Dark Mode Logo',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'image',
      sampleValue: '/images/logo-dark.svg',
      source: 'settings',
      description: 'Logo variant for dark surfaces',
    },
    {
      key: 'brand.logo.light',
      label: 'Light Mode Logo',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'image',
      sampleValue: '/images/logo-light.svg',
      source: 'settings',
      description: 'Logo variant for light backgrounds',
    },
    {
      key: 'brand.phone',
      label: 'Concierge Telephone',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'string',
      sampleValue: '+92 (51) 880-9911',
      source: 'settings',
      description: 'Direct telephone line for inquiries',
    },
    {
      key: 'brand.email',
      label: 'Concierge Email Address',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'string',
      sampleValue: 'concierge@auraheights.local',
      source: 'settings',
      description: 'Official contact email',
    },
    {
      key: 'brand.address',
      label: 'Brokerage Physical Address',
      model: 'CmsTheme',
      category: 'Brand & Identity',
      type: 'string',
      sampleValue: 'Blue Area, Islamabad Capital Territory',
      source: 'settings',
      description: 'Headquarters physical address',
    },
    {
      key: 'year',
      label: 'Current Year (Computed)',
      model: 'System',
      category: 'Computed Variables',
      type: 'number',
      sampleValue: new Date().getFullYear(),
      source: 'computed',
      description: 'Dynamic 4-digit current calendar year',
    },
    {
      key: 'route.slug',
      label: 'Current Page Slug',
      model: 'System',
      category: 'Computed Variables',
      type: 'string',
      sampleValue: 'home',
      source: 'computed',
      description: 'The URL path slug of the active page',
    },
  ];

  return [...brandVariables, ...variables];
}
