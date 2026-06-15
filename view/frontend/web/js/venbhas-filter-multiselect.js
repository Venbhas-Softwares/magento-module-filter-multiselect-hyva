/**
 * Venbhas FilterMultiselect — Hyvä storefront behavior.
 * Expands layered-navigation filter cards that contain active filters after page load.
 *
 * Hyvä options sit inside <template x-if="open">; filter cards often use x-defer="intersect" so
 * Alpine does not bind until the card is in view.
 */
(function () {
    if (window.__venbhasFilterMultiselectHyvaInit) {
        return;
    }
    window.__venbhasFilterMultiselectHyvaInit = true;

    var escClass =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? function (s) {
                  return CSS.escape(s);
              }
            : function (s) {
                  return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
              };

    document.addEventListener('change', function (e) {
        if (e.target.matches && e.target.matches('input.filter-checkbox')) {
            var url = e.target.dataset.url;
            if (url) {
                window.location.assign(url);
            }
        }
    });

    document.addEventListener(
        'click',
        function (e) {
            var link = e.target.closest && e.target.closest('a.action.remove');
            if (!link) {
                return;
            }
            var href = link.getAttribute('href');
            if (!href || href === '#' || href.indexOf('javascript:') === 0) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            window.location.assign(href);
        },
        true
    );

    function normalizeFilterTitle(text) {
        if (!text) {
            return '';
        }
        return text
            .replace(/\s+/g, ' ')
            .replace(/\s*filter\s*$/i, '')
            .trim()
            .toLowerCase();
    }

    function getActiveFilterRequestVarsFromUrl() {
        var ignore = {
            p: 1,
            q: 1,
            id: 1,
            product_list_mode: 1,
            ___store: 1,
            ___from_store: 1,
            limit: 1,
            dir: 1,
            order: 1,
            form_key: 1,
        };
        var out = typeof Set !== 'undefined' ? new Set() : null;
        var arr = [];
        var search = window.location.search;
        if (!search || search.length < 2) {
            return out || arr;
        }
        try {
            new URLSearchParams(search).forEach(function (val, key) {
                var base = key.split('[')[0];
                if (!base || ignore[base]) {
                    return;
                }
                if (val === '' || val === null) {
                    return;
                }
                if (out) {
                    out.add(base);
                } else if (arr.indexOf(base) === -1) {
                    arr.push(base);
                }
            });
        } catch (eUrl) {
            /* ignore */
        }
        return out || arr;
    }

    function urlActiveVarsHas(activeVars, requestVar) {
        if (!requestVar || !activeVars) {
            return false;
        }
        if (typeof activeVars.has === 'function') {
            return activeVars.has(requestVar);
        }
        return activeVars.indexOf(requestVar) !== -1;
    }

    function getHyvaFilterCardTitleText(card) {
        var btn = card.querySelector('button.filter-options-title[type="button"]') || card.querySelector('button.filter-options-title');
        var titleEl =
            (btn && btn.querySelector('span.title')) ||
            card.querySelector('button.filter-options-title .title') ||
            card.querySelector('.filter-options-title .title') ||
            card.querySelector('button.filter-options-title span:not([class*="sr-only"])') ||
            btn ||
            card.querySelector('summary') ||
            card.querySelector('[data-role="title"]');
        if (!titleEl) {
            return '';
        }
        return titleEl.textContent || '';
    }

    function findHyvaFilterToggleRoot(card) {
        if (!card) {
            return null;
        }
        if (card.tagName === 'DETAILS') {
            return card;
        }
        if (card.hasAttribute && card.hasAttribute('x-data')) {
            return card;
        }
        var btn =
            card.querySelector('button.filter-options-title[type="button"]') ||
            card.querySelector('button.filter-options-title') ||
            card.querySelector('button[aria-expanded]') ||
            card.querySelector('summary');
        if (btn && btn.closest) {
            var walk = btn.parentElement;
            while (walk && walk !== card) {
                if (walk.hasAttribute && walk.hasAttribute('x-data')) {
                    return walk;
                }
                walk = walk.parentElement;
            }
            var fromBtn = btn.closest('[x-data]');
            if (fromBtn && card.contains(fromBtn)) {
                return fromBtn;
            }
        }
        var inner = card.querySelector('[x-data]');
        if (inner) {
            return inner;
        }
        return null;
    }

    function isHyvaFilterExpanded(card) {
        if (!card) {
            return false;
        }
        if (card.tagName === 'DETAILS') {
            return card.open === true;
        }
        var toggleRoot = findHyvaFilterToggleRoot(card);
        if (toggleRoot && window.Alpine && typeof window.Alpine.$data === 'function') {
            try {
                var ad = window.Alpine.$data(toggleRoot);
                if (ad) {
                    if (ad.open === true || ad.expanded === true || ad.show === true) {
                        return true;
                    }
                }
            } catch (eRead) {
                /* ignore */
            }
        }
        var b =
            card.querySelector('button.filter-options-title[type="button"]') ||
            card.querySelector('button.filter-options-title') ||
            card.querySelector('button[aria-expanded]') ||
            card.querySelector('summary');
        if (!b) {
            return false;
        }
        return b.getAttribute('aria-expanded') === 'true';
    }

    function setHyvaFilterOpenState(card, toggleRoot) {
        if (toggleRoot && toggleRoot.tagName === 'DETAILS') {
            toggleRoot.open = true;
            return true;
        }
        if (window.Alpine && typeof window.Alpine.$data === 'function' && toggleRoot) {
            try {
                var d = window.Alpine.$data(toggleRoot);
                if (d) {
                    if ('open' in d) {
                        d.open = true;
                        return true;
                    }
                    if ('expanded' in d) {
                        d.expanded = true;
                        return true;
                    }
                    if ('show' in d) {
                        d.show = true;
                        return true;
                    }
                }
            } catch (eAlp) {
                /* ignore */
            }
        }
        return false;
    }

    function requestVarMatchesHyvaCardTitle(base, cardTitle) {
        if (!base || !cardTitle) {
            return false;
        }
        var b = String(base).toLowerCase();
        if (b === cardTitle) {
            return true;
        }
        var asWords = normalizeFilterTitle(b.replace(/_/g, ' '));
        if (asWords === cardTitle) {
            return true;
        }
        return cardTitle.length >= 2 && b.indexOf(cardTitle + '_') === 0;
    }

    function cardMatchesUrlParamToTitle(card, urlVars) {
        if (!urlVars) {
            return false;
        }
        var list = typeof urlVars.forEach === 'function' ? Array.from(urlVars) : urlVars;
        if (!list || !list.length) {
            return false;
        }
        var cardTitle = normalizeFilterTitle(getHyvaFilterCardTitleText(card));
        if (!cardTitle) {
            return false;
        }
        return list.some(function (base) {
            return base && requestVarMatchesHyvaCardTitle(base, cardTitle);
        });
    }

    function tryOpenHyvaFilterCard(card) {
        if (!card || card.dataset.venbhasHyvaExpanded === '1') {
            return;
        }

        function markExpanded() {
            card.dataset.venbhasHyvaExpanded = '1';
        }

        function beginOpenAttempts() {
            try {
                card.scrollIntoView({ block: 'center', behavior: 'instant' });
            } catch (eScroll) {
                /* ignore */
            }
            try {
                window.dispatchEvent(new Event('scroll'));
            } catch (eEv) {
                /* ignore */
            }

            var attempt = 0;
            var maxAttempts = 100;
            var openedViaAlpineData = false;

            function tick() {
                attempt++;
                if (card.dataset.venbhasHyvaExpanded === '1' || isHyvaFilterExpanded(card)) {
                    markExpanded();
                    return;
                }

                var toggleRoot = findHyvaFilterToggleRoot(card);
                if (toggleRoot) {
                    openedViaAlpineData = setHyvaFilterOpenState(card, toggleRoot);
                    if (openedViaAlpineData && window.Alpine && typeof window.Alpine.nextTick === 'function') {
                        try {
                            window.Alpine.nextTick(function () {
                                if (isHyvaFilterExpanded(card)) {
                                    markExpanded();
                                }
                            });
                        } catch (eNt) {
                            /* ignore */
                        }
                    }
                    if (isHyvaFilterExpanded(card)) {
                        markExpanded();
                        return;
                    }
                }

                if (window.Alpine && typeof window.Alpine.$data === 'function') {
                    try {
                        var d = window.Alpine.$data(card);
                        if (d && 'open' in d) {
                            openedViaAlpineData = true;
                            d.open = true;
                            if (typeof window.Alpine.nextTick === 'function') {
                                window.Alpine.nextTick(function () {
                                    if (isHyvaFilterExpanded(card)) {
                                        markExpanded();
                                    }
                                });
                            }
                            if (isHyvaFilterExpanded(card)) {
                                markExpanded();
                                return;
                            }
                        }
                    } catch (e2) {
                        /* defer / not ready */
                    }
                }

                var allowClickFallback =
                    attempt >= 4 &&
                    (!openedViaAlpineData || attempt >= 20) &&
                    card.dataset.venbhasHyvaClickDone !== '1';

                if (allowClickFallback && attempt < maxAttempts) {
                    var btnFallback =
                        card.querySelector('button.filter-options-title[type="button"]') ||
                        card.querySelector('button.filter-options-title') ||
                        card.querySelector('button[aria-expanded]') ||
                        card.querySelector('summary');
                    if (btnFallback) {
                        var trFb = findHyvaFilterToggleRoot(card);
                        var alpineClosed = false;
                        if (trFb && window.Alpine && typeof window.Alpine.$data === 'function') {
                            try {
                                var dFb = window.Alpine.$data(trFb);
                                if (dFb && 'open' in dFb && dFb.open === false) {
                                    alpineClosed = true;
                                }
                            } catch (eFb) {
                                /* ignore */
                            }
                        }
                        if (alpineClosed || btnFallback.getAttribute('aria-expanded') === 'false') {
                            card.dataset.venbhasHyvaClickDone = '1';
                            btnFallback.click();
                        }
                    }
                }

                if (isHyvaFilterExpanded(card)) {
                    markExpanded();
                    return;
                }

                if (attempt < maxAttempts) {
                    setTimeout(tick, attempt < 30 ? 50 : 120);
                }
            }

            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(function () {
                    requestAnimationFrame(tick);
                });
            } else {
                setTimeout(tick, 0);
            }
        }

        var started = false;
        function startAttemptsOnce() {
            if (started) {
                return;
            }
            started = true;
            setTimeout(beginOpenAttempts, 40);
        }

        try {
            card.scrollIntoView({ block: 'center', behavior: 'instant' });
        } catch (eScroll2) {
            /* ignore */
        }

        if (typeof IntersectionObserver === 'undefined') {
            startAttemptsOnce();
            return;
        }

        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting || entry.intersectionRatio > 0) {
                        try {
                            io.disconnect();
                        } catch (eIo) {
                            /* ignore */
                        }
                        startAttemptsOnce();
                    }
                });
            },
            { root: null, rootMargin: '300px 0px 300px 0px', threshold: [0, 0.01, 0.1] }
        );
        io.observe(card);

        setTimeout(function () {
            var r = card.getBoundingClientRect();
            var vh = window.innerHeight || document.documentElement.clientHeight || 0;
            var vw = window.innerWidth || document.documentElement.clientWidth || 0;
            if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw) {
                try {
                    io.disconnect();
                } catch (eIo2) {
                    /* ignore */
                }
                startAttemptsOnce();
            }
        }, 0);

        setTimeout(startAttemptsOnce, 700);
    }

    function expandFilterListsMatchingUrlRequestVars(activeVars) {
        if (!activeVars) {
            return;
        }
        if (typeof activeVars.size !== 'undefined' && activeVars.size === 0) {
            return;
        }
        if (Array.isArray(activeVars) && activeVars.length === 0) {
            return;
        }

        document.querySelectorAll('ol.venbhas-filter-multiselect[data-venbhas-request-var]').forEach(function (ol) {
            var rv = ol.getAttribute('data-venbhas-request-var');
            if (!rv || !urlActiveVarsHas(activeVars, rv)) {
                return;
            }
            var hyvaCard = ol.closest('.filter-option');
            if (hyvaCard) {
                tryOpenHyvaFilterCard(hyvaCard);
            }
            alpineOpenAncestors(ol);
        });
    }

    function expandHyvaLayeredNavigationPanels() {
        var navRoot =
            document.querySelector('[x-data*="initLayeredNavigation"]') ||
            document.querySelector('[x-data*="LayeredNavigation"]') ||
            document.querySelector('#layered-filter-block[x-data]') ||
            document.querySelector('.block.filter[x-data]');
        if (!navRoot) {
            var fh = document.querySelector('#filters-heading');
            if (fh && fh.closest) {
                navRoot = fh.closest('[x-data]');
            }
        }
        if (navRoot && window.Alpine && typeof window.Alpine.$data === 'function') {
            try {
                var rootData = window.Alpine.$data(navRoot);
                if (rootData && Object.prototype.hasOwnProperty.call(rootData, 'blockOpen')) {
                    rootData.blockOpen = true;
                }
            } catch (e1) {
                /* ignore */
            }
        }

        var labels = [];
        var current = document.querySelector('.filter-current');
        if (current) {
            current.querySelectorAll('.item .filter-label').forEach(function (labelEl) {
                var t = normalizeFilterTitle(labelEl.textContent);
                if (t) {
                    labels.push(t);
                }
            });
        }

        var urlVars = getActiveFilterRequestVarsFromUrl();

        function cardMatchesLabel(card) {
            if (card.hasAttribute('x-ignore')) {
                return false;
            }
            var cardTitle = normalizeFilterTitle(getHyvaFilterCardTitleText(card));
            if (!cardTitle) {
                return false;
            }
            return labels.some(function (lb) {
                return cardTitle === lb || cardTitle.indexOf(lb) === 0 || lb.indexOf(cardTitle) === 0;
            });
        }

        function cardMatchesRequestVar(card) {
            var ol = card.querySelector('ol.venbhas-filter-multiselect[data-venbhas-request-var]');
            if (!ol) {
                return false;
            }
            var rv = ol.getAttribute('data-venbhas-request-var');
            return rv && urlActiveVarsHas(urlVars, rv);
        }

        document.querySelectorAll('.filter-option').forEach(function (card) {
            if (cardMatchesLabel(card) || cardMatchesRequestVar(card) || cardMatchesUrlParamToTitle(card, urlVars)) {
                tryOpenHyvaFilterCard(card);
            }
        });
    }

    function alpineOpenAncestors(start) {
        if (typeof window.Alpine === 'undefined' || typeof window.Alpine.$data !== 'function') {
            return;
        }
        var el = start;
        var guard = 0;
        while (el && el !== document.body && guard < 30) {
            if (el.hasAttribute && el.hasAttribute('x-data')) {
                try {
                    var d = window.Alpine.$data(el);
                    if (d) {
                        if (Object.prototype.hasOwnProperty.call(d, 'open')) {
                            d.open = true;
                        }
                        if (Object.prototype.hasOwnProperty.call(d, 'expanded')) {
                            d.expanded = true;
                        }
                        if (Object.prototype.hasOwnProperty.call(d, 'show')) {
                            d.show = true;
                        }
                    }
                } catch (err) {
                    /* ignore */
                }
            }
            el = el.parentElement;
            guard++;
        }
    }

    function expandSwatchSectionsFromUrl() {
        var search = window.location.search;
        if (!search || search.length < 2) {
            return;
        }
        var params;
        try {
            params = new URLSearchParams(search);
        } catch (e) {
            return;
        }
        params.forEach(function (val, key) {
            var base = key.split('[')[0];
            if (!base) {
                return;
            }
            var sw =
                document.querySelector('.swatch-layered.' + escClass(base)) ||
                document.querySelector(
                    '.swatch-layered[data-attribute-code="' + String(base).replace(/"/g, '') + '"]'
                );
            if (sw) {
                alpineOpenAncestors(sw);
            }
        });
    }

    function expandActiveFilterSections() {
        expandHyvaLayeredNavigationPanels();
        expandFilterListsMatchingUrlRequestVars(getActiveFilterRequestVarsFromUrl());

        if (window.Alpine && typeof window.Alpine.nextTick === 'function') {
            try {
                window.Alpine.nextTick(function () {
                    expandHyvaLayeredNavigationPanels();
                    expandFilterListsMatchingUrlRequestVars(getActiveFilterRequestVarsFromUrl());
                });
            } catch (eTickPass) {
                /* ignore */
            }
        }

        var seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;

        function run(root) {
            if (!root || (seen && seen.has(root))) {
                return;
            }
            if (seen) {
                seen.add(root);
            }
            alpineOpenAncestors(root);
        }

        document.querySelectorAll('.venbhas-filter-multiselect[data-venbhas-has-active="1"]').forEach(run);
        document.querySelectorAll('input.filter-checkbox:checked').forEach(run);
        document.querySelectorAll('.venbhas-filter-multiselect .item.active').forEach(function (li) {
            run(li);
        });
        expandSwatchSectionsFromUrl();

        if (window.Alpine && typeof window.Alpine.nextTick === 'function') {
            try {
                window.Alpine.nextTick(function () {
                    document.querySelectorAll('input.filter-checkbox:checked').forEach(function (input) {
                        alpineOpenAncestors(input);
                    });
                });
            } catch (e3) {
                /* ignore */
            }
        }
    }

    function scheduleExpand() {
        expandActiveFilterSections();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleExpand);
    } else {
        scheduleExpand();
    }

    document.addEventListener('alpine:init', function () {
        setTimeout(scheduleExpand, 0);
    });

    window.addEventListener('load', scheduleExpand);

    [0, 50, 150, 400, 800, 1600, 2400, 3200, 5000].forEach(function (ms) {
        setTimeout(scheduleExpand, ms);
    });
})();
