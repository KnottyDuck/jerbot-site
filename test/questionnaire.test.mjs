import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMailto, composeSummary, MAX_MAILTO_LENGTH } from '../questionnaire.mjs';

test('all eleven approved sections appear in order with safe defaults', () => {
  const summary = composeSummary({ name:'Jane', contact:'jane@example.com', process:'Manual work', outcome:'Save time' });
  const positions = [
    '1. About you','2. The problem','3. What you want','4. Users','5. Priorities',
    '6. Existing tools and data','7. Assets you have','8. Constraints',
    '9. Ownership and hosting','10. Success in 90 days','11. Anything else'
  ].map(text => summary.indexOf(text));
  assert.equal(positions.every(position => position >= 0), true);
  assert.deepEqual(positions, [...positions].sort((a,b) => a-b));
  assert.match(summary, /Starting assumption for discussion: client owns code and accounts/);
  assert.match(summary, /Payments, health information, or minors: Not specified/);
});

test('mail link uses fixed recipient and subject, with all answers encoded in body', () => {
  const mailto = buildMailto({
    name:'Jane & Co? #1', contact:'jane@example.com', process:'Need \r\nBcc: someone@example.net & faster',
    outcome:'Automate <review>', compliance:['payments','minors','payments','other']
  });
  const url = new URL(mailto);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'hello@jerbot.dev');
  assert.equal(url.searchParams.get('subject'), 'Jerbot project questionnaire');
  assert.equal(url.searchParams.get('bcc'), null);
  assert.equal(url.searchParams.get('body').includes('Name: Jane & Co? #1'), true);
  assert.equal(url.searchParams.get('body').includes('Need Bcc: someone@example.net & faster'), true);
  assert.equal(url.searchParams.get('body').includes('payments, minors'), true);
  assert.equal(url.searchParams.get('body').includes('other'), false);
  assert.equal(mailto.includes('Jane & Co'), false);
  assert.equal(mailto.includes('someone@example.net'), false);
  assert.equal(mailto.includes('%0D%0ABcc%3A'), false);
});

test('untrusted fields are bounded and cannot change project choices', () => {
  const summary = composeSummary({ name:'A'.repeat(200), process:'B'.repeat(1000), projectType:'wire transfer' });
  assert.match(summary, new RegExp(`Name: ${'A'.repeat(100)}\\r\\n`));
  assert.equal(summary.includes('A'.repeat(101)), false);
  assert.equal(summary.includes('B'.repeat(451)), false);
  assert.match(summary, /Project type: not sure/);
  assert.equal(MAX_MAILTO_LENGTH, 7000);
});
