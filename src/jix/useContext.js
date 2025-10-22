/**
 * A central, private registry for active context values.
 * The Map holds a context's unique Symbol ID as a key and a stack (array) 
 * of its values as the value.
 * e.g., Map<Symbol(ContextId), [value1, value2, ...]>
 */
const activeContexts = new Map();

/**
 * Creates a new Context object.
 * This object acts as a handle for providing and reading values.
 * @template T
 * @param {*} defaultValue The value to be used by useContext when no provider is found.
 * @returns {{defaultValue: *, _id: symbol, provide: (value: *, callback: () => T) => T}} A context object with a `provide` method.
 */
export function createContext(defaultValue) {
  // Use a Symbol for a truly unique, internal ID for this context.
  // This ID will be the key in our activeContexts map.
  const contextId = Symbol('ContextId');

  const context = {
    defaultValue,
    _id: contextId, // Exposing the ID for useContext to use.

    /**
     * Provides a value for this context for the duration of the callback's execution.
     *
     * @param {*} value The value to provide to consumers within the callback.
     * @param {() => any} callback The function to execute within this context's scope.
     * @returns The return value of the callback function.
     */
    provide(value, callback) {
      // Get or create the value stack for this specific context
      if (!activeContexts.has(contextId)) {
        activeContexts.set(contextId, []);
      }
      const valueStack = activeContexts.get(contextId);

      // Push the new value onto the stack
      valueStack.push(value);

      try {
        // Run the provided function. Any `useContext(context)` call inside
        // will now see the value we just pushed.
        return callback();
      } finally {
        // CRITICAL: Always remove the value from the stack after the callback
        // has finished, even if it threw an error.
        valueStack.pop();
      }
    },
  };

  return context;
}

/**
 * Reads the current value of a context.
 * It finds the value provided by the nearest ancestor `provide` call for the given context.
 * If no provider is found, it returns the context's `defaultValue`.
 *
 * @param {object} context The context object created by `createContext`.
 * @returns {*} The current value of the context.
 */
export function useContext(context) {
  const contextId = context._id;

  // Check if there's any active provider for this context
  if (!activeContexts.has(contextId)) {
    return context.defaultValue;
  }

  const valueStack = activeContexts.get(contextId);

  // If the stack is empty, we are outside any `provide` call
  if (valueStack.length === 0) {
    return context.defaultValue;
  }

  // The current value is the one at the top of the stack
  return valueStack[valueStack.length - 1];
}