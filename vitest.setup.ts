import "@testing-library/jest-dom"

// jsdom polyfills for browser APIs used in components/tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error: jsdom global augmentation for tests only
global.ResizeObserver = global.ResizeObserver || ResizeObserver

if (typeof window !== "undefined") {
  // Minimal URL.createObjectURL stub for Blob-based downloads in tests
  if (!window.URL) {
    // @ts-expect-error: define URL if missing
    window.URL = {} as URL
  }
  if (!window.URL.createObjectURL) {
    // @ts-expect-error: jsdom polyfill
    window.URL.createObjectURL = () => "blob:mock"
  }
  if (!window.URL.revokeObjectURL) {
    // @ts-expect-error: jsdom polyfill
    window.URL.revokeObjectURL = () => {}
  }
}

