class EventTarget {
  addEventListener() {
  }
  removeEventListener() {
  }
  dispatchEvent() {
    return true;
  }
}
class Node extends EventTarget {
}
class Element extends Node {
  constructor() {
    super(...arguments);
    this.role = null;
  }
}
class ResizeObserver {
  observe() {
  }
  unobserve() {
  }
  disconnect() {
  }
}
const documentShim = {
  createElement: function() {
    return new globalThisShim.HTMLElement();
  },
  createElementNS: function() {
    return new globalThisShim.HTMLElement();
  },
  addEventListener() {
  },
  removeEventListener() {
  },
  /**
   *
   * @param {Event} event
   * @returns {boolean}
   */
  dispatchEvent(event) {
    return false;
  }
};
const globalThisShim = {
  ResizeObserver,
  document: documentShim,
  Node,
  Element,
  HTMLElement: class HTMLElement extends Element {
    constructor() {
      super(...arguments);
      this.innerHTML = "";
    }
    get content() {
      return new globalThisShim.DocumentFragment();
    }
  },
  DocumentFragment: class DocumentFragment extends EventTarget {
  },
  customElements: {
    get: function() {
    },
    define: function() {
    },
    whenDefined: function() {
    }
  },
  localStorage: {
    /**
     * @param {string} key
     * @returns {string|null}
     */
    getItem(key) {
      return null;
    },
    /**
     * @param {string} key
     * @param {string} value
     */
    setItem(key, value) {
    },
    // eslint-disable-line @typescript-eslint/no-unused-vars
    /**
     * @param {string} key
     */
    removeItem(key) {
    }
    // eslint-disable-line @typescript-eslint/no-unused-vars
  },
  CustomEvent: function CustomEvent() {
  },
  getComputedStyle: function() {
  },
  navigator: {
    languages: [],
    get userAgent() {
      return "";
    }
  },
  /**
   * @param {string} media
   */
  matchMedia(media) {
    return {
      matches: false,
      media
    };
  }
};
const isServer = typeof window === "undefined" || typeof window.customElements === "undefined";
const isShimmed = Object.keys(globalThisShim).every((key) => key in globalThis);
const GlobalThis = isServer && !isShimmed ? globalThisShim : globalThis;
const Document = isServer && !isShimmed ? documentShim : globalThis.document;
export {
  Document,
  GlobalThis,
  Document as document,
  GlobalThis as globalThis,
  isServer
};
