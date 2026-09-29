const grid = document.querySelector('#device-grid');
const search = document.querySelector('#device-search');
const filters = document.querySelector('#filters');
const count = document.querySelector('#result-count');
const empty = document.querySelector('#empty-state');
const dialog = document.querySelector('#device-dialog');
const dialogContent = document.querySelector('#dialog-content');
let activeFilter = 'all';

const FEATURE_FOCUS = {
  buttons:{x:9,y:59,label:'A・Bボタン'}, touch:{x:29,y:28,label:'タッチロゴ'},
  light:{x:29,y:57,label:'LED画面で明るさを調べる'}, temperature:{x:76,y:51,label:'本体内部で温度を調べる'},
  microphone:{x:34,y:33,label:'マイク'}, accelerometer:{x:72,y:55,label:'加速度センサ'},
  compass:{x:68,y:55,label:'コンパス／磁気センサ'}, led:{x:29,y:57,label:'5×5 LED'},
  speaker:{x:84,y:51,label:'スピーカー'}
};

const SENSOR_CONDITIONS = {
  buttons:['Aボタンを押したら','Bボタンを押したら','AとBを同時に押したら'],
  touch:['ロゴに触ったら','ロゴに触っていなかったら'],
  light:['暗くなったら','明るくなったら','明るさが決めた数字より小さくなったら'],
  temperature:['決めた温度より高くなったら','決めた温度より低くなったら'],
  microphone:['音が大きくなったら','静かになったら'],
  accelerometer:['ゆさぶられたら','傾けたら','落としたら'],
  compass:['北を向いたら','決めた方角を向いたら','磁石が近づいたら'],
  pir:['人の動きを検知したら','人の動きがなくなったら'],
  soil:['土が乾いていたら','土が湿っていたら','水分の数字が決めた値をこえたら'],
  distance:['決めた距離より近づいたら','決めた距離より離れたら'],
  scale:['決めた重さより軽くなったら','決めた重さより重くなったら'],
  'ai-image':['猫を認識したら','決めた物を認識したら'],
  'ai-sound':['拍手を認識したら','決めた音を認識したら'],
  'ai-pose':['手を上げたポーズを認識したら','決めたポーズを認識したら']
};

const matchesFilter = (device, filter) => ({
  all: true, sensor: device.category === 'sensor', actuator: device.category === 'actuator', ai: device.category === 'ai',
  'built-in': device.builtIn, direct: device.connection.includes('直接'), grove: device.connection.includes('Grove'),
  'shield-no': !device.shield, 'shield-yes': device.shield,
  'extension-no': !device.extension || device.extension === '不要',
  'extension-yes': Boolean(device.extension && device.extension !== '不要')
}[filter]);

function renderFilters() {
  filters.innerHTML = FILTERS.map(([id,label]) => `<button type="button" data-filter="${id}" aria-pressed="${id === activeFilter}">${label}</button>`).join('');
}

function cardBadges(d) {
  const badges = [`<span class="badge sca-${d.sca.toLowerCase()}">${d.sca === 'AI' ? '🤖 AI' : d.sca + (d.sca === 'S' ? ' センサ' : ' 動かす')}</span>`];
  badges.push(`<span class="badge neutral">${d.builtIn ? '✅ micro:bit内蔵' : d.connection.includes('Grove') ? '🔌 Grove接続' : '🐊 直接接続'}</span>`);
  if (!d.builtIn && d.category !== 'ai') badges.push(`<span class="badge neutral">${d.shield ? '🔌 Shield必要' : 'Shield不要'}</span>`);
  return badges.join('');
}

const deviceImageAlt = d => d.generatedImage
  ? `${d.name}の実物形状を参考にした実写風AIイラスト`
  : `${d.name}${d.builtIn ? 'が内蔵されたmicro:bit V2' : 'の実物写真'}`;

const deviceImageNote = d => d.generatedImage
  ? '実物の特徴を保った実写風AIイラスト'
  : d.builtIn ? '赤い印の機能が内蔵' : d.category === 'ai' ? 'AIの学習場面' : '外部デバイス';

const microbitDiagram = focus => `<div class="microbit-map compact" role="img" aria-label="micro:bit本体で${focus}の場所を示すオリジナル模式図"><div class="mb-face mb-front"><span class="mb-title">表</span><span class="mb-logo ${focus === 'touch' ? 'is-focus' : ''}">TOUCH<br>LOGO</span><span class="mb-button mb-a ${focus === 'buttons' ? 'is-focus' : ''}">A</span><span class="mb-button mb-b ${focus === 'buttons' ? 'is-focus' : ''}">B</span><span class="mb-leds ${focus === 'light' || focus === 'led' ? 'is-focus' : ''}" aria-hidden="true"></span><span class="mb-mic ${focus === 'microphone' ? 'is-focus' : ''}">MIC</span></div><div class="mb-face mb-back"><span class="mb-title">裏</span><span class="mb-chip mb-chip-main ${focus === 'temperature' ? 'is-focus' : ''}">CPU<br><small>温度</small></span><span class="mb-chip mb-chip-motion ${focus === 'accelerometer' || focus === 'compass' ? 'is-focus' : ''}">動き<br><small>加速度・コンパス</small></span><span class="mb-speaker ${focus === 'speaker' ? 'is-focus' : ''}">SPEAKER</span></div><div class="mb-ports" aria-hidden="true"><b>P0</b><b>P1</b><b>P2</b><b>3V</b><b>GND</b></div></div>`;

function renderDevices() {
  const term = search.value.trim().toLowerCase();
  const visible = DEVICES.filter(d => matchesFilter(d, activeFilter) && `${d.name} ${d.description} ${d.targets} ${d.ideas.join(' ')}`.toLowerCase().includes(term));
  count.textContent = `${visible.length}個のデバイス`;
  empty.hidden = visible.length > 0;
  grid.innerHTML = visible.map(d => `<article class="device-card">
    <div class="device-visual ${d.category} ${FEATURE_FOCUS[d.id] ? 'feature-map' : ''}">${d.builtIn ? microbitDiagram(d.id) : d.image ? `<img src="${d.image}" alt="${deviceImageAlt(d)}">` : `<span aria-hidden="true">${d.icon}</span>`}<small>${d.builtIn ? '本体のどこにあるか分かる模式図' : deviceImageNote(d)}</small></div>
    <div class="device-body"><div class="badges">${cardBadges(d)}</div><h3>${d.name}</h3><p>${d.description}</p>
    <ul class="card-facts"><li><span>接続</span><b>${d.connection}</b></li>${d.ports.length ? `<li><span>おすすめ</span><b>${d.ports.join(' + ')}</b></li>` : ''}<li><span>MakeCode</span><b>${d.operation}</b></li></ul>
    <button type="button" class="detail-button" data-device="${d.id}">詳しく見る</button></div></article>`).join('');
}

function portGraphic(d) {
  if (!d.ports.length) return `<div class="port-card"><span>${d.builtIn ? '✅ つなぐ線はありません' : '🔌 Grove Shieldの表示を確認'}</span></div>`;
  const rows = d.ports.map((p,i) => `<div><b>${p}</b><span>${d.portRoles ? d.portRoles[i] : d.name}</span></div>`).join('');
  return `<div class="port-card"><strong>おすすめポート</strong>${rows}<p>${d.portsRequired === 2 ? 'このセンサはP0とP1を両方使います。' : 'P0が使用中なら、P1やP2など空いているポートへ変更できます。'}</p></div>`;
}

function openDevice(id) {
  const d = DEVICES.find(item => item.id === id); if (!d) return;
  const focus = FEATURE_FOCUS[d.id];
  const focusMarker = focus ? `<span class="feature-marker" style="--focus-x:${focus.x}%;--focus-y:${focus.y}%"><b></b><em>${focus.label}</em></span>` : '';
  dialogContent.innerHTML = `<div class="detail-hero"><div class="detail-visual ${d.category} ${focus ? 'feature-map' : ''}">${d.builtIn ? microbitDiagram(d.id) : d.image ? `<img src="${d.image}" alt="${d.generatedImage ? deviceImageAlt(d) : `${d.name}の実物写真`}">` : `<span aria-hidden="true">${d.icon}</span>`}<small>${d.builtIn ? '黄色く光る部分が、この機能の場所です（オリジナル模式図）' : d.generatedImage ? '実物の特徴を保った実写風AIイラスト' : d.image ? '実物写真' : '画像準備中'}</small></div><div><div class="badges">${cardBadges(d)}</div><h2 id="dialog-title">${d.name}</h2><p>${d.description}</p>${d.builtIn ? `<div class="built-in-insight"><b>✅ 外部デバイスはいりません</b><span>${d.builtInNote || 'この機能はmicro:bit本体に内蔵されています。'}</span></div>` : ''}</div></div>
    <div class="detail-grid"><section><h3>何ができる？</h3><p>${d.description}。${d.ideas.map(x => `「${x}」`).join('、')}などに使えます。</p></section><section><h3>必要なもの</h3><div class="parts-visual">${d.parts.map((p,i) => `${i ? '<b>＋</b>' : ''}<span><i>${p.includes('micro:bit') ? '🧠' : p.includes('Shield') ? '🔌' : d.icon}</i>${p}</span>`).join('')}</div></section>
    <section><h3>Shieldは？</h3><p class="big-answer">${d.shield ? '🔌 必要' : '✅ 不要'}</p><p>${d.shield ? 'Grove Shieldをmicro:bitに取り付けてから使います。' : d.builtIn ? 'micro:bitの中に入っているので、そのまま使えます。' : 'micro:bit側へ直接つなぎます。'}</p></section><section><h3>どこにつなぐ？</h3>${portGraphic(d)}</section>
    <section><h3>MakeCodeで使うもの</h3>${d.path ? `<p class="path">${d.path}</p>` : ''}${d.blockImage ? `<figure class="block-shot"><img src="${d.blockImage}" alt="MakeCodeの入力カテゴリーにある${d.block}などの実際のブロック"><figcaption>「入力」カテゴリーから、${d.block}を探そう。</figcaption></figure>` : `<div class="makecode-block"><small>${d.operation}</small><strong>${d.block}</strong></div>`}${d.ports.length ? '<p class="port-reminder">⚠ 線をつないだポートと、ブロックの番号をそろえよう。</p>' : ''}</section><section><h3>拡張機能</h3><p class="big-answer">${d.extension || '不要'}</p>${d.extensionUrl ? `<a href="${d.extensionUrl}" target="_blank" rel="noreferrer">拡張機能のページを開く</a>` : ''}</section>
    <section class="first-test"><h3>▶ まずこれだけ動かしてみよう</h3><p>${d.firstTest}</p></section><section><h3>💡 こんなの作れるかも！</h3><ul class="idea-list">${d.ideas.map(x=>`<li>${x}</li>`).join('')}</ul></section></div>
    <p class="source-link">製品情報：<a href="${d.source}" target="_blank" rel="noreferrer">公式・商品ページを開く</a>${d.generatedImage ? '<br>画像は実物の形状・端子数・基板色を参考に制作した実写風AIイラストです。' : ''}</p>`;
  dialog.showModal(); document.body.classList.add('modal-open');
}

filters.addEventListener('click', e => { const button = e.target.closest('[data-filter]'); if (!button) return; activeFilter = button.dataset.filter; renderFilters(); renderDevices(); });
search.addEventListener('input', renderDevices);
grid.addEventListener('click', e => { const button = e.target.closest('[data-device]'); if (button) openDevice(button.dataset.device); });
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
document.querySelectorAll('[data-filter-link]').forEach(a => a.addEventListener('click', () => { activeFilter = a.dataset.filterLink; renderFilters(); renderDevices(); }));

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); document.querySelector('#main-nav').classList.toggle('open', !open); });
document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', () => { menuButton.setAttribute('aria-expanded','false'); document.querySelector('#main-nav').classList.remove('open'); }));

const sensorSelect = document.querySelector('#sensor-select');
const sensor2Select = document.querySelector('#sensor2-select');
const actuatorSelect = document.querySelector('#actuator-select');
const conditionSelect = document.querySelector('#condition-select');
const builderSensors = DEVICES.filter(d => d.category === 'sensor' || d.category === 'ai');
const builderActuators = DEVICES.filter(d => d.category === 'actuator');
sensorSelect.innerHTML = builderSensors.map(d => `<option value="${d.id}">${d.icon} ${d.name}</option>`).join('');
sensor2Select.innerHTML += builderSensors.map(d => `<option value="${d.id}">${d.icon} ${d.name}</option>`).join('');
actuatorSelect.innerHTML = builderActuators.map(d => `<option value="${d.id}">${d.icon} ${d.name}</option>`).join('');
sensorSelect.value = 'soil'; actuatorSelect.value = 'pump'; conditionSelect.value = '乾いていたら';

function updateConditionOptions() {
  const first = SENSOR_CONDITIONS[sensorSelect.value] || ['変化したら'];
  const second = sensor2Select.value ? (SENSOR_CONDITIONS[sensor2Select.value] || ['変化したら']) : [];
  const options = second.length
    ? first.slice(0,2).flatMap(a => second.slice(0,2).map(b => `「${a}」かつ「${b}」`))
    : first;
  const previous = conditionSelect.value;
  conditionSelect.innerHTML = options.map(value => `<option value="${value}">${value}</option>`).join('');
  conditionSelect.value = options.includes(previous) ? previous : options[0];
}

function syncSecondSensorChoices() {
  [...sensor2Select.options].forEach(option => {
    option.disabled = option.value !== '' && option.value === sensorSelect.value;
  });
  if (sensor2Select.value === sensorSelect.value) sensor2Select.value = '';
}

function updateBuilder() {
  const s = DEVICES.find(d => d.id === sensorSelect.value), s2 = sensor2Select.value ? DEVICES.find(d => d.id === sensor2Select.value) : null, a = DEVICES.find(d => d.id === actuatorSelect.value), condition = conditionSelect.value;
  const sensorNames = s2 ? `${s.name}<small>＋ ${s2.name}</small>` : s.name;
  document.querySelector('#result-flow').innerHTML = `<div><b>S</b><span>${s.icon}${s2 ? s2.icon : ''}</span><strong>${sensorNames}</strong></div><i>→</i><div><b>C</b><span>🧠</span><strong>micro:bit<small>${condition}</small></strong></div><i>→</i><div><b>A</b><span>${a.icon}</span><strong>${a.name}</strong></div>`;
  const knownTitles = {'soil:pump':'自動水やり装置が作れそう！','pir:servo':'人が来ると開くドアが作れそう！','distance:servo':'近づくと開くドアが作れそう！'};
  const catWater = [s,s2].filter(Boolean).some(x=>x.id==='ai-image') && [s,s2].filter(Boolean).some(x=>x.id==='scale') && a.id==='pump';
  document.querySelector('#idea-title').textContent = catWater ? '猫が来て、水皿が空なら水を入れる仕組みが作れそう！' : knownTitles[`${s.id}:${a.id}`] || `${s.description.replace('調べる','調べて')}、${a.description.replace('知らせる','知らせる')}仕組みが作れそう！`;
  const parts = [...new Set(['micro:bit',...s.parts.filter(x=>x!=='micro:bit'),...(s2 ? s2.parts.filter(x=>x!=='micro:bit') : []),...a.parts.filter(x=>x!=='micro:bit')])];
  document.querySelector('#parts-list').innerHTML = parts.map(x=>`<li>✓ ${x}</li>`).join('');
  const directDevices = [s,s2,a].filter(d => d && !d.builtIn && d.portsRequired);
  const assignments = []; let next = 0;
  directDevices.forEach(d => { if (d.portsRequired === 2) { assignments.push(['P0',`${d.name} Trig`],['P1',`${d.name} Echo`]); next = 2; } else { assignments.push([`P${next}`,d.name]); next++; } });
  while (assignments.length < 3) assignments.push([`P${assignments.length}`,'空き']);
  document.querySelector('#port-plan').innerHTML = assignments.slice(0,3).map(([p,n])=>`<div class="${n==='空き'?'free':''}"><b>${p}</b><span>${n}</span></div>`).join('');
  const warning = document.querySelector('#builder-warning');
  if (next > 3) { warning.hidden = false; warning.textContent = '⚠ P0・P1・P2では足りません。接続方法を見直すか、Grove Shieldを使う構成を考えよう。'; } else { warning.hidden = true; }
}
sensorSelect.addEventListener('change',()=>{ syncSecondSensorChoices(); updateConditionOptions(); updateBuilder(); });
sensor2Select.addEventListener('change',()=>{ updateConditionOptions(); updateBuilder(); });
[actuatorSelect,conditionSelect].forEach(x=>x.addEventListener('change',updateBuilder));

renderFilters(); renderDevices(); syncSecondSensorChoices(); updateConditionOptions(); updateBuilder();
