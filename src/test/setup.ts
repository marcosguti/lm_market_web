import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

const createComputedStyle = (): CSSStyleDeclaration =>
  ({
    getPropertyValue: () => '',
    width: '0px',
    height: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingTop: '0px',
    paddingBottom: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    borderLeftWidth: '0px',
    borderRightWidth: '0px',
    overflow: 'visible',
    overflowX: 'visible',
    overflowY: 'visible',
    position: 'static',
    display: 'block',
  }) as CSSStyleDeclaration;

Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: (_element?: Element) => createComputedStyle(),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

HTMLElement.prototype.scrollIntoView = vi.fn();
HTMLElement.prototype.scrollTo = vi.fn();
window.scrollTo = vi.fn();
