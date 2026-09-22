    (function () {
      // Theme toggle with circular reveal transition
      var root = document.documentElement;
      var themeBtn = document.getElementById('themeToggle');
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function applyTheme(next) {
        root.setAttribute('data-theme', next);
        themeBtn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
        themeBtn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }

      themeBtn.addEventListener('click', function (e) {
        var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        var next = current === 'light' ? 'dark' : 'light';
        var x = e.clientX, y = e.clientY;
        var endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

        if (reduceMotion || !document.startViewTransition) {
          applyTheme(next);
          return;
        }

        var transition = document.startViewTransition(function () { applyTheme(next); });
        transition.ready.then(function () {
          root.animate(
            { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 650, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
          );
        });
      });

      // Nav scroll state
      var navEl = document.getElementById('siteNav');
      window.addEventListener('scroll', function () {
        navEl.classList.toggle('scrolled', window.scrollY > 8);
      }, { passive: true });

      // Mobile menu
      var toggle = document.getElementById('menuToggle');
      var mobileMenu = document.getElementById('mobileMenu');
      toggle.addEventListener('click', function () {
        var open = mobileMenu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      document.querySelectorAll('#mobileMenu a').forEach(function (a) {
        a.addEventListener('click', function () {
          mobileMenu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Open menu');
          document.body.style.overflow = '';
        });
      });

      // Logo click — always scroll all the way to the very top
      var navMarkLinks = document.querySelectorAll('.nav-mark');
      navMarkLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      // Technologies — "View more" per category (collapses to ~4 rows)
      function setupTechToggles() {
        document.querySelectorAll('.tech-cat').forEach(function (cat) {
          var wrap = cat.querySelector('.tech-list-wrap');
          var list = cat.querySelector('.tech-list');
          var btn = cat.querySelector('.tech-more');
          var label = btn.querySelector('.tech-more-label');
          if (!wrap || !list || !btn) return;

          // Don't disturb a category the person already expanded — just re-check
          // categories that are still collapsed (e.g. after a viewport resize).
          if (list.classList.contains('expanded')) return;

          var overflows = list.scrollHeight > list.clientHeight + 2;
          btn.classList.toggle('hidden', !overflows);
          wrap.classList.toggle('no-overflow', !overflows);

          btn.onclick = function () {
            var isExpanded = list.classList.toggle('expanded');
            wrap.classList.toggle('expanded', isExpanded);
            btn.classList.toggle('expanded', isExpanded);
            btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            label.textContent = isExpanded ? 'View less' : 'View more';
            // The Technologies section height is pinned to 'auto' once settled
            // (see setupTechViewAll), so a per-category expand/collapse here
            // just reflows naturally — nothing else to sync.
          };
        });
      }

      setupTechToggles();
      window.addEventListener('load', setupTechToggles);
      var techResizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(techResizeTimer);
        techResizeTimer = setTimeout(setupTechToggles, 200);
      }, { passive: true });

      // Technologies — "View All" toggle between the marquee rows (default)
      // and the full categorized static list (expanded).
      function setupTechViewAll() {
        var stateWrap = document.getElementById('techStateWrap');
        var marqueeEl = document.getElementById('techMarqueeState');
        var expandedEl = document.getElementById('techExpandedState');
        var btn = document.getElementById('techViewAllBtn');
        if (!stateWrap || !marqueeEl || !expandedEl || !btn) return;

        var label = btn.querySelector('.tech-toggle-label');
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var isExpanded = false;
        var FADE_MS = 260;
        var SETTLE_MS = 520;

        function markRevealed(root) {
          // Elements inside a hidden panel never intersect, so the shared
          // scroll-reveal observer never fires for them. Reveal them now
          // that the panel is being shown on purpose.
          root.querySelectorAll('.reveal').forEach(function (el) {
            el.classList.add('in');
          });
        }

        // Visibility is driven entirely by classes (never inline `display`)
        // so each panel always keeps its stylesheet layout — marqueeEl's
        // flex/column rows, in particular — no matter how many times it's
        // shown and hidden.
        function showPanel(el) {
          if (el === marqueeEl) el.classList.remove('tm-hidden');
          else el.classList.add('tm-visible');
        }
        function hidePanel(el) {
          if (el === marqueeEl) el.classList.add('tm-hidden');
          else el.classList.remove('tm-visible');
        }

        // Establish the resting (marquee) height on load.
        stateWrap.style.height = marqueeEl.scrollHeight + 'px';
        window.setTimeout(function () { stateWrap.style.height = 'auto'; }, 0);

        btn.addEventListener('click', function () {
          isExpanded = !isExpanded;
          btn.classList.toggle('is-expanded', isExpanded);
          btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          if (label) label.textContent = isExpanded ? 'Show Less →' : 'View All →';

          var showEl = isExpanded ? expandedEl : marqueeEl;
          var hideEl = isExpanded ? marqueeEl : expandedEl;

          if (isExpanded) markRevealed(showEl);

          if (reduceMotion) {
            hidePanel(hideEl);
            hideEl.style.opacity = '';
            showPanel(showEl);
            showEl.style.opacity = '';
            stateWrap.style.height = 'auto';
            return;
          }

          // Lock the current rendered height so it can be transitioned from.
          var startHeight = stateWrap.getBoundingClientRect().height;
          stateWrap.style.height = startHeight + 'px';
          void stateWrap.offsetHeight; // force reflow

          // Reveal the incoming panel invisibly so we can measure it.
          showPanel(showEl);
          showEl.style.opacity = '0';
          var targetHeight = showEl.scrollHeight;

          // Fade the current panel out while the section resizes.
          hideEl.style.opacity = '0';

          requestAnimationFrame(function () {
            stateWrap.style.height = targetHeight + 'px';
          });

          window.setTimeout(function () {
            hidePanel(hideEl);
            hideEl.style.opacity = '';
            showEl.style.opacity = '1';
            window.setTimeout(function () {
              // Let the section flow naturally again so later internal
              // changes (e.g. a per-category "View more") just reflow.
              stateWrap.style.height = 'auto';
            }, SETTLE_MS);
          }, FADE_MS);
        });

        var techViewAllResizeTimer;
        window.addEventListener('resize', function () {
          clearTimeout(techViewAllResizeTimer);
          techViewAllResizeTimer = setTimeout(function () {
            if (stateWrap.style.height !== 'auto') {
              stateWrap.style.height = (isExpanded ? expandedEl : marqueeEl).scrollHeight + 'px';
            }
          }, 200);
        }, { passive: true });
      }

      setupTechViewAll();

      // Scroll reveal for the Technologies marquee/expanded block
      var techRevealEls = document.querySelectorAll('.tech-reveal-15');
      if (techRevealEls.length) {
        var techRevealObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              techRevealObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        techRevealEls.forEach(function (el) { techRevealObserver.observe(el); });
      }

      // Active nav link on scroll
      var sections = ['about', 'technologies', 'projects', 'education', 'contact'].map(function (id) {
        return document.getElementById(id);
      }).filter(Boolean);
      var navAnchors = document.querySelectorAll('a[data-nav]');
      var activeObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navAnchors.forEach(function (a) {
              a.classList.toggle('active', a.getAttribute('href') === '#' + id);
            });
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      sections.forEach(function (s) { activeObserver.observe(s); });

      // Reveal on scroll
      var revealEls = document.querySelectorAll('.reveal');
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function (el) { revealObserver.observe(el); });

      // Hero entrance (runs once, immediately)
      requestAnimationFrame(function () {
        ['heroTop', 'heroStatus', 'heroRole', 'heroDesc', 'heroActions', 'heroFeatured'].forEach(function (id) {
          document.getElementById(id).classList.add('in');
        });
      });

      // Timeline node highlight
      document.querySelectorAll('.t-item').forEach(function (item) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { item.classList.add('in'); }
          });
        }, { threshold: 0.4 });
        obs.observe(item);
      });
    })();

    /* ---------- Project cards: mouse-follow highlight ---------- */
    (function () {
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      document.querySelectorAll('.proj-card, .featured-card').forEach(function (card) {
        var glow = document.createElement('div');
        glow.className = 'card-glow';
        glow.setAttribute('aria-hidden', 'true');
        card.appendChild(glow);

        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
          card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        });
      });
    })();

    (function () {
      var canvas = document.getElementById('topoCanvas'), gl = canvas && canvas.getContext('webgl', { alpha: false, antialias: false }); if (!gl) return;
      var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      var fs = 'precision highp float;uniform vec2 r;uniform float t,g,c;uniform vec3 a,b;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.)),f.x),f.y);}float f(vec2 p){float v=0.,q=.5;for(int i=0;i<4;i++){v+=q*n(p);p=p*2.03+8.7;q*=.5;}return v;}void main(){vec2 u=gl_FragCoord.xy/r;u.x*=r.x/r.y;vec2 x=fract(gl_FragCoord.xy/48.);float grid=max(step(.988,x.x),step(.988,x.y))*g;float co=1.-smoothstep(.032,.078,abs(sin(f(u*2.+vec2(t*.018,t*.012))*31.416)));float s=clamp(grid+co*c,0.,.5);gl_FragColor=vec4(mix(b,a,s),1.);}';
      function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; } var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return; gl.useProgram(pr); var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); var p = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
      function color(k) { var x = parseInt(getComputedStyle(document.documentElement).getPropertyValue(k).trim().slice(1), 16); return [(x >> 16 & 255) / 255, (x >> 8 & 255) / 255, (x & 255) / 255]; } function num(k) { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(k)) || 0; } function resize() { var d = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * d; canvas.height = innerHeight * d; gl.viewport(0, 0, canvas.width, canvas.height); } function draw(now) { var A = color('--accent'), B = color('--topo-bg'); gl.uniform2f(gl.getUniformLocation(pr, 'r'), canvas.width, canvas.height); gl.uniform1f(gl.getUniformLocation(pr, 't'), now * .001); gl.uniform1f(gl.getUniformLocation(pr, 'g'), num('--topo-grid')); gl.uniform1f(gl.getUniformLocation(pr, 'c'), num('--topo-contour')); gl.uniform3f(gl.getUniformLocation(pr, 'a'), A[0], A[1], A[2]); gl.uniform3f(gl.getUniformLocation(pr, 'b'), B[0], B[1], B[2]); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(draw); } window.addEventListener('resize', function () { resize(); draw(performance.now()); }, { passive: true }); new MutationObserver(function () { draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); resize(); draw(performance.now());
    })();
