/* 「오늘 할일」 공통 로직 — index / week / month 세 페이지가 함께 씁니다.
   외부 의존성 없음. 모든 날짜는 로컬 시간 기준입니다. */
var App = (function () {
  'use strict';

  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  /* ── 항목 정의 ──
     g: 'must'  꼭 해야 할 일
        'plus'  더불어 할 일        (must 와 함께 '해야 할 일' 7개를 이룸)
        'avoid' 하지 말아야 할 일   (체크 = 했다 = 감점)
     d: 인라인 SVG path 목록 */
  var ITEMS = [
    { k: 'exercise', g: 'must', w: 2, label: '운동', sub: '1시간 이상',
      d: ['M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11'] },
    { k: 'english', g: 'must', w: 2, label: '영어공부', sub: '30분 이상',
      d: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z',
          'M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5', 'M9 8h7M9 11.5h5'] },
    { k: 'ai', g: 'must', w: 2, label: 'AI 활용', sub: '1번 이상',
      d: ['M11 3l1.8 4.4L17.2 9.2l-4.4 1.8L11 15.4 9.2 11 4.8 9.2 9.2 7.4z',
          'M17.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z'] },

    { k: 'reading', g: 'plus', w: 1, label: '독서', sub: '한 주에 한 권',
      d: ['M12 6.6C10.5 5.1 8 4.4 4.5 4.8v12.6C8 17 10.5 17.7 12 19.3',
          'M12 6.6c1.5-1.5 4-2.2 7.5-1.8v12.6c-3.5-.4-6 .3-7.5 1.9', 'M12 6.6v12.7'] },
    { k: 'major', g: 'plus', w: 1, label: '전공공부', sub: '노동법 책 읽기',
      d: ['M12 4L2.5 8.5 12 13l9.5-4.5z',
          'M6.5 10.8v4.4c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.4', 'M21.5 8.5v5'] },
    { k: 'food', g: 'plus', w: 1, label: '좋은 음식 먹기', sub: '',
      d: ['M12 8c-1.3-1.6-3.1-2-4.6-1.2C5.6 7.8 4.8 10.3 5.6 13c.8 2.7 2.6 5 4.1 5.7.9.4 1.5.1 2.3.1s1.4.3 2.3-.1c1.5-.7 3.3-3 4.1-5.7.8-2.7 0-5.2-1.8-6.2C14.9 6 13.3 6.4 12 8z',
          'M12 8V5.4', 'M12.2 5.4c1.4 0 2.5-1.1 2.5-2.5-1.4 0-2.5 1.1-2.5 2.5z'] },
    { k: 'writing', g: 'plus', w: 1, label: '좋은 글', sub: '좋은 영상',
      d: ['M4 20l1.2-4.2L16.4 4.6a2 2 0 0 1 2.8 0l.9.9a2 2 0 0 1 0 2.8L8.9 19.5 4 20z',
          'M15.2 5.8l3 3'] },

    { k: 'regret', g: 'avoid', w: 2, label: '후회', sub: '지난 일에 대한 집착',
      d: ['M3.5 9.5h5v-5', 'M4.3 9.6A8 8 0 1 1 4.6 14'] },
    { k: 'overeat', g: 'avoid', w: 2, label: '과식', sub: '간식 / 야식 금지',
      d: ['M6 3v6.5a2 2 0 0 0 4 0V3M8 11.5V21', 'M16.8 3c-1.5 1-2.3 2.7-2.3 4.7 0 1.7.8 2.9 2.3 3.4V21'] },
    { k: 'drink', g: 'avoid', w: 2, label: '과음', sub: '꼭 마셔야 할 때 기분 좋게',
      d: ['M7.5 3h9l-.7 5.6A3.9 3.9 0 0 1 12 12a3.9 3.9 0 0 1-3.8-3.4z', 'M12 12v6.5M8.5 18.5h7'] }
  ];

  var GROUPS = [
    { g: 'must', title: '오늘 꼭 할 일',
      d: ['M12 3.2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.4l5.9-.9z'] },
    { g: 'plus', title: '더불어 할 일',
      d: ['M12 21v-7', 'M12 14c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6z',
          'M12 14c0-2.8-2.2-5-5-5 0 2.8 2.2 5 5 5z'] },
    { g: 'avoid', title: '하지 말아야 할 일', avoid: true,
      d: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z', 'M6 6l12 12'] }
  ];

  var KEYS = ITEMS.map(function (i) { return i.k; });
  var GOALS = ITEMS.filter(function (i) { return i.g !== 'avoid'; });  // 해야 할 일 7개
  var AVOIDS = ITEMS.filter(function (i) { return i.g === 'avoid'; }); // 금지 3개

  /* 가중치(w): 꼭 해야 할 일 ×2, 더불어 할 일 ×1, 금지는 어길 때마다 −2.
     만점 = 3×2 + 4×1 = 10점 */
  var MAX = GOALS.reduce(function (sum, i) { return sum + i.w; }, 0);

  /* ── 날짜 유틸 ── */
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function startOfWeek(d) { return addDays(d, -d.getDay()); }          // 일요일 시작
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
  function daysInMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
  function today() { return midnight(new Date()); }
  function ymd(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function sameDay(a, b) { return +midnight(a) === +midnight(b); }
  function fmtDay(d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + DOW[d.getDay()] + ')'; }

  /* ── 저장 ── */
  function read(date) {
    try {
      var v = JSON.parse(localStorage.getItem('todo:' + ymd(date)));
      if (Object.prototype.toString.call(v) !== '[object Array]') return [];
      return v.filter(function (k) { return KEYS.indexOf(k) !== -1; });
    } catch (e) { return []; }
  }
  function write(date, list) {
    try {
      if (list.length) localStorage.setItem('todo:' + ymd(date), JSON.stringify(list));
      else localStorage.removeItem('todo:' + ymd(date));
    } catch (e) {}
  }
  function readMemo(date) {
    try { return localStorage.getItem('memo:' + ymd(date)) || ''; } catch (e) { return ''; }
  }
  function writeMemo(date, html) {
    try {
      if (memoIsBlank(html)) localStorage.removeItem('memo:' + ymd(date));
      else localStorage.setItem('memo:' + ymd(date), html);
    } catch (e) {}
  }

  /* ── 메모 서식 ──
     메모는 글자색·형광펜을 담을 수 있어야 해서 HTML 로 저장합니다.
     저장된 값을 그대로 innerHTML 에 넣으므로, 넣기 전에 반드시 걸러 냅니다.
     허용: 굵게/기울임/밑줄/줄바꿈/문단, 그리고 색·배경색·굵기만 남긴 span. */
  var MEMO_TAGS = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, BR: 1, DIV: 1, P: 1, SPAN: 1, FONT: 1 };
  /* 이 태그들은 껍데기를 벗기면 알맹이가 글자로 새어 나오므로 통째로 버립니다. */
  var MEMO_DROP = { SCRIPT: 1, STYLE: 1, TEMPLATE: 1, NOSCRIPT: 1, IFRAME: 1, OBJECT: 1 };
  var COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|transparent)$/i;
  var WEIGHT_RE = /^(bold|bolder|[5-9]00)$/i;

  function scrubMemo(root) {
    var kids = Array.prototype.slice.call(root.childNodes);
    kids.forEach(function (node) {
      if (node.nodeType === 3) return;                 // 글자는 그대로
      if (node.nodeType !== 1) { root.removeChild(node); return; }  // 주석 등은 버림
      if (MEMO_DROP[node.tagName]) { root.removeChild(node); return; }

      scrubMemo(node);

      if (!MEMO_TAGS[node.tagName]) {                  // 허용 밖 태그는 껍데기만 벗깁니다
        while (node.firstChild) root.insertBefore(node.firstChild, node);
        root.removeChild(node);
        return;
      }

      /* 속성은 전부 털어 내고, 안전한 스타일 셋만 되돌려 놓습니다.
         (style 을 지우기 전에 값을 먼저 읽어 둡니다.) */
      var color = node.style.color;
      var back = node.style.backgroundColor;
      var weight = node.style.fontWeight;
      var names = Array.prototype.slice.call(node.attributes).map(function (a) { return a.name; });
      names.forEach(function (n) { node.removeAttribute(n); });

      if (COLOR_RE.test(color)) node.style.color = color;
      if (COLOR_RE.test(back)) node.style.backgroundColor = back;
      if (WEIGHT_RE.test(weight)) node.style.fontWeight = weight;
    });
  }

  function sanitizeMemo(html) {
    var doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = String(html == null ? '' : html);
    scrubMemo(doc.body);
    return doc.body.innerHTML;
  }

  function memoIsBlank(html) {
    if (!html) return true;
    var d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/[\s ]+/g, '') === '';
  }

  /* 예전 메모는 서식 없는 글자였습니다. 읽을 때 그때그때 HTML 로 옮깁니다. */
  function memoHtml(date) {
    var raw = readMemo(date);
    if (!raw) return '';
    if (raw.indexOf('<') === -1) {
      var d = document.createElement('div');
      d.textContent = raw;
      return d.innerHTML.replace(/\n/g, '<br>');
    }
    return sanitizeMemo(raw);
  }

  function memoText(date) {
    var d = document.createElement('div');
    d.innerHTML = memoHtml(date);
    return (d.textContent || '').trim();
  }

  function hasMemo(date) { return memoText(date) !== ''; }

  /* ── 일회성 마이그레이션 ──
     예전 버전에서 금지 항목 체크는 "잘 참았다"(성공)라는 뜻이었습니다.
     지금은 "했다"(어김)라는 정반대 뜻이므로, 그대로 두면 잘 참은 날이
     전부 어긴 날로 뒤집혀 보입니다. 옛 기록에서 금지 키만 걷어냅니다.
     (옛 데이터에는 '어겼다'는 정보가 애초에 없었으므로 손실이 아닙니다.) */
  function migrate() {
    try {
      if (localStorage.getItem('schema') === '2') return;
      var avoidKeys = AVOIDS.map(function (i) { return i.k; });
      var i, k, v, cleaned, changedKeys = [];
      for (i = 0; i < localStorage.length; i++) {
        k = localStorage.key(i);
        if (k && k.indexOf('todo:') === 0) changedKeys.push(k);
      }
      changedKeys.forEach(function (key) {
        try {
          v = JSON.parse(localStorage.getItem(key));
          if (Object.prototype.toString.call(v) !== '[object Array]') return;
          cleaned = v.filter(function (x) { return avoidKeys.indexOf(x) === -1; });
          if (cleaned.length === v.length) return;
          if (cleaned.length) localStorage.setItem(key, JSON.stringify(cleaned));
          else localStorage.removeItem(key);
        } catch (e) {}
      });
      localStorage.setItem('schema', '2');
    } catch (e) {}
  }

  /* ── 점수 ──
     해낸 일은 가중치만큼 더하고, 금지를 어기면 가중치만큼 뺍니다.
     음수는 0으로 자릅니다. */
  function weightOf(list) {
    return list.reduce(function (sum, i) { return sum + i.w; }, 0);
  }

  function stats(date) {
    var on = read(date);
    var done = [], missed = [], violated = [];
    ITEMS.forEach(function (it) {
      var checked = on.indexOf(it.k) !== -1;
      if (it.g === 'avoid') { if (checked) violated.push(it); }
      else if (checked) done.push(it);
      else missed.push(it);
    });
    var earned = weightOf(done);
    var penalty = weightOf(violated);
    var raw = earned - penalty;
    var score = raw < 0 ? 0 : raw;
    return {
      done: done, missed: missed, violated: violated,
      earned: earned, penalty: penalty,
      raw: raw, score: score, max: MAX,
      pct: MAX ? score / MAX : 0,
      recorded: on.length > 0
    };
  }

  function pctText(p) { return Math.round(p * 100) + '%'; }

  /* ── 진척도 이모티콘 ──
     신호등 세 색으로 가다가, 만점이면 별을 답니다.
     max 는 그 칸의 상한(이하)입니다. 50% 이하 / 70% 이하 / 90% 이하 / 그 위.
     배점이 정수라 90% 초과 구간에 들어갈 수 있는 값은 100% 하나뿐입니다. */
  var TIERS = [
    { max: .5, emoji: '🔴', label: '다시 해보자', tone: 't-red' },
    { max: .7, emoji: '🟡', label: '조금 더 하자!', tone: 't-amber' },
    { max: .9, emoji: '🟢', label: '수고했어!', tone: 't-green' },
    { max: 1, emoji: '💎', label: '참 잘했어!', tone: 't-gem' }
  ];

  var TONES = TIERS.map(function (t) { return t.tone; });

  function tier(pct) {
    for (var i = 0; i < TIERS.length; i++) {
      if (pct <= TIERS[i].max) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  /* 기록이 없거나 아직 오지 않은 날에는 이모티콘을 붙이지 않습니다. */
  function moodOf(date) {
    if (date > today()) return null;
    var s = stats(date);
    return s.recorded ? tier(s.pct) : null;
  }

  /* ── 연속 기록 ──
     초록불 이상(70% 초과)인 날이 며칠째 이어지는지 셉니다.
     오늘은 아직 진행 중이라, 이미 조건을 넘겼을 때만 함께 셉니다.
     (그러지 않으면 아침마다 연속이 끊긴 것처럼 보입니다.) */
  var STREAK_BAR = TIERS[1].max;

  function streak() {
    var n = 0, d = today(), s = stats(d);
    if (s.recorded && s.pct > STREAK_BAR) n++;

    d = addDays(d, -1);
    /* 기록이 없는 날에서 멈추므로 언젠가는 끝나지만, 만약을 위해 한도를 둡니다. */
    for (var guard = 0; guard < 3650; guard++) {
      var x = stats(d);
      if (!x.recorded || x.pct <= STREAK_BAR) break;
      n++;
      d = addDays(d, -1);
    }
    return n;
  }

  /* 이모티콘 + 한 줄 평을 요소에 채워 넣습니다. t 가 없으면 회색 안내로 둡니다. */
  function paintMood(el, t, fallback) {
    el.textContent = '';
    var e = document.createElement('span');
    e.className = 'moodemoji';
    e.setAttribute('aria-hidden', 'true');
    e.textContent = t ? t.emoji : '—';
    var s = document.createElement('span');
    s.className = 'moodtext';
    s.textContent = t ? t.label : (fallback || '아직 기록이 없습니다');
    el.appendChild(e);
    el.appendChild(s);

    /* 글자색은 CSS 가 정합니다. 밝은 화면과 어두운 화면에서 값이 달라야 해서
       여기서는 어느 단계인지만 알려 줍니다. */
    el.classList.toggle('moodoff', !t);
    TONES.forEach(function (c) { el.classList.remove(c); });
    if (t) el.classList.add(t.tone);
  }

  /* ── 체크리스트 위젯 ──
     container 안에 3그룹을 만들고, load(date) 로 날짜를 갈아끼웁니다. */
  function makeChecklist(container, onChange) {
    var cur = null;
    var inputs = {};

    GROUPS.forEach(function (grp) {
      var sec = document.createElement('section');
      sec.className = 'group g-' + grp.g;

      // 섹션 라벨: 아이콘 + 제목 + 가로선 + 개수 알약
      var head = document.createElement('div');
      head.className = 'seclabel';
      head.innerHTML =
        '<span class="badge" aria-hidden="true"><svg viewBox="0 0 24 24">' +
        grp.d.map(function (p) { return '<path d="' + p + '"/>'; }).join('') +
        '</svg></span>';
      var h3 = document.createElement('h3');
      h3.textContent = grp.title;
      var rule = document.createElement('span');
      rule.className = 'rule';
      var gc = document.createElement('span');
      gc.className = 'pill';
      head.appendChild(h3); head.appendChild(rule); head.appendChild(gc);
      sec.appendChild(head);

      var ol = document.createElement('ol');
      ol.className = 'todo';

      ITEMS.filter(function (i) { return i.g === grp.g; }).forEach(function (it) {
        var li = document.createElement('li');
        var label = document.createElement('label');
        label.className = 'row';

        var input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'chk';
        input.setAttribute('data-k', it.k);
        inputs[it.k] = input;

        var icon = document.createElement('span');
        icon.className = 'icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<svg viewBox="0 0 24 24">' +
          it.d.map(function (p) { return '<path d="' + p + '"/>'; }).join('') + '</svg>';

        var text = document.createElement('span');
        text.className = 'label';
        var main = document.createElement('span');
        main.className = 'main';
        main.textContent = it.label;
        text.appendChild(main);
        if (it.sub) {
          var desc = document.createElement('span');
          desc.className = 'desc';
          desc.textContent = it.sub;
          text.appendChild(desc);
        }

        // 순번 대신 배점을 보여 줍니다 (+2 / +1 / −2)
        var num = document.createElement('span');
        num.className = 'num' + (it.g === 'avoid' ? ' minus' : '');
        num.textContent = (it.g === 'avoid' ? '−' : '+') + it.w;
        num.setAttribute('aria-hidden', 'true');

        label.appendChild(input);
        label.appendChild(icon);
        label.appendChild(text);
        label.appendChild(num);
        li.appendChild(label);
        ol.appendChild(li);

        input.addEventListener('change', function () {
          if (!cur) return;
          var list = [];
          ITEMS.forEach(function (x) { if (inputs[x.k].checked) list.push(x.k); });
          write(cur, list);
          refreshCounts();
          if (onChange) onChange(cur);
        });
      });

      sec.appendChild(ol);
      sec._count = gc;
      sec._list = ol;
      sec._g = grp.g;
      container.appendChild(sec);
    });

    var sections = Array.prototype.slice.call(container.querySelectorAll('.group'));

    function refreshCounts() {
      sections.forEach(function (sec) {
        var mine = ITEMS.filter(function (i) { return i.g === sec._g; });
        var hit = mine.filter(function (i) { return inputs[i.k].checked; });
        var pts = weightOf(hit);
        if (sec._g === 'avoid') {
          sec._count.textContent = hit.length ? '−' + pts + '점' : '지킴';
          sec._count.classList.toggle('bad', hit.length > 0);
          sec._count.classList.toggle('good', hit.length === 0);
        } else {
          sec._count.textContent = pts + ' / ' + weightOf(mine) + '점';
          sec._count.classList.toggle('good', hit.length === mine.length);
        }
      });
    }

    function load(date) {
      cur = date;
      var on = read(date);
      var locked = date > today();
      ITEMS.forEach(function (it) {
        inputs[it.k].checked = on.indexOf(it.k) !== -1;
        inputs[it.k].disabled = locked;
      });
      sections.forEach(function (sec) { sec._list.classList.toggle('locked', locked); });
      refreshCounts();
    }

    return { load: load, inputs: inputs };
  }

  /* ── 메모 입력칸 ──
     타이핑 도중 날짜가 바뀌어도 엉뚱한 날에 저장되지 않도록,
     항상 '그 입력칸이 담고 있던 날짜'(owner)에 씁니다. */
  function bindMemo(editor, stateEl, onSaved) {
    var owner = null, loaded = '', timer, saved = null;

    function current() {
      var html = sanitizeMemo(editor.innerHTML);
      return memoIsBlank(html) ? '' : html;
    }

    function flush() {
      clearTimeout(timer);
      if (!owner) return false;
      var v = current();
      if (v === loaded) return false;
      writeMemo(owner, v);
      loaded = v;
      return true;
    }

    function done() {
      if (flush()) {
        if (stateEl) stateEl.textContent = '저장됨';
        if (onSaved) onSaved();
      }
    }

    function queue() {
      clearTimeout(timer);
      if (stateEl) stateEl.textContent = '';
      timer = setTimeout(done, 400);
    }

    /* 서식 단추를 누르면 편집칸에서 선택이 잠깐 풀립니다.
       마지막으로 편집칸 안에 있던 영역을 기억해 두었다가 되돌립니다. */
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      var r = sel.getRangeAt(0);
      if (editor.contains(r.commonAncestorContainer)) saved = r.cloneRange();
    });

    function exec(cmd, value) {
      if (editor.isContentEditable === false) return;
      editor.focus();
      var sel = window.getSelection();
      var inside = sel && sel.rangeCount &&
        editor.contains(sel.getRangeAt(0).commonAncestorContainer);
      if (!inside && saved) { sel.removeAllRanges(); sel.addRange(saved); }
      try {
        document.execCommand('styleWithCSS', false, true);
        /* 형광펜 명령 이름은 브라우저마다 달라서 한 번 더 시도합니다. */
        if (!document.execCommand(cmd, false, value) && cmd === 'hiliteColor') {
          document.execCommand('backColor', false, value);
        }
      } catch (e) {}
      queue();
    }

    editor.addEventListener('input', queue);
    editor.addEventListener('blur', done);

    /* 붙여넣기는 글자만 받습니다. 바깥에서 서식이 통째로 넘어오는 걸 막습니다. */
    editor.addEventListener('paste', function (e) {
      if (!e.clipboardData) return;
      e.preventDefault();
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    });

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) flush();
    });

    return {
      load: function (date) {
        flush();
        owner = date;
        saved = null;
        loaded = memoHtml(date);
        editor.innerHTML = loaded;
        var locked = date > today();
        editor.contentEditable = locked ? 'false' : 'true';
        editor.classList.toggle('locked', locked);
        if (stateEl) stateEl.textContent = '';
      },
      flush: flush,
      exec: exec
    };
  }

  /* ── 메모 위젯 ──
     제목 + 서식 단추 + 편집칸을 통째로 만들어 container 에 붙입니다. */
  var memoSeq = 0;

  var MEMO_COLORS = [
    { v: '#f43f5e', name: '빨강' },
    { v: '#f97316', name: '주황' },
    { v: '#10b981', name: '초록' },
    { v: '#3b82f6', name: '파랑' },
    { v: '#a855f7', name: '보라' }
  ];

  /* 형광펜은 반투명입니다. 밝은 화면과 어두운 화면 양쪽에서 글자가 읽힙니다. */
  var MEMO_MARKS = [
    { v: 'rgba(250, 204, 21, .40)', name: '노란 형광펜' },
    { v: 'rgba(52, 211, 153, .34)', name: '초록 형광펜' },
    { v: 'rgba(96, 165, 250, .34)', name: '파란 형광펜' },
    { v: 'rgba(244, 114, 182, .32)', name: '분홍 형광펜' }
  ];

  function makeMemo(container, title, onSaved) {
    var id = 'memo-' + (++memoSeq);

    var wrap = document.createElement('section');
    wrap.className = 'memowrap';

    var head = document.createElement('div');
    head.className = 'memohead';
    var cap = document.createElement('span');
    cap.className = 'memotitle';
    cap.id = id + '-title';
    cap.textContent = title;
    var state = document.createElement('span');
    state.className = 'memostate';
    state.setAttribute('aria-live', 'polite');
    head.appendChild(cap);
    head.appendChild(state);

    var tools = document.createElement('div');
    tools.className = 'memotools';
    tools.setAttribute('role', 'toolbar');
    tools.setAttribute('aria-label', '글자 꾸미기');

    var editor = document.createElement('div');
    editor.className = 'memo';
    editor.id = id;
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-labelledby', id + '-title');
    editor.setAttribute('data-placeholder', '남겨 두고 싶은 것이 있다면…');

    wrap.appendChild(head);
    wrap.appendChild(tools);
    wrap.appendChild(editor);
    container.appendChild(wrap);

    var bound = bindMemo(editor, state, onSaved);

    function button(cls, label, cmd, value, color) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.title = label;
      b.setAttribute('aria-label', label);
      if (color) b.style.setProperty('--c', color);
      b.addEventListener('click', function () { bound.exec(cmd, value); });
      return b;
    }

    function sep() {
      var s = document.createElement('span');
      s.className = 'mtsep';
      s.setAttribute('aria-hidden', 'true');
      return s;
    }

    var bold = button('mtbtn mtbold', '굵게', 'bold');
    bold.textContent = 'B';
    tools.appendChild(bold);
    tools.appendChild(sep());

    MEMO_COLORS.forEach(function (c) {
      tools.appendChild(button('swatch', c.name + ' 글자', 'foreColor', c.v, c.v));
    });
    tools.appendChild(sep());

    MEMO_MARKS.forEach(function (m) {
      tools.appendChild(button('swatch mark', m.name, 'hiliteColor', m.v, m.v));
    });
    tools.appendChild(sep());

    var clear = button('mtbtn', '서식 지우기', 'removeFormat');
    clear.textContent = '지우기';
    tools.appendChild(clear);

    /* 단추를 눌러도 편집칸에서 포커스가 빠지지 않게 합니다. */
    tools.addEventListener('mousedown', function (e) { e.preventDefault(); });

    return bound;
  }

  /* ── 백업 ──
     기록은 이 기기의 localStorage 에만 있습니다. 브라우저 데이터를 지우거나
     앱을 다시 깔거나 기기를 바꾸면 되살릴 방법이 없으므로,
     통째로 내보내고 들여올 수 있게 합니다. */
  var BACKUP_TAG = 'todayplan';
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function exportData() {
    var days = {};
    var i, key, date, slot;

    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i);
      if (!key) continue;

      if (key.indexOf('todo:') === 0) {
        date = key.slice(5);
        if (!DATE_RE.test(date)) continue;
        slot = days[date] || (days[date] = {});
        try {
          var v = JSON.parse(localStorage.getItem(key));
          if (Object.prototype.toString.call(v) === '[object Array]') slot.todo = v;
        } catch (e) {}
      } else if (key.indexOf('memo:') === 0) {
        date = key.slice(5);
        if (!DATE_RE.test(date)) continue;
        slot = days[date] || (days[date] = {});
        slot.memo = localStorage.getItem(key) || '';
      }
    }

    return {
      app: BACKUP_TAG,
      version: 1,
      exportedAt: new Date().toISOString(),
      dayCount: Object.keys(days).length,
      days: days
    };
  }

  /* 들여오기는 '합치기'입니다. 파일에 있는 날짜만 덮어쓰고 나머지는 그대로 둡니다.
     엉뚱한 파일을 골랐을 때 기존 기록이 통째로 날아가지 않게 하려는 것입니다. */
  function importData(raw) {
    var data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (e) { return { ok: false, reason: '읽을 수 없는 파일입니다' }; }

    if (!data || data.app !== BACKUP_TAG || !data.days || typeof data.days !== 'object') {
      return { ok: false, reason: '「오늘 할일」 백업 파일이 아닙니다' };
    }

    var dates = Object.keys(data.days).filter(function (d) { return DATE_RE.test(d); });
    if (!dates.length) return { ok: false, reason: '들여올 기록이 없습니다' };

    var written = 0;
    dates.forEach(function (date) {
      var day = data.days[date];
      if (!day || typeof day !== 'object') return;

      /* 모르는 항목 키는 걸러 냅니다. */
      var list = Object.prototype.toString.call(day.todo) === '[object Array]'
        ? day.todo.filter(function (k) { return KEYS.indexOf(k) !== -1; })
        : [];
      try {
        if (list.length) localStorage.setItem('todo:' + date, JSON.stringify(list));
        else localStorage.removeItem('todo:' + date);
      } catch (e) {}

      /* 메모는 남이 만든 파일일 수도 있으므로 반드시 걸러서 넣습니다. */
      var memo = typeof day.memo === 'string' ? sanitizeMemo(day.memo) : '';
      try {
        if (memoIsBlank(memo)) localStorage.removeItem('memo:' + date);
        else localStorage.setItem('memo:' + date, memo);
      } catch (e) {}

      written++;
    });

    return { ok: true, days: written };
  }

  /* ── 백업 위젯 ── */
  function makeBackup(container, onImported) {
    var wrap = document.createElement('section');
    wrap.className = 'backup';

    var head = document.createElement('div');
    head.className = 'backuphead';
    var title = document.createElement('span');
    title.className = 'backuptitle';
    title.textContent = '기록 백업';
    var state = document.createElement('span');
    state.className = 'backupstate';
    state.setAttribute('aria-live', 'polite');
    head.appendChild(title);
    head.appendChild(state);

    var desc = document.createElement('p');
    desc.className = 'backupdesc';
    desc.textContent =
      '체크와 메모는 이 기기에만 저장됩니다. 기기를 바꾸거나 앱을 다시 깔기 전에 내보내 두세요.';

    var row = document.createElement('div');
    row.className = 'backuprow';

    /* 파일 고르기 칸은 숨겨 두고 단추로 대신 엽니다. */
    var picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'application/json,.json';
    picker.className = 'sr-only';

    wrap.appendChild(head);
    wrap.appendChild(desc);
    wrap.appendChild(row);
    wrap.appendChild(picker);
    container.appendChild(wrap);

    var timer;
    function say(text, warn) {
      clearTimeout(timer);
      state.textContent = text;
      state.classList.toggle('warn', !!warn);
      timer = setTimeout(function () { state.textContent = ''; }, 4000);
    }

    function text() { return JSON.stringify(exportData(), null, 2); }

    function download() {
      var data = exportData();
      if (!data.dayCount) { say('내보낼 기록이 없습니다', true); return; }

      var url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      var a = document.createElement('a');
      a.href = url;
      a.download = '오늘할일-백업-' + ymd(today()) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      say(data.dayCount + '일치를 내보냈습니다');
    }

    /* 앱(WebView)에서는 파일 내려받기가 막힐 수 있어 복사 길을 함께 둡니다. */
    function copy() {
      var data = exportData();
      if (!data.dayCount) { say('내보낼 기록이 없습니다', true); return; }
      var body = text();

      function done(ok) {
        say(ok ? data.dayCount + '일치를 복사했습니다' : '복사하지 못했습니다', !ok);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(body).then(function () { done(true); }, function () {
          done(legacyCopy(body));
        });
      } else {
        done(legacyCopy(body));
      }
    }

    function legacyCopy(body) {
      var ta = document.createElement('textarea');
      ta.value = body;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      return ok;
    }

    function apply(body) {
      var peek;
      try { peek = JSON.parse(body); }
      catch (e) { say('읽을 수 없는 파일입니다', true); return; }

      var n = (peek && peek.days && typeof peek.days === 'object')
        ? Object.keys(peek.days).length : 0;
      if (!n) { say('들여올 기록이 없습니다', true); return; }

      var ok = window.confirm(
        n + '일치를 들여옵니다.\n\n' +
        '같은 날짜의 기록은 파일 내용으로 바뀌고,\n' +
        '파일에 없는 날짜는 그대로 둡니다.\n\n계속할까요?');
      if (!ok) return;

      var r = importData(peek);
      if (!r.ok) { say(r.reason, true); return; }
      say(r.days + '일치를 들여왔습니다');
      if (onImported) onImported();
    }

    picker.addEventListener('change', function () {
      var f = picker.files && picker.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { apply(String(reader.result)); picker.value = ''; };
      reader.onerror = function () { say('파일을 읽지 못했습니다', true); picker.value = ''; };
      reader.readAsText(f);
    });

    function button(label, cls, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      b.addEventListener('click', fn);
      row.appendChild(b);
      return b;
    }

    button('파일로 내보내기', 'primary', download);
    button('복사', '', copy);
    button('가져오기', '', function () { picker.click(); });

    return { export: exportData, import: importData };
  }

  /* ── 날짜별 체크 시트 (월간·주간에서 날짜를 눌렀을 때) ── */
  function makeSheet(onChange) {
    var back = document.createElement('div');
    back.className = 'sheetback';
    back.hidden = true;

    var panel = document.createElement('div');
    panel.className = 'sheet';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'sheetTitle');

    var head = document.createElement('div');
    head.className = 'sheethead';
    var title = document.createElement('h2');
    title.id = 'sheetTitle';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sheetclose';
    closeBtn.textContent = '닫기';
    head.appendChild(title);
    head.appendChild(closeBtn);

    var scoreLine = document.createElement('p');
    scoreLine.className = 'sheetscore';

    var body = document.createElement('div');
    body.className = 'sheetbody';

    panel.appendChild(head);
    panel.appendChild(scoreLine);
    panel.appendChild(body);
    back.appendChild(panel);
    document.body.appendChild(back);

    var cur = null, lastFocus = null;

    function refreshScore() {
      var s = stats(cur);
      var t = s.recorded ? tier(s.pct) : null;
      scoreLine.textContent = (t ? t.emoji + ' ' : '') +
        s.score + ' / ' + s.max + '점 · ' + pctText(s.pct) +
        (s.violated.length ? '  (어김 ' + s.violated.length + '개, −' + s.penalty + '점)' : '');
      scoreLine.classList.toggle('bad', s.violated.length > 0);
    }

    var list = makeChecklist(body, function (d) {
      refreshScore();
      if (onChange) onChange(d);
    });
    var memo = makeMemo(panel, '이 날의 기억', function () {
      if (onChange) onChange(cur);
    });

    function close() {
      memo.flush();
      back.hidden = true;
      document.body.classList.remove('noscroll');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    closeBtn.addEventListener('click', close);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', function (e) {
      if (!back.hidden && (e.key === 'Escape' || e.key === 'Esc')) close();
    });

    return {
      open: function (date, trigger) {
        cur = date;
        lastFocus = trigger || null;
        title.textContent = fmtDay(date) + (sameDay(date, new Date()) ? ' · 오늘' : '');
        list.load(date);
        memo.load(date);
        refreshScore();
        back.hidden = false;
        document.body.classList.add('noscroll');
        closeBtn.focus();
      },
      close: close
    };
  }

  /* ── 달력 한 칸 ──
     진척도만큼 아래에서 차오르고, 그 위에 그날의 이모티콘을 얹습니다.
     기록이 없는 날은 이모티콘 없이 날짜만 크게 보입니다. */
  function makeRing(pct, numText, emoji) {
    var ring = document.createElement('span');
    ring.className = 'ring';
    ring.style.setProperty('--p', pct);

    if (emoji) {
      var e = document.createElement('span');
      e.className = 'cellemoji';
      e.textContent = emoji;
      ring.appendChild(e);
    }

    var n = document.createElement('span');
    n.className = 'dnum' + (emoji ? '' : ' solo');
    n.textContent = numText;
    ring.appendChild(n);
    return ring;
  }

  migrate();

  return {
    DOW: DOW, ITEMS: ITEMS, GROUPS: GROUPS, GOALS: GOALS, AVOIDS: AVOIDS, MAX: MAX,
    midnight: midnight, addDays: addDays, startOfWeek: startOfWeek,
    startOfMonth: startOfMonth, addMonths: addMonths, daysInMonth: daysInMonth,
    today: today, ymd: ymd, sameDay: sameDay, fmtDay: fmtDay,
    read: read, write: write, readMemo: readMemo, writeMemo: writeMemo, hasMemo: hasMemo,
    memoHtml: memoHtml, memoText: memoText, sanitizeMemo: sanitizeMemo,
    stats: stats, pctText: pctText,
    TIERS: TIERS, tier: tier, moodOf: moodOf, paintMood: paintMood, streak: streak,
    exportData: exportData, importData: importData,
    makeChecklist: makeChecklist, bindMemo: bindMemo, makeMemo: makeMemo,
    makeBackup: makeBackup, makeSheet: makeSheet, makeRing: makeRing
  };
})();
