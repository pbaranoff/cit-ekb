(() => {
  'use strict';

  function init() {
    const body = document.body;
    const mobileViewport = window.matchMedia('(max-width: 1359px)');
    const menu = document.querySelector('#mobile-menu');
    const menuTriggers = [...document.querySelectorAll('[data-menu-open]')];
    const dropdowns = [...document.querySelectorAll('details[data-dropdown]')];
    const sidebarToggle = document.querySelector('#sidebar-toggle');
    const form = document.querySelector('#container-form');
    const prefixInput = document.querySelector('#container-prefix');
    const numberInput = document.querySelector('#container-number');
    const tracking = document.querySelector('#container-tracking');
    const error = document.querySelector('#container-error');
    let returnFocusTo = null;

    function dropdownScope(dropdown) {
      return dropdown.closest('[data-dropdown-scope], nav, header, dialog') || document;
    }

    function closeDropdowns(scope = document, except = null) {
      dropdowns.forEach((dropdown) => {
        if (dropdown !== except && scope.contains(dropdown)) dropdown.open = false;
      });
    }

    dropdowns.forEach((dropdown) => {
      dropdown.addEventListener('toggle', () => {
        if (dropdown.open) closeDropdowns(dropdownScope(dropdown), dropdown);
      });
    });

    document.addEventListener('click', (event) => {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target)) dropdown.open = false;
      });
      if (event.target.closest('a')) closeDropdowns();
    });

    // Close a submenu before allowing Escape to close the modal menu itself.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openDropdown = dropdowns.find((dropdown) => dropdown.open);
      if (!openDropdown) return;
      event.preventDefault();
      closeDropdowns();
      openDropdown.querySelector('summary')?.focus();
    }, true);

    function updateMenuState(open) {
      body.classList.toggle('is-menu-open', open);
      menuTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(open)));
    }

    function openMenu() {
      if (!menu || menu.open || !mobileViewport.matches) return;
      returnFocusTo = document.activeElement;
      closeDropdowns();
      menu.showModal();
      updateMenuState(true);
      menu.querySelector('[data-menu-close]')?.focus();
    }

    function closeMenu() {
      if (menu?.open) menu.close();
    }

    if (menu) {
      menuTriggers.forEach((trigger) => trigger.addEventListener('click', openMenu));
      menu.querySelectorAll('[data-menu-close]').forEach((button) => {
        button.addEventListener('click', closeMenu);
      });
      menu.addEventListener('click', (event) => {
        if (event.target !== menu) return;
        const bounds = menu.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
      });
      menu.addEventListener('close', () => {
        updateMenuState(false);
        closeDropdowns(menu);
        // The native dialog also restores focus; keep it explicit for host integration.
        if (returnFocusTo?.isConnected && returnFocusTo.getClientRects().length) {
          returnFocusTo.focus({ preventScroll: true });
        }
        returnFocusTo = null;
      });
      menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
      updateMenuState(false);
    }

    // The details element contains the whole menu on interior pages.
    const sidebarMenu = document.querySelector('.page-tools') || document.querySelector('#sidebar');
    if (sidebarMenu) {
      function updateSidebarPosition() {
        const height = sidebarMenu.getBoundingClientRect().height;
        // The menu's bottom padding reserves the space occupied by the fixed button.
        const fits = !mobileViewport.matches && height > 0 && height <= document.documentElement.clientHeight;
        sidebarMenu.classList.toggle('is-sticky-sidebar', fits);
      }

      new ResizeObserver(updateSidebarPosition).observe(sidebarMenu, { box: 'border-box' });
      window.addEventListener('resize', updateSidebarPosition);
      updateSidebarPosition();
    }

    function setSidebarExpanded(expanded) {
      body.classList.toggle('is-sidebar-collapsed', !expanded);
      if (!sidebarToggle) return;
      sidebarToggle.setAttribute('aria-expanded', String(expanded));
      const label = sidebarToggle.querySelector('[data-sidebar-label]');
      if (label) label.textContent = expanded ? 'Скрыть' : 'Показать';
    }

    sidebarToggle?.addEventListener('click', () => {
      if (!mobileViewport.matches) {
        setSidebarExpanded(body.classList.contains('is-sidebar-collapsed'));
      }
    });
    setSidebarExpanded(true);

    function syncViewport() {
      setSidebarExpanded(true);
      if (!mobileViewport.matches) closeMenu();
    }
    mobileViewport.addEventListener('change', syncViewport);

    function showTracking(visible) {
      const shown = Boolean(visible);
      if (tracking) tracking.hidden = !shown;
      body.classList.toggle('has-tracking', shown);
    }

    function clearError() {
      if (error) {
        error.textContent = '';
        error.hidden = true;
      }
      prefixInput?.removeAttribute('aria-invalid');
      numberInput?.removeAttribute('aria-invalid');
    }

    function showError(message, invalidInput = null) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
      if (invalidInput) {
        invalidInput.setAttribute('aria-invalid', 'true');
        invalidInput.focus();
      }
    }

    if (form && prefixInput && numberInput) {
      // Native validation is replaced with one visible, accessible message.
      form.noValidate = true;

      function normalizeInput(input, kind) {
        const before = input.value;
        const cursor = input.selectionStart ?? before.length;
        const normalize = (value) => kind === 'prefix'
          ? value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
          : value.replace(/\D/g, '').slice(0, 7);
        const after = normalize(before);
        if (before !== after) {
          input.value = after;
          const nextCursor = normalize(before.slice(0, cursor)).length;
          input.setSelectionRange(nextCursor, nextCursor);
        }
        clearError();
      }

      prefixInput.addEventListener('input', (event) => {
        normalizeInput(prefixInput, 'prefix');
        if (prefixInput.value.length === 4 && prefixInput.selectionStart === 4 &&
            event.inputType?.startsWith('insert')) {
          numberInput.focus();
          numberInput.setSelectionRange(0, numberInput.value.length);
        }
      });
      numberInput.addEventListener('input', () => normalizeInput(numberInput, 'number'));

      [prefixInput, numberInput].forEach((input) => {
        input.addEventListener('paste', (event) => {
          const pasted = event.clipboardData?.getData('text') || '';
          const compact = pasted.toUpperCase().replace(/[\s-]/g, '');
          if (!/^[A-Z]{4}\d{7}$/.test(compact)) return;
          event.preventDefault();
          prefixInput.value = compact.slice(0, 4);
          numberInput.value = compact.slice(4);
          clearError();
          numberInput.focus();
          numberInput.setSelectionRange(7, 7);
        });
      });

      numberInput.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !numberInput.value) {
          event.preventDefault();
          prefixInput.focus();
          prefixInput.setSelectionRange(prefixInput.value.length, prefixInput.value.length);
        }
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        normalizeInput(prefixInput, 'prefix');
        normalizeInput(numberInput, 'number');
        showTracking(false);
        if (!/^[A-Z]{4}$/.test(prefixInput.value)) {
          showError('Введите четыре латинские буквы номера контейнера.', prefixInput);
          return;
        }
        if (!/^\d{7}$/.test(numberInput.value)) {
          showError('Введите семь цифр номера контейнера.', numberInput);
          return;
        }
        const searchEvent = new CustomEvent('cit:container-search', {
          bubbles: true,
          cancelable: true,
          detail: { containerNumber: prefixInput.value + numberInput.value },
        });
        // A host handler calls preventDefault() to take responsibility for the request.
        if (form.dispatchEvent(searchEvent)) {
          showError('Поиск будет доступен после подключения сервиса.');
        }
      });

      form.addEventListener('reset', () => {
        // The reset event precedes the browser's default restoration of field values.
        queueMicrotask(() => {
          prefixInput.value = '';
          numberInput.value = '';
          clearError();
          showTracking(false);
          prefixInput.focus();
        });
      });
      document.querySelectorAll('[data-container-clear]').forEach((button) => {
        if (button.type === 'reset' && button.form === form) return;
        button.addEventListener('click', (event) => {
          event.preventDefault();
          form.reset();
        });
      });
    }

    // Only this explicit preview URL reveals the fixture copied from Figma.
    const params = new URLSearchParams(window.location.search);
    showTracking(params.get('state') === 'tracking');
    if (params.get('menu') === 'open') openMenu();

    // Backend integrations update the existing DOM before showing a real result.
    window.CIT = Object.assign(window.CIT || {}, {
      showTracking,
      clearSearchError: clearError,
      showSearchError: showError,
      openMenu,
      closeMenu,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
