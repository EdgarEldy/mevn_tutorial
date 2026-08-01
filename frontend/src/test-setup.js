// jsdom doesn't implement ResizeObserver, which several Vuetify components
// (VFooter, VPagination, ...) use internally.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub

// jsdom also doesn't implement window.visualViewport, which VOverlay (VMenu, VDialog, ...)
// reads for positioning.
globalThis.visualViewport =
  globalThis.visualViewport ||
  {
    addEventListener() {},
    removeEventListener() {},
    width: 0,
    height: 0,
  }
