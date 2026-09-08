import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const bridgePath = path.join(root, 'src/app/InteractionBridge.tsx');
const featurePagePath = path.join(root, 'src/app/[workspaceSlug]/feature/[featureKey]/page.tsx');
const layoutPath = path.join(root, 'src/app/layout.tsx');
const middlewarePath = path.join(root, 'src/middleware.ts');
const campaignsPath = path.join(root, 'src/app/[workspaceSlug]/campaigns/page.tsx');
const accountPagePath = path.join(root, 'src/app/account/page.tsx');
const strategyPagePath = path.join(root, 'src/app/[workspaceSlug]/strategy/setup/page.tsx');
const strategyActionsPath = path.join(root, 'src/app/[workspaceSlug]/strategy/setup/actions.ts');
const contentNewPagePath = path.join(root, 'src/app/[workspaceSlug]/content/new/page.tsx');
const contentNewActionsPath = path.join(root, 'src/app/[workspaceSlug]/content/new/actions.ts');
const contentDetailPagePath = path.join(root, 'src/app/[workspaceSlug]/content/[contentId]/page.tsx');
const contentDetailActionsPath = path.join(root, 'src/app/[workspaceSlug]/content/[contentId]/actions.ts');
const approvalsPagePath = path.join(root, 'src/app/[workspaceSlug]/approvals/page.tsx');
const approvalsActionsPath = path.join(root, 'src/app/[workspaceSlug]/approvals/actions.ts');
const deployedE2ePath = path.join(root, 'scripts/verify-deployed-interactions.mjs');

const requiredFiles = [
  bridgePath, featurePagePath, layoutPath, middlewarePath, campaignsPath, accountPagePath,
  strategyPagePath, strategyActionsPath, contentNewPagePath, contentNewActionsPath,
  contentDetailPagePath, contentDetailActionsPath, approvalsPagePath, approvalsActionsPath, deployedE2ePath,
];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required interaction file: ${file}`);
}

const bridge = fs.readFileSync(bridgePath, 'utf8');
const featurePage = fs.readFileSync(featurePagePath, 'utf8');
const layout = fs.readFileSync(layoutPath, 'utf8');
const middleware = fs.readFileSync(middlewarePath, 'utf8');
const accountPage = fs.readFileSync(accountPagePath, 'utf8');
const strategyActions = fs.readFileSync(strategyActionsPath, 'utf8');
const contentNewActions = fs.readFileSync(contentNewActionsPath, 'utf8');
const contentDetailPage = fs.readFileSync(contentDetailPagePath, 'utf8');
const contentDetailActions = fs.readFileSync(contentDetailActionsPath, 'utf8');
const approvalsActions = fs.readFileSync(approvalsActionsPath, 'utf8');
const deployedE2e = fs.readFileSync(deployedE2ePath, 'utf8');

const requiredLabels = [
  'Audience','Message Pillars','Brand Guardrails','Content Calendar','Content Items','Create Content',
  'Text to Image','Text to Video','Image to Video','Review & Approve','Content Library','Channels','Publishing',
  'UTM & Tracking','Content Performance','Audience Insights','Attribution','A/B Tests','Business Genome',
  'Next Best Actions','Environment','Migration','RLS / Security','Supabase Staging','Production Readiness','System Settings'
];

for (const label of requiredLabels) {
  if (!bridge.includes(label)) throw new Error(`Interaction bridge missing route mapping for: ${label}`);
}

const requiredSelectors = [
  '.sidebar-item.muted-item','.sidebar-subitems span','.system-settings-row','.global-search','.notification',
  '.profile-copy','.profile-chevron','.date-filter','.tab-row .tab','.panel-filter','.platform-grid > div'
];
for (const selector of requiredSelectors) {
  if (!bridge.includes(selector)) throw new Error(`Interaction bridge missing selector: ${selector}`);
}

if (!bridge.includes("'use client'")) throw new Error('InteractionBridge must be a Client Component');
if (!bridge.includes('router.push')) throw new Error('InteractionBridge must perform client navigation');
if (!bridge.includes('keydown')) throw new Error('Keyboard activation contract missing');
if (!bridge.includes("router.push('/account')")) throw new Error('Profile control must navigate to the Account route');
if (!bridge.includes("/${workspaceSlug}/content/new")) throw new Error('Create Content must route to functional content workflow');
if (!bridge.includes("/${workspaceSlug}/approvals")) throw new Error('Review & Approve must route to functional approval workflow');
if (!layout.includes('<InteractionBridge />')) throw new Error('Root layout does not mount InteractionBridge');
if (!featurePage.includes('Interaction status: ACTIVE')) throw new Error('Feature route hub missing interaction status');
if (!featurePage.includes('Backend execution status: UNVERIFIED')) throw new Error('Feature route hub must preserve backend truth state');
if (!featurePage.includes("status: 'UNAVAILABLE'")) throw new Error('Functional feature page must fail closed when evidence/backend is unavailable');
if (!accountPage.includes('supabase.auth.getUser()')) throw new Error('Account route must verify the Supabase user');
if (!accountPage.includes("redirect('/login?next=%2Faccount')")) throw new Error('Account route must redirect anonymous users to login');
if (!accountPage.includes('<h1 id="account-title">Account</h1>')) throw new Error('Account route heading contract missing');
if (!accountPage.includes('{user.email ??')) throw new Error('Account route must render the verified user email safely');
if (!accountPage.includes('action={signOut}')) throw new Error('Account route must expose the existing sign-out action');
if (!middleware.includes('MARKETING_OS_AUTH_CONFIG=UNAVAILABLE')) throw new Error('Middleware missing safe configuration fallback');

for (const required of ['createBrandAction','createAudienceAction','createMessagePillarAction','createOfferAction','createCtaAction','createBrandRuleAction']) {
  if (!strategyActions.includes(`export async function ${required}`)) throw new Error(`Strategy workflow missing ${required}`);
}
if (!strategyActions.includes("from('marketing_brands')") || !strategyActions.includes("from('marketing_brand_rules')")) {
  throw new Error('Strategy actions must persist to Supabase strategy tables');
}
if (!contentNewActions.includes("from('marketing_content_items')")) throw new Error('Create Content must persist a real content object');
for (const required of ['createManualContentVersionAction','requestApprovalAction','createTrackingLinkAction']) {
  if (!contentDetailActions.includes(`export async function ${required}`)) throw new Error(`Content workflow missing ${required}`);
}
if (!contentDetailPage.includes('disabled={!approved}')) throw new Error('Tracking creation must remain gated by approval');
if (!approvalsActions.includes('reviewed_by: user.id') || !approvalsActions.includes("status: parsed.data.decision")) {
  throw new Error('Approval review must record reviewer and decision');
}

for (const label of ['Dashboard','Campaigns','Create Campaign','Profile','Date Filter']) {
  if (!deployedE2e.includes(label)) throw new Error(`Deployed E2E missing required interaction: ${label}`);
}

console.log('INTERACTION_ROUTE_CONTRACT=PASS');
console.log('FUNCTIONAL_V5_CONTRACT=PASS');
console.log(`FEATURE_LABELS_VERIFIED=${requiredLabels.length}`);
console.log(`INTERACTION_SELECTORS_VERIFIED=${requiredSelectors.length}`);
