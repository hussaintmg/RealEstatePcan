import { TokenPayload } from '../auth';
import { getUserRole, hasPermission, applyDataScope } from '../rbac';
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

  // 1. Search Properties (if user has read permission)
  if (hasPermission(user, role, 'properties', 'read')) {
    const scopeFilter = await applyDataScope(
      {
        $or: [{ title: regex }, { 'location.city': regex }, { 'location.address': regex }, { propertyType: regex }],
      },
      user,
      role
    );

    const properties = await Property.find(scopeFilter).limit(5).lean();
    properties.forEach((p) => {
      results.push({
        id: p._id.toString(),
        title: p.title,
        subtitle: `${p.location?.city || 'Unknown City'} • $${p.price?.toLocaleString()} • ${p.status}`,
        category: 'Property',
        targetUrl: `/dashboard/properties?search=${encodeURIComponent(p.title)}&status=${p.status}`,
      });
    });
  }

  // 2. Search Leads
  if (hasPermission(user, role, 'leads', 'read')) {
    const scopeFilter = await applyDataScope(
      {
        $or: [{ fullName: regex }, { email: regex }, { phone: regex }],
      },
      user,
      role
    );

    const leads = await Lead.find(scopeFilter).limit(5).lean();
    leads.forEach((l) => {
      results.push({
        id: l._id.toString(),
        title: l.fullName,
        subtitle: `${l.email} • ${l.phone} • Status: ${l.status}`,
        category: 'Lead',
        targetUrl: `/dashboard/leads?search=${encodeURIComponent(l.fullName)}&status=${l.status}`,
      });
    });
  }

  // 3. Search Customers
  if (hasPermission(user, role, 'customers', 'read')) {
    const scopeFilter = await applyDataScope(
      {
        $or: [{ fullName: regex }, { email: regex }, { phone: regex }],
      },
      user,
      role
    );

    const customers = await Customer.find(scopeFilter).limit(5).lean();
    customers.forEach((c) => {
      results.push({
        id: c._id.toString(),
        title: c.fullName,
        subtitle: `${c.email} • ${c.phone} • Status: ${c.status}`,
        category: 'Customer',
        targetUrl: `/dashboard/customers?search=${encodeURIComponent(c.fullName)}`,
      });
    });
  }

  // 4. Search Invoices
  if (hasPermission(user, role, 'invoices', 'read')) {
    const scopeFilter = await applyDataScope(
      {
        $or: [{ invoiceNumber: regex }],
      },
      user,
      role
    );

    const invoices = await Invoice.find(scopeFilter).limit(5).lean();
    invoices.forEach((inv) => {
      results.push({
        id: inv._id.toString(),
        title: inv.invoiceNumber,
        subtitle: `$${inv.amount?.toLocaleString()} • Due: ${new Date(inv.dueDate).toLocaleDateString()} • ${inv.status}`,
        category: 'Invoice',
        targetUrl: `/dashboard/invoices?search=${encodeURIComponent(inv.invoiceNumber)}&status=${inv.status}`,
      });
    });
  }

  return results;
}
