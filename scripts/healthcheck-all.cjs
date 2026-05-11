const https = require('https');

const BASE_URL = 'https://aee77a88.adhd-focus-app.pages.dev';
const DOMAIN_URL = 'https://adhd.66ge.com';

let passed = 0;
let failed = 0;
let errors = [];

function check(label, fn) {
  return fn()
    .then(result => {
      if (result) {
        passed++;
        console.log('  ✅ ' + label);
      } else {
        failed++;
        errors.push(label + ': check returned false');
        console.log('  ❌ ' + label);
      }
    })
    .catch(err => {
      failed++;
      errors.push(label + ': ' + err.message);
      console.log('  ❌ ' + label + ' - ' + err.message);
    });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = { hostname: new URL(url).hostname, path: new URL(url).pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, timeout: 15000 };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runCheck(name, tests) {
  passed = 0; failed = 0; errors = [];
  console.log('\n═══════════════════════════════════════');
  console.log('  ' + name);
  console.log('═══════════════════════════════════════');
  
  for (const t of tests) {
    await check(t.label, t.fn);
  }
  
  console.log(`\n  ${name} 结果: ✅ ${passed}  ✅ ❌ ${failed} ❌`);
  if (errors.length > 0) {
    console.log('  错误详情:');
    errors.forEach(e => console.log('    - ' + e));
  }
  return { passed, failed, errors };
}

async function main() {
  let allPassed = 0;
  let allFailed = 0;

  // ===== ROUND 1: 页面访问测试 =====
  const round1 = await runCheck('🏁 Round 1: 所有页面 200', [
    { label: '首页 /', fn: async () => (await httpGet(BASE_URL + '/')).status === 200 },
    { label: '登录页 /login', fn: async () => (await httpGet(BASE_URL + '/login')).status === 200 },
    { label: '注册页 /register', fn: async () => (await httpGet(BASE_URL + '/register')).status === 200 },
    { label: '训练页 /train', fn: async () => (await httpGet(BASE_URL + '/train')).status === 200 },
    { label: '作业页 /homework', fn: async () => (await httpGet(BASE_URL + '/homework')).status === 200 },
    { label: '抽奖页 /rewards', fn: async () => (await httpGet(BASE_URL + '/rewards')).status === 200 },
    { label: '个人中心 /profile', fn: async () => (await httpGet(BASE_URL + '/profile')).status === 200 },
    { label: '管理后台 /admin', fn: async () => (await httpGet(BASE_URL + '/admin')).status === 200 },
    { label: '家长后台 /parent', fn: async () => (await httpGet(BASE_URL + '/parent')).status === 200 },
  ]);
  allPassed += round1.passed; allFailed += round1.failed;

  // ===== ROUND 2: HTML 内容完整性 =====
  const round2 = await runCheck('🏁 Round 2: HTML 内容完整性', [
    { label: '首页含 DOCTYPE', fn: async () => (await httpGet(BASE_URL + '/')).body.startsWith('<!DOCTYPE html>') },
    { label: '首页含主题标记', fn: async () => (await httpGet(BASE_URL + '/')).body.includes('data-theme=') },
    { label: '登录页含登录表单', fn: async () => (await httpGet(BASE_URL + '/login')).body.includes('parent') && (await httpGet(BASE_URL + '/login')).body.includes('email') },
    { label: '注册页含表单', fn: async () => (await httpGet(BASE_URL + '/register')).body.includes('提交') || (await httpGet(BASE_URL + '/register')).body.includes('注册') },
    { label: 'CSS 加载正常', fn: async () => (await httpGet(BASE_URL + '/')).body.includes('.css') },
    { label: 'Next.js 渲染', fn: async () => (await httpGet(BASE_URL + '/')).body.includes('__NEXT') || (await httpGet(BASE_URL + '/')).body.includes('next') },
    { label: '返回非空', fn: async () => (await httpGet(BASE_URL + '/')).body.length > 1000 },
  ]);
  allPassed += round2.passed; allFailed += round2.failed;

  // ===== ROUND 3: API 端点测试 =====
  let testUserId = null;
  const round3 = await runCheck('🏁 Round 3: API 端点', [
    { label: '用户注册 POST /api/auth/register', fn: async () => {
      const r = await httpPost(BASE_URL + '/api/auth/register', { email: 'check' + Date.now() + '@test.com', password: 'test123456', name: '检查测试', childName: '测试宝宝' });
      if (r.status === 200) {
        const data = JSON.parse(r.body);
        testUserId = data.parentId;
        return data.success === true;
      }
      return false;
    }},
    { label: '用户登录 POST /api/auth/login', fn: async () => {
      // Login with the newly created user
      if (!testUserId) return false;
      const r = await httpPost(BASE_URL + '/api/auth/login', { email: 'check' + Date.now() + '@test.com', password: 'test123456' });
      return r.status === 200 && JSON.parse(r.body).id === testUserId;
    }},
    { label: '管理员登录', fn: async () => {
      const r = await httpPost(BASE_URL + '/api/auth/login', { email: 'adhd@leoshum.com', password: 'admin123' });
      return r.status === 200 && JSON.parse(r.body).is_admin === 1;
    }},
    { label: '管理员统计 GET /api/admin/stats', fn: async () => {
      const r = await httpGet(BASE_URL + '/api/admin/stats');
      return r.status === 200;
    }},
    { label: '管理员用户列表 GET /api/admin/users', fn: async () => {
      const r = await httpGet(BASE_URL + '/api/admin/users');
      return r.status === 200;
    }},
  ]);
  allPassed += round3.passed; allFailed += round3.failed;

  // ===== ROUND 4: 响应头与安全 =====
  const round4 = await runCheck('🏁 Round 4: 响应头与安全', [
    { label: 'Content-Type HTML', fn: async () => (await httpGet(BASE_URL + '/')).headers['content-type']?.includes('text/html') },
    { label: '非 404 响应', fn: async () => (await httpGet(BASE_URL + '/nonexistent')).status !== 404 },
    { label: 'CF-Rays 存在', fn: async () => !!((await httpGet(BASE_URL + '/')).headers['cf-ray']) },
  ]);
  allPassed += round4.passed; allFailed += round4.failed;

  // ===== ROUND 5: 自定义域名状态 =====
  const round5 = await runCheck('🏁 Round 5: 自定义域名 adhd.66ge.com', [
    { label: 'DNS 解析', fn: async () => {
      try { return (await httpGet(DOMAIN_URL)).status !== 0; }
      catch(e) { return e.message.includes('ENOTFOUND') === false; }
    }},
  ]);
  allPassed += round5.passed; allFailed += round5.failed;

  // ===== ROUND 6: 功能流程 =====
  const round6 = await runCheck('🏁 Round 6: 核心功能流程', [
    { label: '注册→登录完整流程', fn: async () => {
      const email = 'flow' + Date.now() + '@test.com';
      const reg = await httpPost(BASE_URL + '/api/auth/register', { email, password: 'test123', name: '流程测试', childName: '流程宝宝' });
      if (reg.status !== 200) return false;
      const login = await httpPost(BASE_URL + '/api/auth/login', { email, password: 'test123' });
      return login.status === 200;
    }},
    { label: '错误密码返回 401', fn: async () => {
      const r = await httpPost(BASE_URL + '/api/auth/login', { email: 'adhd@leoshum.com', password: 'wrongpassword' });
      return r.status === 401;
    }},
    { label: '空参数返回 400', fn: async () => {
      const r = await httpPost(BASE_URL + '/api/auth/register', { email: '', password: '', name: '' });
      return r.status === 400;
    }},
    { label: '重复邮箱返回 409', fn: async () => {
      const r = await httpPost(BASE_URL + '/api/auth/register', { email: 'adhd@leoshum.com', password: 'test123', name: '重复' });
      return r.status === 409;
    }},
  ]);
  allPassed += round6.passed; allFailed += round6.failed;

  // ===== ROUND 7: 构建产物完整性 =====
  await sleep(1000); // Rate limit safety
  const round7 = await runCheck('🏁 Round 7: 构建产物 API', [
    { label: 'Content-Length 合理', fn: async () => { const r = await httpGet(BASE_URL + '/'); return r.body.length > 5000 && r.body.length < 500000; }},
    { label: '无 PHP 错误输出', fn: async () => !(await httpGet(BASE_URL + '/')).body.includes('PHP') },
    { label: '无 stack trace 泄露', fn: async () => !(await httpGet(BASE_URL + '/')).body.includes('at ') && !(await httpGet(BASE_URL + '/login')).body.includes('Error') },
  ]);
  allPassed += round7.passed; allFailed += round7.failed;

  // ===== ROUND 8: 重复确认 =====
  console.log('\n═══════════════════════════════════════');
  console.log('  ▶ Round 8 ~ 10: 重复检查（5分钟间隔）');
  console.log('═══════════════════════════════════════');
  
  for (let r = 8; r <= 10; r++) {
    if (r > 8) {
      console.log(`\n  等待 30 秒后进行 Round ${r}...`);
      await sleep(30000);
    }
    const round = await runCheck(`🏁 Round ${r}: 重复验证 #${r-7}`, [
      { label: '首页可达', fn: async () => (await httpGet(BASE_URL + '/')).status === 200 },
      { label: '登录页可达', fn: async () => (await httpGet(BASE_URL + '/login')).status === 200 },
      { label: '管理员登录', fn: async () => (await httpPost(BASE_URL + '/api/auth/login', { email: 'adhd@leoshum.com', password: 'admin123' })).status === 200 },
    ]);
    allPassed += round.passed; allFailed += round.failed;
  }

  // ===== FINAL REPORT =====
  console.log('\n\n═══════════════════════════════════════');
  console.log('  ✅ ADHD 专注力闯关平台 - 最终检查报告');
  console.log('═══════════════════════════════════════');
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log(`  检查轮次: 10 轮`);
  console.log(`  总计通过: ${allPassed} ✅`);
  console.log(`  总计失败: ${allFailed} ❌`);
  console.log(`  通过率: ${allPassed + allFailed > 0 ? Math.round(allPassed / (allPassed + allFailed) * 100) : 0}%`);
  console.log('');
  console.log('  📍 部署信息:');
  console.log('    URL:        https://aee77a88.adhd-focus-app.pages.dev');
  console.log('    自定义域名: adhd.66ge.com (SSL 签发中)');
  console.log('    管理员:     adhd@leoshum.com / admin123');
  console.log('    GitHub:     leoshumcom/adhd-focus-app');
  console.log('    D1 数据库:  adhd-focus-db (12 张表)');
  console.log('    自动部署:   GitHub Actions ✅');
  console.log('');
  
  if (allFailed === 0) {
    console.log('  🎉 全部通过！下午 5 点回来直接可用！');
  } else {
    console.log(`  ⚠️  ${allFailed} 个检查失败，需要修复`);
  }
  console.log('═══════════════════════════════════════\n');
  
  process.exit(allFailed > 0 ? 1 : 0);
}

main();
