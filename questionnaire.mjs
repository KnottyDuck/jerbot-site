const RECIPIENT = 'hello@jerbot.dev';
const SUBJECT = 'Jerbot project questionnaire';
export const MAX_MAILTO_LENGTH = 7000;

const LIMITS = Object.freeze({
  name:100, business:120, city:100, website:200, contact:150, timeZone:80,
  process:450, processOwner:150, frequency:120, cost:150,
  projectType:20, outcome:300, users:180, userCount:100, devices:180,
  mustHaves:400, niceToHaves:400, tools:350, data:350, assets:350,
  budget:120, deadline:120, otherConstraints:300, ownership:300,
  success:350, anythingElse:350
});
const PROJECT_TYPES = new Set(['game','website','web app','mobile app','automation','not sure']);
const COMPLIANCE_TYPES = new Set(['payments','health','minors']);

function clean(value, limit) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function composeSummary(input) {
  const value = name => clean(input[name], LIMITS[name]);
  const show = name => value(name) || 'Not provided';
  const type = PROJECT_TYPES.has(value('projectType')) ? value('projectType') : 'not sure';
  const compliance = Array.isArray(input.compliance)
    ? [...new Set(input.compliance.filter(item => COMPLIANCE_TYPES.has(item)))].join(', ') || 'Not specified'
    : 'Not specified';
  return [
    'Jerbot project questionnaire',
    '',
    '1. About you',
    `Name: ${show('name')}`,
    `Business or organization: ${show('business')}`,
    `City or region: ${show('city')}`,
    `Website: ${show('website')}`,
    `Best contact: ${show('contact')}`,
    `Time zone: ${show('timeZone')}`,
    '',
    '2. The problem',
    `Process: ${show('process')}`,
    `Who handles it: ${show('processOwner')}`,
    `How often: ${show('frequency')}`,
    `Cost in hours or dollars: ${show('cost')}`,
    '',
    '3. What you want',
    `Project type: ${type}`,
    `Outcome: ${show('outcome')}`,
    '',
    '4. Users',
    `Who: ${show('users')}`,
    `How many: ${show('userCount')}`,
    `Devices: ${show('devices')}`,
    '',
    '5. Priorities',
    `Must-haves: ${show('mustHaves')}`,
    `Nice-to-haves: ${show('niceToHaves')}`,
    '',
    '6. Existing tools and data',
    `Tools: ${show('tools')}`,
    `Data to connect: ${show('data')}`,
    '',
    '7. Assets you have',
    `Brand, copy, art, or data: ${show('assets')}`,
    '',
    '8. Constraints',
    `Budget band: ${show('budget')}`,
    `Deadline: ${show('deadline')}`,
    `Payments, health information, or minors: ${compliance}`,
    `Other: ${show('otherConstraints')}`,
    '',
    '9. Ownership and hosting',
    'Starting assumption for discussion: client owns code and accounts; final terms agreed in writing.',
    `Different preference: ${show('ownership')}`,
    '',
    '10. Success in 90 days',
    show('success'),
    '',
    '11. Anything else',
    show('anythingElse')
  ].join('\r\n');
}

export function buildMailto(input) {
  return `mailto:${RECIPIENT}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(composeSummary(input))}`;
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('project-questionnaire');
  const status = document.getElementById('questionnaire-status');
  const controls = document.getElementById('questionnaire-controls');
  if (form && status && controls) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const input = Object.fromEntries(data.entries());
      input.compliance = data.getAll('compliance');
      const mailto = buildMailto(input);
      if (mailto.length > MAX_MAILTO_LENGTH) {
        status.textContent = 'This summary is too long for a reliable email link. Shorten a few answers and try again; nothing has been sent or saved.';
        return;
      }
      status.textContent = 'Your mail app should open a draft. Review and send it there; this page has not sent anything.';
      const link = document.createElement('a');
      link.href = mailto;
      link.click();
    });
    controls.disabled = false;
  }
}
