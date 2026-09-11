/* ============================================================================
 * Slide Deck: Templates + Themes + Layouts
 * ----------------------------------------------------------------------------
 * Loaded via <script src="deckTemplates.js"> BEFORE the main inline <script>
 * in control.html. Populates window globals the editor reads:
 *   DECK_THEMES, DECK_LAYOUTS, DECK_TEMPLATES, DECK_DEFAULT_THEME
 * plus the pure resolver helpers buildSlotElement() / buildPageFromLayout().
 *
 * NOT a module — shares global scope with the inline script.
 *
 * Font stacks list the bundled faces first (added in Checkpoint F) and fall
 * back to OS fonts today, so no theme edits are needed when the .woff2 files
 * land. Backgrounds are gradient strings for now; image versions get swapped
 * in per-theme in Checkpoint F (assets/templates/*.jpg).
 * ========================================================================== */

(function () {
  'use strict';

  function tplUid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10);
  }

  // ---- Font stacks (bundled face first, OS fallback second) ----------------
  const SERIF   = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const SANS    = "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const DISPLAY = "'Cormorant Garamond', Georgia, serif";

  // ========================================================================
  // THEMES
  // Each theme:
  //   backgrounds: { default: <partial page.background>, [layoutId]: <partial> }
  //   roleStyles:  { <role>: <style fields baked onto elements> }
  // fontSize is px in 1920-wide design space (same units elements already use).
  // ========================================================================
  const DECK_THEMES = {

    elegant: {
      id: 'elegant', name: 'Elegant',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/elegant-1.jpg', overlayColor: '#0e0714', overlayOpacity: 0.15 },
        'section-header': { type: 'color', color: '#0e0a14', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#f6efe3', fontFamily: DISPLAY, fontSize: 112, align: 'center', bold: true },
        subtitle:  { color: '#cdbcdd', fontFamily: SANS, fontSize: 38, align: 'center', bold: false },
        body:      { color: '#e8e0d4', fontFamily: SANS, fontSize: 40, align: 'center', bold: false },
        eyebrow:   { color: '#d4af37', fontFamily: SANS, fontSize: 24, align: 'center', bold: true },
        scripture: { color: '#f6efe3', refColor: '#d4af37', fontFamily: DISPLAY, fontSize: 50, align: 'center' },
        accent:    { fillColor: '#d4af37', fillOpacity: 1, strokeColor: '#d4af37', strokeWidth: 0 },
      },
    },

    worship: {
      id: 'worship', name: 'Worship',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/worship-1.jpg', overlayColor: '#100a30', overlayOpacity: 0.1 },
        'section-header': { type: 'color', color: 'linear-gradient(180deg, #1a1147 0%, #0c0824 100%)', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#ffffff', fontFamily: DISPLAY, fontSize: 116, align: 'center', bold: true },
        subtitle:  { color: '#c9b8f0', fontFamily: SANS, fontSize: 38, align: 'center', bold: false },
        body:      { color: '#e6dcff', fontFamily: SANS, fontSize: 40, align: 'center', bold: false },
        eyebrow:   { color: '#f0c869', fontFamily: SANS, fontSize: 24, align: 'center', bold: true },
        scripture: { color: '#ffffff', refColor: '#f0c869', fontFamily: DISPLAY, fontSize: 50, align: 'center' },
        accent:    { fillColor: '#f0c869', fillOpacity: 1, strokeColor: '#f0c869', strokeWidth: 0 },
      },
    },

    modern: {
      id: 'modern', name: 'Modern',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/modern-1.jpg', overlayColor: '#09090d', overlayOpacity: 0.1 },
        'section-header': { type: 'color', color: '#09090d', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#ffffff', fontFamily: SANS, fontSize: 104, align: 'center', bold: true },
        subtitle:  { color: '#9ca3af', fontFamily: SANS, fontSize: 36, align: 'center', bold: false },
        body:      { color: '#d1d5db', fontFamily: SANS, fontSize: 38, align: 'center', bold: false },
        eyebrow:   { color: '#a78bfa', fontFamily: SANS, fontSize: 22, align: 'center', bold: true },
        scripture: { color: '#ffffff', refColor: '#a78bfa', fontFamily: SANS, fontSize: 44, align: 'center' },
        accent:    { fillColor: '#a78bfa', fillOpacity: 1, strokeColor: '#a78bfa', strokeWidth: 0 },
      },
    },

    revival: {
      id: 'revival', name: 'Revival',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/revival-1.jpg', overlayColor: '#2c0f04', overlayOpacity: 0.45 },
        'section-header': { type: 'color', color: 'linear-gradient(180deg, #431407 0%, #1c0a03 100%)', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#fff4e6', fontFamily: DISPLAY, fontSize: 116, align: 'center', bold: true },
        subtitle:  { color: '#fcd9b8', fontFamily: SANS, fontSize: 38, align: 'center', bold: false },
        body:      { color: '#fbe5cf', fontFamily: SANS, fontSize: 40, align: 'center', bold: false },
        eyebrow:   { color: '#fbbf24', fontFamily: SANS, fontSize: 24, align: 'center', bold: true },
        scripture: { color: '#fff4e6', refColor: '#fbbf24', fontFamily: DISPLAY, fontSize: 50, align: 'center' },
        accent:    { fillColor: '#fbbf24', fillOpacity: 1, strokeColor: '#fbbf24', strokeWidth: 0 },
      },
    },

    nature: {
      id: 'nature', name: 'Nature',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/nature-1.jpg', overlayColor: '#071912', overlayOpacity: 0.2 },
        'section-header': { type: 'color', color: '#081b13', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#f4efe1', fontFamily: DISPLAY, fontSize: 110, align: 'center', bold: true },
        subtitle:  { color: '#bcd3c4', fontFamily: SANS, fontSize: 36, align: 'center', bold: false },
        body:      { color: '#e0e8dd', fontFamily: SANS, fontSize: 38, align: 'center', bold: false },
        eyebrow:   { color: '#c8a951', fontFamily: SANS, fontSize: 23, align: 'center', bold: true },
        scripture: { color: '#f4efe1', refColor: '#c8a951', fontFamily: DISPLAY, fontSize: 48, align: 'center' },
        accent:    { fillColor: '#c8a951', fillOpacity: 1, strokeColor: '#c8a951', strokeWidth: 0 },
      },
    },

    minimal: {
      id: 'minimal', name: 'Minimal',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/minimal-1.jpg', overlayColor: '#ffffff', overlayOpacity: 0 },
        'section-header': { type: 'color', color: '#ffffff', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#1f2430', fontFamily: DISPLAY, fontSize: 104, align: 'center', bold: true },
        subtitle:  { color: '#6b7280', fontFamily: SANS, fontSize: 34, align: 'center', bold: false },
        body:      { color: '#374151', fontFamily: SANS, fontSize: 36, align: 'center', bold: false },
        eyebrow:   { color: '#9a7b3f', fontFamily: SANS, fontSize: 22, align: 'center', bold: true },
        scripture: { color: '#1f2430', refColor: '#9a7b3f', fontFamily: DISPLAY, fontSize: 46, align: 'center' },
        accent:    { fillColor: '#1f2430', fillOpacity: 1, strokeColor: '#1f2430', strokeWidth: 0 },
      },
    },

    dramatic: {
      id: 'dramatic', name: 'Dramatic',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/dramatic-1.jpg', overlayColor: '#000000', overlayOpacity: 0.3 },
        'section-header': { type: 'color', color: '#000000', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#ffffff', fontFamily: SANS, fontSize: 132, align: 'center', bold: true },
        subtitle:  { color: '#a1a1aa', fontFamily: SANS, fontSize: 36, align: 'center', bold: false },
        body:      { color: '#e4e4e7', fontFamily: SANS, fontSize: 40, align: 'center', bold: false },
        eyebrow:   { color: '#dc2626', fontFamily: SANS, fontSize: 24, align: 'center', bold: true },
        scripture: { color: '#ffffff', refColor: '#dc2626', fontFamily: SANS, fontSize: 46, align: 'center' },
        accent:    { fillColor: '#dc2626', fillOpacity: 1, strokeColor: '#dc2626', strokeWidth: 0 },
      },
    },

    warm: {
      id: 'warm', name: 'Warm',
      backgrounds: {
        default:          { type: 'image', imageUrl: '../assets/templates/warm-1.jpg', overlayColor: '#fff4e8', overlayOpacity: 0 },
        'section-header': { type: 'color', color: 'linear-gradient(180deg, #f8d9c3 0%, #edbfa1 100%)', overlayOpacity: 0 },
      },
      roleStyles: {
        title:     { color: '#5a3826', fontFamily: DISPLAY, fontSize: 108, align: 'center', bold: true },
        subtitle:  { color: '#8a5a3e', fontFamily: SANS, fontSize: 34, align: 'center', bold: false },
        body:      { color: '#6b4530', fontFamily: SANS, fontSize: 36, align: 'center', bold: false },
        eyebrow:   { color: '#b06a3a', fontFamily: SANS, fontSize: 22, align: 'center', bold: true },
        scripture: { color: '#5a3826', refColor: '#b06a3a', fontFamily: DISPLAY, fontSize: 46, align: 'center' },
        accent:    { fillColor: '#b06a3a', fillOpacity: 1, strokeColor: '#b06a3a', strokeWidth: 0 },
      },
    },
  };

  // ========================================================================
  // LAYOUTS
  // slots carry only structure (role, type, x/y/w/h, align, placeholder).
  // All visual style comes from the theme's roleStyles at resolve time.
  // ========================================================================
  const DECK_LAYOUTS = {

    'title-slide': {
      id: 'title-slide', name: 'Title Slide',
      slots: [
        { role: 'eyebrow',  type: 'text', x: 15, y: 31, w: 70, h: 7,  align: 'center', placeholder: 'WELCOME' },
        { role: 'title',    type: 'text', x: 8,  y: 39, w: 84, h: 24, align: 'center', placeholder: 'Title' },
        { role: 'subtitle', type: 'text', x: 15, y: 65, w: 70, h: 9,  align: 'center', placeholder: 'Subtitle' },
      ],
    },

    'title-content': {
      id: 'title-content', name: 'Title + Content',
      slots: [
        { role: 'eyebrow', type: 'text', x: 12, y: 10, w: 76, h: 7,  align: 'center', placeholder: 'SECTION' },
        { role: 'title',   type: 'text', x: 8,  y: 18, w: 84, h: 16, align: 'center', placeholder: 'Title' },
        { role: 'body',    type: 'text', x: 12, y: 38, w: 76, h: 52, align: 'center', placeholder: 'Body text' },
      ],
    },

    'scripture': {
      id: 'scripture', name: 'Scripture',
      slots: [
        { role: 'scripture', type: 'scripture', x: 10, y: 22, w: 80, h: 56, align: 'center', placeholder: 'Verse text' },
      ],
    },

    'section-header': {
      id: 'section-header', name: 'Section Header',
      slots: [
        { role: 'eyebrow', type: 'text', x: 15, y: 37, w: 70, h: 7,  align: 'center', placeholder: 'SECTION' },
        { role: 'title',   type: 'text', x: 8,  y: 45, w: 84, h: 16, align: 'center', placeholder: 'Section Title' },
      ],
    },

    'blank': {
      id: 'blank', name: 'Blank',
      slots: [],
    },
  };

  // ========================================================================
  // TEMPLATES (ordered — drives gallery order)
  // content keys are role names -> string, or for the scripture role,
  // { reference, translation, text }.
  // ========================================================================
  const DECK_TEMPLATES = [

    {
      id: 'sunday-service', name: 'Sunday Service', category: 'Service', themeId: 'worship',
      pages: [
        { layoutId: 'title-slide',    transition: 'fade', content: { eyebrow: 'WELCOME', title: 'Sunday Service', subtitle: "We're glad you're here" } },
        { layoutId: 'section-header',  content: { eyebrow: 'GATHERING', title: 'Call to Worship' } },
        { layoutId: 'scripture',      content: { scripture: { reference: 'Psalm 100:1-2', translation: 'ESV', text: 'Make a joyful noise to the LORD, all the earth! Serve the LORD with gladness! Come into his presence with singing!' } } },
        { layoutId: 'title-content',  content: { eyebrow: 'ANNOUNCEMENTS', title: 'This Week', body: 'Prayer Meeting — Wednesday, 7:00 PM\nYouth Night — Friday, 6:00 PM\nNew Members Class — Sunday, 9:00 AM' } },
        { layoutId: 'section-header',  content: { eyebrow: 'SENDING', title: 'Benediction' } },
      ],
    },

    {
      id: 'welcome', name: 'Welcome', category: 'Service', themeId: 'warm',
      pages: [
        { layoutId: 'title-slide',   transition: 'fade', content: { eyebrow: 'WELCOME', title: 'Welcome Home', subtitle: "We're so glad you're here" } },
        { layoutId: 'title-content', content: { eyebrow: 'CONNECT', title: 'New Here?', body: 'Stop by the Welcome Table in the lobby after the service.\nWe would love to meet you and pray with you.' } },
        { layoutId: 'blank',         content: {} },
      ],
    },

    {
      id: 'worship-set', name: 'Worship', category: 'Music', themeId: 'dramatic',
      pages: [
        { layoutId: 'title-slide',   transition: 'fade', content: { eyebrow: 'PRAISE', title: 'Worship', subtitle: 'Let everything that has breath praise the Lord' } },
        { layoutId: 'section-header', content: { eyebrow: 'TOGETHER', title: 'Lift Your Voice' } },
        { layoutId: 'scripture',     content: { scripture: { reference: 'Psalm 150:6', translation: 'ESV', text: 'Let everything that has breath praise the LORD! Praise the LORD!' } } },
      ],
    },

    {
      id: 'sermon', name: 'Sermon', category: 'Teaching', themeId: 'modern',
      pages: [
        { layoutId: 'title-slide',    transition: 'fade', content: { eyebrow: "TODAY'S MESSAGE", title: 'The Power of Faith', subtitle: 'Mark 11:22-24' } },
        { layoutId: 'section-header',  content: { eyebrow: 'POINT ONE', title: 'Faith Speaks' } },
        { layoutId: 'scripture',      content: { scripture: { reference: 'Mark 11:24', translation: 'ESV', text: 'Whatever you ask in prayer, believe that you have received it, and it will be yours.' } } },
        { layoutId: 'title-content',  content: { eyebrow: 'REFLECT', title: 'This Week', body: 'Where is God asking you to trust Him?\nWrite it down. Pray over it daily.' } },
        { layoutId: 'section-header',  content: { eyebrow: 'CLOSING', title: 'Let Us Pray' } },
      ],
    },

    {
      id: 'scripture-reading', name: 'Scripture', category: 'Teaching', themeId: 'elegant',
      pages: [
        { layoutId: 'title-slide', transition: 'fade', content: { eyebrow: "TODAY'S SCRIPTURE", title: 'The Word of God', subtitle: 'Psalm 119:105' } },
        { layoutId: 'scripture',   content: { scripture: { reference: 'Psalm 119:105', translation: 'ESV', text: 'Your word is a lamp to my feet and a light to my path.' } } },
        { layoutId: 'scripture',   content: { scripture: { reference: 'Hebrews 4:12', translation: 'ESV', text: 'For the word of God is living and active, sharper than any two-edged sword.' } } },
      ],
    },

    {
      id: 'prayer-night', name: 'Prayer Night', category: 'Gathering', themeId: 'dramatic',
      pages: [
        { layoutId: 'title-slide',   transition: 'fade', content: { eyebrow: 'SEEK · PRAY · BELIEVE', title: 'Prayer Night', subtitle: 'Come, let us pray together' } },
        { layoutId: 'section-header', content: { eyebrow: 'FOCUS', title: 'Our Church' } },
        { layoutId: 'scripture',     content: { scripture: { reference: 'James 5:16', translation: 'ESV', text: 'The prayer of a righteous person has great power as it is working.' } } },
        { layoutId: 'section-header', content: { eyebrow: 'FOCUS', title: 'Our City' } },
      ],
    },

    {
      id: 'baptism', name: 'Baptism', category: 'Ordinance', themeId: 'nature',
      pages: [
        { layoutId: 'title-slide',   transition: 'fade', content: { eyebrow: 'NEW LIFE IN CHRIST', title: 'Baptism', subtitle: 'Buried with Him, raised to new life' } },
        { layoutId: 'scripture',     content: { scripture: { reference: 'Romans 6:4', translation: 'ESV', text: 'We were buried therefore with him by baptism into death, in order that we too might walk in newness of life.' } } },
        { layoutId: 'title-content', content: { eyebrow: 'TESTIMONY', title: 'A New Story', body: '[ Name ]\nFollowing Jesus since [ year ]' } },
      ],
    },

    {
      id: 'christmas', name: 'Christmas Service', category: 'Seasonal', themeId: 'elegant',
      pages: [
        { layoutId: 'title-slide',   transition: 'fade', content: { eyebrow: 'CHRISTMAS', title: 'The Savior Is Born', subtitle: 'Luke 2:11' } },
        { layoutId: 'scripture',     content: { scripture: { reference: 'Luke 2:11', translation: 'ESV', text: 'For unto you is born this day in the city of David a Savior, who is Christ the Lord.' } } },
        { layoutId: 'section-header', content: { eyebrow: 'CAROL', title: 'O Come, All Ye Faithful' } },
      ],
    },

    {
      id: 'thanksgiving', name: 'Thanksgiving Service', category: 'Seasonal', themeId: 'warm',
      pages: [
        { layoutId: 'title-slide',   transition: 'fade', content: { eyebrow: 'GIVE THANKS', title: 'Thanksgiving', subtitle: 'In everything give thanks' } },
        { layoutId: 'scripture',     content: { scripture: { reference: '1 Thessalonians 5:18', translation: 'ESV', text: 'Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.' } } },
        { layoutId: 'title-content', content: { eyebrow: 'REFLECT', title: 'Count Your Blessings', body: 'Name three things God has done for you this year.\nShare one with someone beside you.' } },
      ],
    },

    {
      id: 'closing', name: 'Closing', category: 'Service', themeId: 'minimal',
      pages: [
        { layoutId: 'section-header', content: { eyebrow: 'GO IN PEACE', title: 'Benediction' } },
        { layoutId: 'scripture',     content: { scripture: { reference: 'Numbers 6:24-26', translation: 'ESV', text: 'The LORD bless you and keep you; the LORD make his face to shine upon you and be gracious to you.' } } },
        { layoutId: 'title-slide',   content: { eyebrow: '', title: 'Thank You', subtitle: 'See you next week' } },
      ],
    },
  ];

  const DECK_DEFAULT_THEME = 'modern';

  // ========================================================================
  // RESOLVERS
  // ========================================================================

  // One slot + a theme + a content value -> a real deck element with `role`
  // and literal styles baked in.
  function buildSlotElement(slot, theme, contentValue, zIndex) {
    const rs = (theme.roleStyles && theme.roleStyles[slot.role]) || {};
    const base = {
      id: tplUid('el'),
      role: slot.role,
      x: slot.x, y: slot.y, w: slot.w, h: slot.h,
      rotation: 0,
      zIndex: zIndex,
    };

    if (slot.type === 'scripture') {
      const c = contentValue || {};
      return Object.assign(base, {
        type: 'scripture',
        reference: c.reference || '',
        translation: c.translation || 'ESV',
        text: c.text || slot.placeholder || '',
        fontFamily: rs.fontFamily || "Georgia, serif",
        fontSize: rs.fontSize || 44,
        color: rs.color || '#ffffff',
        refColor: rs.refColor || '#FFD700',
        align: rs.align || slot.align || 'center',
      });
    }

    if (slot.type === 'shape') {
      return Object.assign(base, {
        type: 'shape',
        shapeType: slot.shapeType || 'rect',
        fillColor: rs.fillColor || '#ffffff',
        fillOpacity: (rs.fillOpacity == null ? 1 : rs.fillOpacity),
        strokeColor: rs.strokeColor || '#ffffff',
        strokeWidth: rs.strokeWidth || 0,
        strokeOpacity: 1,
      });
    }

    // default: text
    return Object.assign(base, {
      type: 'text',
      html: (typeof contentValue === 'string' ? contentValue : '') || slot.placeholder || '',
      fontFamily: rs.fontFamily || "Arial, sans-serif",
      fontSize: rs.fontSize || 40,
      color: rs.color || '#ffffff',
      align: rs.align || slot.align || 'center',
      bold: !!rs.bold,
      italic: false,
      underline: false,
    });
  }

  // A layoutId + theme + content map -> a full page object the editor
  // and projector already understand.
  function buildPageFromLayout(layoutId, theme, content, transition, bgOverride) {
    const layout = DECK_LAYOUTS[layoutId] || DECK_LAYOUTS['blank'];
    const baseBg = (theme.backgrounds && (theme.backgrounds[layoutId] || theme.backgrounds.default)) || {};
    const background = Object.assign(
      { type: 'color', color: '#1a1a2e', imageUrl: null, overlayColor: '#000000', overlayOpacity: 0, userSet: false },
      baseBg,
      bgOverride || {}
    );
    return {
      id: tplUid('page'),
      layout: layoutId,
      background: background,
      transition: transition || 'fade',
      elements: layout.slots.map(function (slot, i) {
        return buildSlotElement(slot, theme, content ? content[slot.role] : null, i + 1);
      }),
    };
  }

  // ---- expose ------------------------------------------------------------
  window.DECK_THEMES = DECK_THEMES;
  window.DECK_LAYOUTS = DECK_LAYOUTS;
  window.DECK_TEMPLATES = DECK_TEMPLATES;
  window.DECK_DEFAULT_THEME = DECK_DEFAULT_THEME;
  window.buildSlotElement = buildSlotElement;
  window.buildPageFromLayout = buildPageFromLayout;
})();
