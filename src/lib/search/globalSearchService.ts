import { TokenPayload } from '../auth';
import { getUserRole, can, applyDataScope } from '../rbac';
import { Property } from '../../models/Property';
import { Lead } from '../../models/Lead';
import { Customer } from '../../models/Customer';
import { Invoice } from '../../models/Invoice';
import { connectToDatabase } from '../db';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Property' | 'Lead' | 'Customer' | 'Invoice';
  targetUrl: string;
}

export interface SearchProviderDefinition {
  category: 'Property' | 'Lead' | 'Customer' | 'Invoice';
  requiredPermission: string;
  requiredFeature?: string;
  resolver: (queryRegex: RegExp, user: TokenPayload, role: any) => Promise<SearchResultItem[]>;
}

export const SEARCH_PROVIDERS: SearchProviderDefinition[] = [
  {
    category: 'Property',
    requiredPermission: 'property.list',
    resolver: async (regex, user, role) => {
      const scopeFilter = await applyDataScope(
        {
          $or: [
            { title: regex },
            { 'location.city': regex },
            { 'location.address': regex },
            { propertyType: regex },
          ],
        },
        user,
        role,
        'property.list'
      );
      const items = await Property.find(scopeFilter).limit(5).lean();
      return items.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        subtitle: `${p.location?.city || 'Unknown City'} • $${p.price?.toLocaleString()} • ${p.status}`,
        category: 'Property',
        targetUrl: `/dashboard/properties?search=${encodeURIComponent(p.title)}&status=${p.status}`,
      }));
    },
  },
  {
    category: 'Lead',
    requiredPermission: 'lead.list',
    resolver: async (regex, user, role) => {
      const scopeFilter = await applyDataScope(
        {
          $or: [{ fullName: regex }, { email: regex }, { phone: regex }],
        },
        user,
        role,
        'lead.list'
      );
      const items = await Lead.find(scopeFilter).limit(5).lean();
      return items.map((l) => ({
        id: l._id.toString(),
        title: l.fullName,
        subtitle: `${l.email} • ${l.phone} • Status: ${l.status}`,
        category: 'Lead',
        targetUrl: `/dashboard/leads?search=${encodeURIComponent(l.fullName)}&status=${l.status}`,
      }));
    },
  },
  {
    category: 'Customer',
    requiredPermission: 'customer.list',
    resolver: async (regex, user, role) => {
      const scopeFilter = await applyDataScope(
        {
          $or: [{ fullName: regex }, { email: regex }, { phone: regex }],
        },
        user,
        role,
        'customer.list'
      );
      const items = await Customer.find(scopeFilter).limit(5).lean();
      return items.map((c) => ({
        id: c._id.toString(),
        title: c.fullName,
        subtitle: `${c.email} • ${c.phone} • Status: ${c.status}`,
        category: 'Customer',
        targetUrl: `/dashboard/customers?search=${encodeURIComponent(c.fullName)}`,
      }));
    },
  },
  {
    category: 'Invoice',
    requiredPermission: 'invoice.list',
    resolver: async (regex, user, role) => {
      const scopeFilter = await applyDataScope(
        {
          $or: [{ invoiceNumber: regex }],
        },
        user,
        role,
        'invoice.list'
      );
      const items = await Invoice.find(scopeFilter).limit(5).lean();
      return items.map((inv) => ({
        id: inv._id.toString(),
        title: inv.invoiceNumber,
        subtitle: `$${inv.amount?.toLocaleString()} • Due: ${new Date(inv.dueDate).toLocaleDateString()} • ${inv.status}`,
        category: 'Invoice',
        targetUrl: `/dashboard/invoices?search=${encodeURIComponent(inv.invoiceNumber)}&status=${inv.status}`,
      }));
    },
  },
];

export async function executeGlobalSearch(
  query: string,
  user: TokenPayload
): Promise<SearchResultItem[]> {
  await connectToDatabase();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const role = await getUserRole(user.roleId);
  const regex = new RegExp(trimmed, 'i');
  const results: SearchResultItem[] = [];

  for (const provider of SEARCH_PROVIDERS) {
    if (can(user, role, provider.requiredPermission)) {
      const categoryResults = await provider.resolver(regex, user, role);
      results.push(...categoryResults);
    }
  }

  return results;
}
