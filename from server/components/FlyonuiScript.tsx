'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import $ from 'jquery';
import _ from 'lodash';
import noUiSlider from 'nouislider';

async function loadFlyonUI() {
  return import('flyonui/flyonui');
}

export default function FlyonuiScript() {
  const path = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.$ = $;
    window.jQuery = $;
    window._ = _;
    window.noUiSlider = noUiSlider;

    loadFlyonUI();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === 'function'
      ) {
        window.HSStaticMethods.autoInit();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [path]);

  return null;
}
