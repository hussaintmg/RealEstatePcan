import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { getSessionUser } from '@/lib/auth';
import { can, applyDataScope, getUserRole } from '@/lib/rbac';
import { Property } from '@/models/Property';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();

  const user = await getSessionUser();
  const role = user ? await getUserRole(user.roleId) : null;

  if (user && !can(user, role, 'property.list')) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: property.list required', 403);
  }

  // Search and Filter Params
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const city = searchParams.get('city') || '';
  const propertyType = searchParams.get('propertyType') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') === 'asc' ? 1 : -1;

  const baseFilter: any = {};
  if (search) {
    baseFilter.$or = [
      { title: new RegExp(search, 'i') },
      { 'location.city': new RegExp(search, 'i') },
      { 'location.address': new RegExp(search, 'i') },
    ];
  }
  if (status) baseFilter.status = status;
  if (city) baseFilter['location.city'] = new RegExp(city, 'i');
  if (propertyType) baseFilter.propertyType = propertyType;
  if (minPrice || maxPrice) {
    baseFilter.price = {};
    if (minPrice) baseFilter.price.$gte = Number(minPrice);
    if (maxPrice) baseFilter.price.$lte = Number(maxPrice);
  }

  // Apply RBAC Data Scope if logged in; if public visitor, only show available properties
  let finalFilter = baseFilter;
  if (user) {
    finalFilter = await applyDataScope(baseFilter, user, role, 'property.list');
  } else {
    finalFilter.status = 'available';
  }

  const result = await paginateQuery(Property, {
    page,
    limit: 20,
    filter: finalFilter,
    sort: { [sortBy]: sortDir },
  });

  if (user) {
    recordAuditEvent({
      actorUserId: user.userId,
      actorEmail: user.email,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'property.list',
      resourceType: 'property',
      route: '/api/properties',
      method: 'GET',
      status: 200,
      durationMs: Date.now() - startTime,
    });
  }

  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const { user, role } = authRes;
  if (!can(user, role, 'property.create')) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: Cannot create properties', 403);
  }

  await connectToDatabase();
  const body = await req.json();

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return standardError('VALIDATION_ERROR', 'Property title is required', 422, { title: 'Title is required' });
  }

  try {
    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const property = await Property.create({
      ...body,
      slug,
      createdBy: user.userId,
    });

    const safeProperty = {
      id: property._id.toString(),
      title: property.title,
      price: property.price,
      status: property.status,
      slug: property.slug,
    };

    recordAuditEvent({
      actorUserId: user.userId,
      actorEmail: user.email,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'property.created',
      resourceType: 'property',
      resourceId: property._id.toString(),
      route: '/api/properties',
      method: 'POST',
      status: 201,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(undefined, safeProperty),
      metadata: { propertyTitle: property.title },
    });

    return NextResponse.json({ success: true, property }, { status: 201 });
  } catch (err: any) {
    return standardError('PROPERTY_CREATE_FAILED', err.message || 'Failed to create property', 500);
  }
}
