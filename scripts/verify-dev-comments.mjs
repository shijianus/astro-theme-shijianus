import { spawn } from 'child_process';

async function runDevApiVerification() {
  console.log('🚀 Starting Astro Dev Server to verify /api/comments dev middleware...');
  const devProc = spawn('npx', ['astro', 'dev', '--port', '4333', '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let output = '';
  let serverReady = false;

  devProc.stdout.on('data', (d) => {
    const text = d.toString();
    output += text;
    if (text.includes('http://') || text.includes('Local:')) {
      serverReady = true;
    }
  });
  devProc.stderr.on('data', (d) => { output += d.toString(); });

  const maxWait = 25000;
  const start = Date.now();
  while (!serverReady && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!serverReady) {
    devProc.kill('SIGTERM');
    throw new Error('Astro dev server failed to start within timeout. Output:\n' + output);
  }

  console.log('✅ Astro dev server is ready on http://127.0.0.1:4333');

  try {
    console.log('1. Testing GET /api/comments?slug=e2e-dev-test&sort=new ...');
    const getRes = await fetch('http://127.0.0.1:4333/api/comments?slug=e2e-dev-test&sort=new');
    if (getRes.status !== 200) throw new Error('GET failed: ' + getRes.status);
    const getContentType = getRes.headers.get('content-type') || '';
    if (!getContentType.includes('application/json')) throw new Error('Non-JSON: ' + getContentType);
    const getJson = await getRes.json();
    console.log('   -> GET OK: status 200, Content-Type: application/json');

    console.log('2. Testing POST /api/comments (standard comment) ...');
    const postRes1 = await fetch('http://127.0.0.1:4333/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        slug: 'e2e-dev-test',
        message: '本地开发环境测试评论',
        authorName: 'DevTester',
        postType: 'comment',
      }),
    });
    if (postRes1.status !== 200) throw new Error('POST failed: ' + postRes1.status);
    const postJson1 = await postRes1.json();
    if (!postJson1.ok || !postJson1.comment?.id) throw new Error('POST failed: ' + JSON.stringify(postJson1));
    const commentId = postJson1.comment.id;
    console.log('   -> POST Comment OK: id = ' + commentId);

    console.log('3. Testing POST /api/comments (Rocket Boost reply <= 16 chars) ...');
    const postRes2 = await fetch('http://127.0.0.1:4333/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        slug: 'e2e-dev-test',
        message: '🚀 极客加速回复！',
        authorName: 'RocketBooster',
        postType: 'boost',
        parentId: commentId,
      }),
    });
    if (postRes2.status !== 200) throw new Error('POST Boost failed: ' + postRes2.status);
    const postJson2 = await postRes2.json();
    if (!postJson2.ok || postJson2.comment?.postType !== 'boost') throw new Error('POST Boost failed');
    console.log('   -> POST Boost Reply OK: postType = ' + postJson2.comment?.postType);

    console.log('4. Testing POST /api/comments (action: like) ...');
    const likeRes = await fetch('http://127.0.0.1:4333/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', id: commentId }),
    });
    const likeJson = await likeRes.json();
    console.log('   -> Like OK: likesCount = ' + likeJson.likesCount);

    console.log('5. Verifying GET returns both comments ...');
    const getResFinal = await fetch('http://127.0.0.1:4333/api/comments?slug=e2e-dev-test&sort=new');
    const getJsonFinal = await getResFinal.json();
    if (getJsonFinal.comments?.length < 2) throw new Error('Expected 2 comments');
    console.log('   -> Final GET count: ' + getJsonFinal.comments.length);

    console.log('\n🎉 ALL LOCAL DEV COMMENTS API INTEGRATION CHECKS PASSED!');
  } finally {
    devProc.kill('SIGTERM');
  }
}

runDevApiVerification().catch((err) => {
  console.error('❌ Dev API Verification Error:', err);
  process.exit(1);
});
