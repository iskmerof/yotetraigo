/* Holiday snow: falls for 10 seconds on page load, then removes itself.
   - Skipped for visitors who prefer reduced motion
   - Skipped after the season ends (Dec 15, 2026, Ecuador/NY time)
   - Add ?snow=1 to the URL to force it for testing */
(function () {
  var DURATION = 10000;   // total effect length (ms)
  var FADE = 2000;        // last stretch fades out smoothly (ms)
  var SEASON_END = Date.UTC(2026, 11, 16, 5);

  var force = /[?&]snow=1\b/.test(location.search);
  if (!force && Date.now() >= SEASON_END) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  document.body.appendChild(canvas);

  var MAX = Math.max(60, Math.min(160, Math.round(w / 9)));
  var flakes = [];
  function spawn(initial) {
    var r = 2 + Math.random() * 4.5;                 // radius 2-6.5px
    flakes.push({
      x: Math.random() * w,
      y: initial ? Math.random() * -h * 0.6 : -10,   // start above the viewport
      r: r,
      vy: 50 + r * 14 + Math.random() * 30,          // px/s, bigger = closer = faster
      sway: 10 + Math.random() * 24,
      phase: Math.random() * Math.PI * 2,
      freq: 0.6 + Math.random() * 0.9
    });
  }
  for (var i = 0; i < MAX; i++) spawn(true);

  var start = performance.now(), last = start;
  function frame(now) {
    var elapsed = now - start;
    if (elapsed >= DURATION) {
      window.removeEventListener('resize', resize);
      canvas.remove();
      return;
    }
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = elapsed > DURATION - FADE ? (DURATION - elapsed) / FADE : 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(26,26,26,0.75)';
    ctx.lineWidth = 1.2;

    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy * dt;
      var x = f.x + Math.sin(f.phase + elapsed / 1000 * f.freq) * f.sway;
      if (f.y > h + 10) {
        // recycle at the top while snowfall is still "on"; stop refilling during the fade
        if (elapsed < DURATION - FADE) { f.y = -10; f.x = Math.random() * w; }
        else { f.y = h + 1000; }
      }
      ctx.beginPath();
      ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
