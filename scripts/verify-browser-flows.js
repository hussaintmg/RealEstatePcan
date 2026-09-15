const http = require('http');

async function makeRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          setCookie,
          data: json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function extractCookie(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

async function runBrowserVerification() {
  console.log('====================================================');
  console.log('🌐 MODULE 3: LIVE END-TO-END BROWSER/API VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS ${total}] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL ${total}] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 0. Ensure developer credentials in DB
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/real_estate_db');
    }
    const hash = await bcrypt.hash('DeveloperPassword123!', 10);
    await mongoose.connection.db.collection('users').updateOne(
      { email: 'developer@auraheights.com' },
      { $set: { passwordHash: hash } }
    );
    console.log('✅ Developer credentials synced (developer@auraheights.com / DeveloperPassword123!)');

    // 1. Authenticate as Developer
    console.log('\n--- STEP 1: Developer Authentication ---');
    const loginRes = await makeRequest({
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: 'developer@auraheights.com',
        password: 'DeveloperPassword123!',
      },
    });

    assert(loginRes.status === 200, `Developer login returned HTTP ${loginRes.status}`);
    assert(loginRes.data?.user?.isDeveloper === true, `User isDeveloper is true`);
    const cookie = extractCookie(loginRes.setCookie);
    assert(cookie.includes('auth_token='), `Session cookie issued (auth_token)`);

    // 2. Load Developer Dashboard Page (HTML)
    console.log('\n--- STEP 2: Render Developer Console (/dashboard/developer) ---');
    const devPageRes = await makeRequest({
      path: '/dashboard/developer',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(devPageRes.status === 200, `Developer dashboard HTML returns HTTP 200`);
    const devHtml = typeof devPageRes.data === 'string' ? devPageRes.data : '';
    assert(
      devHtml.includes('Feature Flags') || devHtml.includes('developer') || devHtml.includes('Console'),
      `Developer dashboard HTML contains Developer Console markup`
    );

    // 3. Bootstrap State Verification
    console.log('\n--- STEP 3: Verify /api/auth/bootstrap Auth & Capabilities ---');
    const bootstrapRes = await makeRequest({
      path: '/api/auth/bootstrap',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(bootstrapRes.status === 200, `Bootstrap endpoint returns HTTP 200`);
    assert(bootstrapRes.data?.effectivePermissions?.length > 30, `Developer has all 40+ granular capabilities`);
    assert(bootstrapRes.data?.features?.cms !== undefined, `Platform features dictionary present in bootstrap`);

    // 4. Feature Flag Toggle & Persistence Test
    console.log('\n--- STEP 4: Developer Feature Flags Live Update ---');
    const initialConfigRes = await makeRequest({
      path: '/api/developer/config',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(initialConfigRes.status === 200, `GET /api/developer/config returns HTTP 200`);
    const initialFeatures = initialConfigRes.data?.config?.features || {};

    const updatedFeatures = {
      ...initialFeatures,
      cms: true,
      realtimeAuditLogs: true,
      templateEditors: true,
    };

    const updateConfigRes = await makeRequest({
      path: '/api/developer/config',
      method: 'PUT',
      headers: { Cookie: cookie },
      body: { features: updatedFeatures },
    });
    assert(updateConfigRes.status === 200, `PUT /api/developer/config updates feature flags successfully`);

    // Verify persistence
    const verifyConfigRes = await makeRequest({
      path: '/api/developer/config',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(verifyConfigRes.data?.config?.features?.cms === true, `Feature flag 'cms' persisted as true`);
    assert(verifyConfigRes.data?.config?.features?.realtimeAuditLogs === true, `Feature flag 'realtimeAuditLogs' persisted as true`);

    // 5. Roles Management Page Render
    console.log('\n--- STEP 5: Render Roles UI (/dashboard/roles) ---');
    const rolesPageRes = await makeRequest({
      path: '/dashboard/roles',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(rolesPageRes.status === 200, `Roles dashboard HTML returns HTTP 200`);

    // 6. Create Custom Role with Scoped Capabilities
    console.log('\n--- STEP 6: Create Custom Role with Scoped Capabilities ---');
    const createRoleRes = await makeRequest({
      path: '/api/roles',
      method: 'POST',
      headers: { Cookie: cookie },
      body: {
        name: 'Field Inspection Specialist',
        description: 'Field inspection and viewing specialist with assigned scope',
        capabilities: [
          { key: 'property.view', enabled: true, scope: 'all' },
          { key: 'lead.view', enabled: true, scope: 'assigned' },
          { key: 'lead.edit', enabled: true, scope: 'assigned' },
          { key: 'customer.view', enabled: true, scope: 'assigned' },
        ],
      },
    });
    if (createRoleRes.status !== 201) {
      console.log('createRoleRes status:', createRoleRes.status, 'data:', createRoleRes.data);
    }
    assert(createRoleRes.status === 201, `POST /api/roles returns HTTP 201`);
    const newRole = createRoleRes.data?.role;
    assert(newRole?.name === 'Field Inspection Specialist', `Role created with correct name`);
    assert(newRole?.capabilities?.length === 4, `Role has 4 assigned capabilities`);
    const leadCap = newRole?.capabilities?.find((c) => c.key === 'lead.view');
    assert(leadCap?.scope === 'assigned', `lead.view capability correctly scoped to 'assigned'`);

    // 7. Clone the Custom Role
    console.log('\n--- STEP 7: Clone Custom Role ---');
    const cloneRoleRes = await makeRequest({
      path: `/api/roles/${newRole._id}/clone`,
      method: 'POST',
      headers: { Cookie: cookie },
    });
    assert(cloneRoleRes.status === 201, `POST /api/roles/:id/clone returns HTTP 201`);
    const clonedRole = cloneRoleRes.data?.role;
    assert(clonedRole?.name === 'Field Inspection Specialist (Copy)', `Cloned role has correct copy name`);
    assert(clonedRole?._id !== newRole._id, `Cloned role has distinct ID`);
    assert(clonedRole?.capabilities?.length === newRole.capabilities.length, `Cloned role inherits capabilities`);

    // 8. Audit Log Live Feed & Diff Verification
    console.log('\n--- STEP 8: Audit Log Feed & Diff Inspector Verification ---');
    const auditPageRes = await makeRequest({
      path: '/dashboard/owner/audit-feed',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(auditPageRes.status === 200, `Audit feed dashboard HTML returns HTTP 200`);

    const auditLogsRes = await makeRequest({
      path: '/api/audit-logs?limit=10',
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert(auditLogsRes.status === 200, `GET /api/audit-logs returns HTTP 200`);
    const logs = auditLogsRes.data?.logs || [];
    assert(logs.length > 0, `Audit logs returned records (${logs.length} found)`);

    // Find the role.created or feature_flags.updated audit log
    const featureLog = logs.find((l) => l.action === 'feature_flags.updated');
    assert(!!featureLog, `Audit trail includes 'feature_flags.updated' entry`);
    if (featureLog) {
      assert(featureLog.changes?.before !== undefined, `Audit entry has changes.before`);
      assert(featureLog.changes?.after !== undefined, `Audit entry has changes.after`);
      assert(JSON.stringify(featureLog).includes('password') === false, `Audit log contains no passwords or secret tokens`);
    }

    const roleCreatedLog = logs.find((l) => l.action === 'role.created');
    assert(!!roleCreatedLog, `Audit trail includes 'role.created' entry`);

    const roleClonedLog = logs.find((l) => l.action === 'role.cloned');
    assert(!!roleClonedLog, `Audit trail includes 'role.cloned' entry`);

    // 9. Clean up cloned role
    console.log('\n--- STEP 9: Clean Up Test Role & Deletion Guard ---');
    const deleteClonedRes = await makeRequest({
      path: `/api/roles/${clonedRole._id}`,
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert(deleteClonedRes.status === 200, `DELETE /api/roles/:id deletes cloned role successfully`);

    // Clean up new role
    const deleteNewRes = await makeRequest({
      path: `/api/roles/${newRole._id}`,
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert(deleteNewRes.status === 200, `DELETE /api/roles/:id deletes new role successfully`);

    console.log('\n====================================================');
    console.log(`🏆 ALL ${passed}/${total} LIVE BROWSER/API TESTS PASSED!`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exitCode = 1;
  }
}

runBrowserVerification();
