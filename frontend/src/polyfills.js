import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: (fn) => setTimeout(fn, 0),
  listeners: () => [],
  on: () => {},
  removeListener: () => {}
};
