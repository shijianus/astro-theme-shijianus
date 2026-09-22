import assert from 'node:assert';
import { getCuratedPlaylist, searchMusic } from '../functions/_lib/music-provider.ts';
import { onRequest as streamOnRequest } from '../functions/api/music/stream.ts';
import { resolveOrigin } from '../functions/_lib/http.ts';

console.log('=== Running Music Player & Audio Stream Verification Tests ===\n');

// 1. Test CORS resolveOrigin safety
console.log('1. Testing CORS resolveOrigin safety...');
{
  const mockEnv = { ALLOW_ORIGINS: 'https://blog.epocanvas.com' };
  const sameOriginReq = new Request('https://blog.epocanvas.com/api/test', {
    headers: { origin: 'https://blog.epocanvas.com' },
  });
  assert.strictEqual(resolveOrigin(sameOriginReq, mockEnv), 'https://blog.epocanvas.com', 'Same origin must be allowed');

  const subdomainReq = new Request('https://blog.epocanvas.com/api/test', {
    headers: { origin: 'https://preview.epocanvas.com' },
  });
  assert.strictEqual(resolveOrigin(subdomainReq, mockEnv), 'https://preview.epocanvas.com', 'Subdomain must be allowed');

  // Test null safety with undefined env
  const nullEnvReq = new Request('https://blog.epocanvas.com/api/test', {
    headers: { origin: 'https://blog.epocanvas.com' },
  });
  assert.doesNotThrow(() => resolveOrigin(nullEnvReq, undefined), 'Must not throw when env is undefined');
  console.log('  [PASS] 1: resolveOrigin is null-safe and properly handles same-origin & subdomains.');
}

// 2. Test Local Music Track Resolution in Music Provider
console.log('\n2. Testing local track resolution...');
{
  const mockEnv = { ALLOW_ORIGINS: '*' };
  const playlist = await getCuratedPlaylist(mockEnv);
  assert.ok(Array.isArray(playlist) && playlist.length > 0, 'Curated playlist must return tracks');
  const localTracks = playlist.filter(t => t.source === 'local');
  if (localTracks.length > 0) {
    for (const track of localTracks) {
      assert.ok(track.urlId, `Local track ${track.name} must have urlId assigned`);
      assert.ok(track.urlId.startsWith('/media/') || track.urlId.startsWith('/assets/') || track.urlId.startsWith('http'), `Local track urlId must be valid path, got ${track.urlId}`);
    }
    console.log(`  [PASS] 2: Found ${localTracks.length} local tracks, all have urlId correctly resolved.`);
  } else {
    console.log('  [PASS] 2: Curated playlist loaded without error.');
  }
}

// 3. Test Stream API with local path redirection
console.log('\n3. Testing stream API for local path 302 redirection...');
{
  const mockEnv = { ALLOW_ORIGINS: '*' };
  const req = new Request('https://blog.epocanvas.com/api/music/stream?id=local-way-back-home&source=local');
  const res = await streamOnRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 302, 'Local stream should redirect with 302');
  const loc = res.headers.get('Location');
  assert.ok(loc && (loc.startsWith('/media/') || loc.startsWith('/assets/')), `Expected local audio location header, got: ${loc}`);
  console.log(`  [PASS] 3: Stream API successfully returned 302 redirect to: ${loc}`);
}

console.log('\n=== All Music Player & Audio Stream Tests Passed Successfully! ===\n');
