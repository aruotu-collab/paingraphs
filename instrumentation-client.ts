const INJECTED_ATTRS = ["data-cursor-ref", "data-cursor-element-id"] as const;

function stripInjectedAttrs(root: ParentNode = document) {
  for (const attr of INJECTED_ATTRS) {
    for (const node of root.querySelectorAll(`[${attr}]`)) {
      node.removeAttribute(attr);
    }
  }
}

function stripNode(node: Node) {
  if (!(node instanceof Element)) return;
  for (const attr of INJECTED_ATTRS) {
    node.removeAttribute(attr);
  }
  stripInjectedAttrs(node);
}

function isInjectedAttrNoise(args: unknown[]) {
  return args.some((arg) => typeof arg === "string" && INJECTED_ATTRS.some((attr) => arg.includes(attr)));
}

const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (isInjectedAttrNoise(args)) return;
  originalError(...args);
};

stripInjectedAttrs();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "attributes" && mutation.target instanceof Element) {
      for (const attr of INJECTED_ATTRS) {
        mutation.target.removeAttribute(attr);
      }
    }
    for (const node of mutation.addedNodes) {
      stripNode(node);
    }
  }
});

observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: [...INJECTED_ATTRS],
});

window.setTimeout(() => observer.disconnect(), 10_000);
