/**
 * ToolVera – Global Floating AI Tools Button (Fixed & Optimized)
 * Inject on every page: <script src="floating-tools.js" defer></script>
 */
(function () {
  'use strict';

  // Prevent duplicate injection
  if (document.getElementById('tv-float-btn')) return;

  var style = document.createElement('style');
  style.textContent = [
    '#tv-float-btn{position:fixed;bottom:28px;right:24px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:"DM Sans",-apple-system,BlinkMacSystemFont,sans-serif}',
    '#tv-float-toggle{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#63b3ed,#a8c8e8);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 24px rgba(99,179,237,0.45),0 2px 8px rgba(0,0,0,0.4);transition:transform 0.3s cubic-bezier(.4,0,.2,1),box-shadow 0.3s;color:#0a0a0a;position:relative;flex-shrink:0;outline:none}',
    '#tv-float-toggle:hover{transform:scale(1.08);box-shadow:0 8px 32px rgba(99,179,237,0.6)}',
    '#tv-float-toggle:focus-visible{box-shadow:0 0 0 3px rgba(99,179,237,0.5)}',
    '#tv-float-toggle.tv-open{transform:rotate(45deg) scale(1.05)}',
    '.tv-pulse{position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(99,179,237,0.4);animation:tvPulse 2s ease-out infinite;pointer-events:none}',
    '@keyframes tvPulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.65);opacity:0}}',
    '#tv-float-menu{display:flex;flex-direction:column;gap:8px;opacity:0;transform:translateY(12px) scale(0.95);pointer-events:none;transition:opacity 0.28s cubic-bezier(.4,0,.2,1),transform 0.28s cubic-bezier(.4,0,.2,1)}',
    '#tv-float-menu.tv-open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}',
    '.tv-item{display:flex;align-items:center;gap:10px;text-decoration:none;background:rgba(22,22,22,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:10px 18px 10px 12px;color:#f0f0f0;font-size:0.85rem;font-weight:500;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.5);transition:all 0.2s ease;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '.tv-item:hover{background:rgba(38,38,38,0.98);border-color:rgba(99,179,237,0.35);color:#63b3ed;transform:translateX(-4px)}',
    '.tv-item:focus-visible{outline:2px solid #63b3ed;outline-offset:2px}',
    '.tv-ico{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}',
    '.tv-ico-bg{background:rgba(99,179,237,0.15);border:1px solid rgba(99,179,237,0.25)}',
    '.tv-ico-rs{background:rgba(99,179,237,0.12);border:1px solid rgba(99,179,237,0.2)}',
    '.tv-ico-cv{background:rgba(168,200,232,0.12);border:1px solid rgba(168,200,232,0.2)}',
    '.tv-ico-ai{background:rgba(200,216,232,0.1);border:1px solid rgba(200,216,232,0.18)}',
    '.tv-ico-sp{background:rgba(99,179,237,0.1);border:1px solid rgba(99,179,237,0.15)}',
    '.tv-lbl{line-height:1.25}',
    '.tv-lbl small{display:block;font-size:0.69rem;color:#5a5a5a;font-weight:400;margin-top:1px}',
    '#tv-tooltip{position:absolute;right:66px;bottom:50%;transform:translateY(50%);background:rgba(22,22,22,0.95);border:1px solid rgba(255,255,255,0.1);color:#e0e0e0;font-size:0.77rem;padding:5px 11px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.2s;box-shadow:0 2px 12px rgba(0,0,0,0.45)}',
    '#tv-float-btn:not(.tv-active):hover #tv-tooltip{opacity:1}',
    '@media(max-width:480px){#tv-float-btn{bottom:16px;right:14px}.tv-item{font-size:0.81rem;padding:9px 14px 9px 10px}}'
  ].join('');
  document.head.appendChild(style);

  // Build widget HTML
  var widget = document.createElement('div');
  widget.id = 'tv-float-btn';
  widget.setAttribute('role', 'navigation');
  widget.setAttribute('aria-label', 'ToolVera quick tools');
  widget.innerHTML =
    '<div id="tv-float-menu" role="menu">' +
      '<a href="bg-remover.html" class="tv-item" role="menuitem" title="AI Background Remover – Remove image background free">' +
        '<div class="tv-ico tv-ico-bg" aria-hidden="true">🪄</div>' +
        '<div class="tv-lbl">AI BG Remover<small>Remove backgrounds instantly</small></div>' +
      '</a>' +
      '<a href="resize.html" class="tv-item" role="menuitem" title="Free Image Resizer – Resize images online">' +
        '<div class="tv-ico tv-ico-rs" aria-hidden="true">📐</div>' +
        '<div class="tv-lbl">Image Resizer<small>Resize by px or %</small></div>' +
      '</a>' +
      '<a href="converter.html" class="tv-item" role="menuitem" title="Image Format Converter – PNG JPG WEBP HEIC">' +
        '<div class="tv-ico tv-ico-cv" aria-hidden="true">🔄</div>' +
        '<div class="tv-lbl">Format Converter<small>PNG · JPG · WEBP · HEIC</small></div>' +
      '</a>' +
      '<button class="tv-item" id="tv-help-btn" role="menuitem" title="Get AI tool recommendation" aria-label="Get tool recommendation">' +
        '<div class="tv-ico tv-ico-ai" aria-hidden="true">🤖</div>' +
        '<div class="tv-lbl">Help AI<small>Get tool recommendations</small></div>' +
      '</button>' +
      '<a href="contact.html" class="tv-item" role="menuitem" title="ToolVera Support">' +
        '<div class="tv-ico tv-ico-sp" aria-hidden="true">📩</div>' +
        '<div class="tv-lbl">Support<small>rebrar.contact@gmail.com</small></div>' +
      '</a>' +
    '</div>' +
    '<button id="tv-float-toggle" aria-label="Open ToolVera quick tools" aria-expanded="false" aria-haspopup="true">' +
      '<span class="tv-pulse" aria-hidden="true"></span>' +
      '<span id="tv-toggle-icon" aria-hidden="true">🔧</span>' +
    '</button>' +
    '<span id="tv-tooltip" aria-hidden="true">Quick Tools</span>';

  document.body.appendChild(widget);

  var toggle   = document.getElementById('tv-float-toggle');
  var menu     = document.getElementById('tv-float-menu');
  var helpBtn  = document.getElementById('tv-help-btn');
  var icon     = document.getElementById('tv-toggle-icon');
  var pulse    = widget.querySelector('.tv-pulse');
  var isOpen   = false;

  function openMenu() {
    isOpen = true;
    toggle.classList.add('tv-open');
    menu.classList.add('tv-open');
    widget.classList.add('tv-active');
    toggle.setAttribute('aria-expanded', 'true');
    icon.textContent = '✕';
    if (pulse) pulse.style.display = 'none';
  }

  function closeMenu() {
    isOpen = false;
    toggle.classList.remove('tv-open');
    menu.classList.remove('tv-open');
    widget.classList.remove('tv-active');
    toggle.setAttribute('aria-expanded', 'false');
    icon.textContent = '🔧';
    if (pulse) pulse.style.display = '';
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    isOpen ? closeMenu() : openMenu();
  });

  // Close on outside click or Escape
  document.addEventListener('click', function (e) {
    if (isOpen && !widget.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) { closeMenu(); toggle.focus(); }
  });

  // Help AI button
  if (helpBtn) {
    helpBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeMenu();
      // Small delay so menu closes first
      setTimeout(function () {
        alert(
          '💡 ToolVera Tool Recommender\n\n' +
          '• Want to remove a background?  → Use AI BG Remover\n' +
          '• Need to resize or compress?   → Use Image Resizer\n' +
          '• Need to change file format?   → Use Format Converter\n\n' +
          'All tools are 100% free — no signup, no watermarks!'
        );
      }, 120);
    });
  }

  // Expose close method globally for other scripts
  window.tvFloatClose = closeMenu;
})();
