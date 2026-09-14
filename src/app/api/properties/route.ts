import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserRole, hasPermission, applyDataScope } from '@/lib/rbac';
import { Property } from '@/models/Property';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();

  const user = await getSessionUser();
  const role = user ? await getUserRole(user.roleId) : null;

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
    finalFilter = await applyDataScope(baseFilter, user, role);
  } else {
    finalFilter.status = 'available';
  }

  const result = await paginateQuery(Property, {
    page,
    limit: 20, // Strict 20 items per page as requested
    filter: finalFilter,
    sort: { [sortBy]: sortDir },
  });

  if (user) {
    recordAuditEvent({
      method: 'GET',
      path: '/api/properties',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });
  }

  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.roleId);
  if (!hasPermission(user, role, 'properties', 'create')) {
    return NextResponse.json({ error: 'Permission denied: Cannot create properties' }, { status: 403 });
  }

  await connectToDatabase();
  const body = await req.json();

  try {
    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const property = await Property.create({
      ...body,
      slug,
      createdBy: user.userId,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/properties',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true, property }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
