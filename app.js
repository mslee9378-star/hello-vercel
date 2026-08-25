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
  function writeMemo(date, text) {
    try {
      if (text && text.replace(/\s+/g, '')) localStorage.setItem('memo:' + ymd(date), text);
      else localStorage.removeItem('memo:' + ymd(date));
    } catch (e) {}
  }
  function hasMemo(date) { return readMemo(date) !== ''; }

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
  function bindMemo(textarea, stateEl, onSaved) {
    var owner = null, loaded = '', timer;

    function flush() {
      clearTimeout(timer);
      if (!owner) return false;
      var v = textarea.value;
      if (v === loaded) return false;
      writeMemo(owner, v);
      loaded = v;
      return true;
    }

    textarea.addEventListener('input', function () {
      clearTimeout(timer);
      if (stateEl) stateEl.textContent = '';
      timer = setTimeout(function () {
        if (flush()) {
          if (stateEl) stateEl.textContent = '저장됨';
          if (onSaved) onSaved();
        }
      }, 400);
    });

    textarea.addEventListener('blur', function () {
      if (flush()) {
        if (stateEl) stateEl.textContent = '저장됨';
        if (onSaved) onSaved();
      }
    });

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) flush();
    });

    return {
      load: function (date) {
        flush();
        owner = date;
        loaded = readMemo(date);
        textarea.value = loaded;
        textarea.disabled = date > today();
        if (stateEl) stateEl.textContent = '';
      },
      flush: flush
    };
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

    var memoWrap = document.createElement('div');
    memoWrap.className = 'memowrap';
    memoWrap.innerHTML =
      '<div class="memohead"><label>이 날의 기억</label><span class="memostate"></span></div>';
    var ta = document.createElement('textarea');
    ta.className = 'memo';
    ta.rows = 3;
    ta.placeholder = '남겨 두고 싶은 것이 있다면…';
    memoWrap.appendChild(ta);

    panel.appendChild(head);
    panel.appendChild(scoreLine);
    panel.appendChild(body);
    panel.appendChild(memoWrap);
    back.appendChild(panel);
    document.body.appendChild(back);

    var cur = null, lastFocus = null;

    function refreshScore() {
      var s = stats(cur);
      scoreLine.textContent = s.score + ' / ' + s.max + '점 · ' + pctText(s.pct) +
        (s.violated.length ? '  (어김 ' + s.violated.length + '개, −' + s.penalty + '점)' : '');
      scoreLine.classList.toggle('bad', s.violated.length > 0);
    }

    var list = makeChecklist(body, function (d) {
      refreshScore();
      if (onChange) onChange(d);
    });
    var memo = bindMemo(ta, memoWrap.querySelector('.memostate'), function () {
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

  /* ── 진행률 링 ── */
  function makeRing(pct, numText) {
    var ring = document.createElement('span');
    ring.className = 'ring';
    ring.style.setProperty('--p', pct);
    var n = document.createElement('span');
    n.className = 'dnum';
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
    stats: stats, pctText: pctText,
    makeChecklist: makeChecklist, bindMemo: bindMemo, makeSheet: makeSheet, makeRing: makeRing
  };
})();
