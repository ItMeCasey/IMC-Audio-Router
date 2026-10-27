/* IMC Audio Router, Chrome / Edge: the "Reroute audio to..." list that opens from the toolbar icon, acting on the tab you are looking at.
   Opening it counts as "the user invoked the extension on this tab", which is what Chrome requires before a tab's sound may be captured. */
const $ = (id) => document.getElementById(id);
const send = (m) => chrome.runtime.sendMessage(Object.assign({ target: 'background' }, m));
let tabId = null, devices = [], route = null;

function say(t, ok) { $('msg').textContent = t || ''; $('msg').className = ok ? 'ok' : ''; }
// show where this tab's sound goes now, and select that entry in the list ('' = the normal output)
function draw(r) {
  route = r; $('state').className = r ? 'on' : ''; $('state').textContent = r ? 'This tab plays on: ' + r.label : 'This tab plays on your normal output.';
  $('dev').value = r ? r.deviceId : '';
}
// ask the background for something; "error" answers become a message under the list
async function ask(m) { const r = await send(m); if (r && r.error) throw new Error(r.error); return r; }

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); tabId = tab && tab.id;
  if (tabId == null || !/^https?:|^file:/.test(tab.url || '')) { $('state').textContent = 'The browser does not allow capturing this kind of page.'; $('dev').disabled = true; return; }
  try {
    const [st, dv] = await Promise.all([ask({ type: 'status', tabId }), ask({ type: 'devices' })]);
    devices = dv.devices; $('names').hidden = !!dv.hasLabels || !devices.length;
    $('dev').innerHTML = ''; for (const d of [{ deviceId: '', label: 'Normal output (not rerouted)' }].concat(devices)) { const o = document.createElement('option'); o.value = d.deviceId; o.textContent = d.label; $('dev').appendChild(o); }
    draw(st.route);
    if (!devices.length) say('No audio outputs found.');
  } catch (e) { say(e.message); }
}

// choosing a device reroutes this tab at once; the first entry gives the sound back to the normal output
$('dev').onchange = async () => {
  const id = $('dev').value, d = devices.find((x) => x.deviceId === id); say(''); $('dev').disabled = true;
  try {
    if (!id) { await ask({ type: 'stop', tabId }); draw(null); say('Back on the normal output.', true); }
    else { await ask({ type: 'route', tabId, deviceId: d.deviceId, label: d.label }); draw({ deviceId: d.deviceId, label: d.label }); say('Done.', true); }
  } catch (e) { say(/Cannot capture|active stream/i.test(e.message) ? 'This tab is already being captured (by this or another extension).' : e.message); draw(route); }
  $('dev').disabled = false;
};
$('grant').onclick = () => { chrome.tabs.create({ url: chrome.runtime.getURL('grant.html') }); window.close(); };
init();
