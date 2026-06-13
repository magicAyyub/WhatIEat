if (typeof global.DOMException === "undefined") {
  (global as any).DOMException = Error;
}

import "expo-router/entry";
