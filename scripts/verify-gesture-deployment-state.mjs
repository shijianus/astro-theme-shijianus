import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const deploymentURL = process.env.GESTURE_BASE_URL;
const commit = process.env.GESTURE_COMMIT;
const output = process.env.GESTURE_STATE_OUTPUT;
assert.ok(deploymentURL && commit && output, 'Set deployment URL, expected commit and output file');
const endpoint = 'https://api.cloudflare.com/client/v4/accounts/0a1276d9d2f920936dc2f3eda8c126f8/pages/projects/shijianus-blog';
const headers = { Authorization: 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN };
const responses = await Promise.all([fetch(endpoint, { headers }), fetch(endpoint + '/deployments', { headers })]);
for (const response of responses) assert.equal(response.status, 200);
const [projectBody, deploymentsBody] = await Promise.all(responses.map(response => response.json()));
assert.ok(projectBody.success && deploymentsBody.success);
const project = projectBody.result;
const deployed = deploymentsBody.result.find(deployment => deployment.url === deploymentURL);
assert.ok(deployed, 'Requested deployment exists');
const result = {
  id: deployed.id, url: deployed.url, aliases: deployed.aliases, environment: deployed.environment,
  latestStage: deployed.latest_stage, commit: deployed.deployment_trigger.metadata.commit_hash,
  branch: deployed.deployment_trigger.metadata.branch,
  productionDeployment: { id: project.canonical_deployment.id, url: project.canonical_deployment.url },
  previewDB: project.deployment_configs.preview.d1_databases,
  productionDB: project.deployment_configs.production.d1_databases,
};
assert.equal(result.environment, 'preview');
assert.equal(result.branch, 'refactor/gesturebook-reading');
assert.equal(result.commit, commit);
assert.equal(result.latestStage.status, 'success');
assert.equal(result.productionDeployment.id, '50485961-32f3-417c-89fe-62b502442de0');
const alias = await fetch('https://refactor-gesturebook-reading.shijianus-blog.pages.dev/guestbook/');
result.aliasStatus = alias.status;
assert.equal(alias.status, 200);
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
