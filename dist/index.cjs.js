'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var runtime_1 = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   module.exports 
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
});

var regenerator = runtime_1;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

var asyncToGenerator = _asyncToGenerator;

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

var arrayWithHoles = _arrayWithHoles;

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

var iterableToArrayLimit = _iterableToArrayLimit;

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

var arrayLikeToArray = _arrayLikeToArray;

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

var unsupportedIterableToArray = _unsupportedIterableToArray;

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var nonIterableRest = _nonIterableRest;

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
}

var slicedToArray = _slicedToArray;

function loadData() {
  return _loadData.apply(this, arguments);
}

function _loadData() {
  _loadData = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
    var buffer, _yield$Promise$all, _yield$Promise$all2, data_muqathaat, data_index_v, data_index_nv, data_posmap_v, data_posmap_nv, data_quran_teks, data_quran_trans_indonesian;

    return regenerator.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            buffer = {};
            _context.next = 3;
            return Promise.all([new Promise(function (resolve) { resolve(require('./data_muqathaat.cjs.js')); }), new Promise(function (resolve) { resolve(require('./data_index_v.cjs.js')); }), new Promise(function (resolve) { resolve(require('./data_index_nv.cjs.js')); }), new Promise(function (resolve) { resolve(require('./data_posmap_v.cjs.js')); }), new Promise(function (resolve) { resolve(require('./data_posmap_nv.cjs.js')); }), new Promise(function (resolve) { resolve(require('./data_quran_teks.cjs.js')); }), new Promise(function (resolve) { resolve(require('./data_quran_trans_indonesian.cjs.js')); })]);

          case 3:
            _yield$Promise$all = _context.sent;
            _yield$Promise$all2 = slicedToArray(_yield$Promise$all, 7);
            data_muqathaat = _yield$Promise$all2[0];
            data_index_v = _yield$Promise$all2[1];
            data_index_nv = _yield$Promise$all2[2];
            data_posmap_v = _yield$Promise$all2[3];
            data_posmap_nv = _yield$Promise$all2[4];
            data_quran_teks = _yield$Promise$all2[5];
            data_quran_trans_indonesian = _yield$Promise$all2[6];
            buffer.muqathaat = data_muqathaat.default;
            buffer.index_v = data_index_v.default;
            buffer.index_nv = data_index_nv.default;
            buffer.posmap_v = data_posmap_v.default;
            buffer.posmap_nv = data_posmap_nv.default;
            buffer.quran_teks = data_quran_teks.default;
            buffer.quran_trans_indonesian = data_quran_trans_indonesian.default;
            return _context.abrupt("return", buffer);

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _loadData.apply(this, arguments);
}

/**
 * Parse Lafzi text data to some defined structures
 * @param {string} buffer
 * @returns {Object.<Number,Object.<Number,string>>}
 */
var parseMuqathaat = function parseMuqathaat(buffer) {
  // Result:
  // Array[noSurat][noAyat] = text
  var lines = buffer.split('\n');
  var result = {};

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var data = line.split('|');

    if (data) {
      var noSurat = data[0];
      var noAyat = data[2];
      var text = data[3];
      if (!result[noSurat]) result[noSurat] = {};
      result[noSurat][noAyat] = text;
    }
  }

  return result;
};
/**
 * @param {string} bufferText
 * @param {string} bufferTrans
 * @returns {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string}>}
 */

var parseQuran = function parseQuran(bufferText, bufferTrans) {
  var lineText = bufferText.split('\n');
  var lineTrans = bufferTrans.split('\n');
  var result = [];

  for (var i = 0; i < lineText.length; i++) {
    var dataText = lineText[i].split('|');
    var dataTrans = lineTrans[i].split('|');
    var obj = {
      surah: Number(dataText[0]),
      name: dataText[1],
      ayat: Number(dataText[2]),
      text: dataText[3],
      trans: dataTrans[2]
    };
    result.push(obj);
  }

  return result;
};
/**
 * convert comma-delimited string to int array
 * @param {string} str
 * @returns {Array.<Number>}
 */

function strToIntArray(str) {
  var arr = str.split(',');
  return arr.map(function (val) {
    return Number(val);
  });
}
/**
 * @param {string} buffer
 * @returns {Array.<Array>}
 */


var parsePosmap = function parsePosmap(buffer) {
  var lines = buffer.split('\n');
  var result = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    result.push(strToIntArray(line));
  }

  return result;
};
/**
 * @param {string} buffer
 * @returns {Object.<string,Array.<{docID:Number,freq:Number,pos:Array.<Number>}>>}
 */

var parseIndex = function parseIndex(buffer) {
  return JSON.parse(buffer);
};

/**
 * Extract trigrams from string
 * @param {string} string
 * @returns {Array.<string>}
 */
function trigram(string) {
  string = string.trim();
  var length = string.length;
  if (length < 3) return [];
  if (length == 3) return [string];
  var trigrams = [];

  for (var i = 0; i <= length - 3; i++) {
    trigrams.push(string.substring(i, i + 3));
  }

  return trigrams;
}
/**
 * Extract trigrams with frequencies
 * @param {string} string
 * @returns {Object.<string,number>}
 */


function extract(string) {
  var trig = trigram(string);
  return trig.reduce(function (acc, e) {
    acc[e] = e in acc ? acc[e] + 1 : 1;
    return acc;
  }, {});
}

/**
 * @param {Array.<number>} arr
 * @returns {number}
 */
function contiguityScore(arr) {
  var diff = [];
  var len = arr.length;
  if (len == 1) return 1;

  for (var i = 0; i < len - 1; i++) {
    diff.push(1 / (arr[i + 1] - arr[i]));
  }

  var sum = diff.reduce(function (a, b) {
    return a + b;
  }, 0);
  return sum / (len - 1);
}
/**
 * Longest Contiguous Subsequence
 * @param {Array.<number>} seq
 * @param {number} [maxgap=7]
 * @returns {Array.<number>}
 */

function LCS(seq, maxgap) {
  if (maxgap === undefined) maxgap = 7;
  seq.sort(function (a, b) {
    return a - b;
  });
  var size = seq.length;
  var start = 0,
      length = 0,
      maxstart = 0,
      maxlength = 0;

  for (var i = 0; i < size - 1; i++) {
    if (seq[i + 1] - seq[i] > maxgap) {
      length = 0;
      start = i + 1;
    } else {
      length++;

      if (length > maxlength) {
        maxlength = length;
        maxstart = start;
      }
    }
  }

  maxlength++;
  return seq.slice(maxstart, maxstart + maxlength);
}
/**
 * @param {Object.<string,Array.<number>>} obj
 * @returns {Array.<number>}
 */

function flattenValues(obj) {
  var result = [];
  var keys = Object.keys(obj);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    result = result.concat(obj[key]);
  }

  return result;
}
/**
 * @param {Array.<number>} hlSequence
 * @param {number} [minLength=3]
 * @returns {Array.<Array.<number>>}
 */

function highlightSpan(hlSequence, minLength) {
  if (minLength === undefined) minLength = 3;
  var len = hlSequence.length;
  if (len == 1) return [[hlSequence[0], hlSequence[0] + minLength]];
  hlSequence.sort(function (a, b) {
    return a - b;
  });
  var result = [];
  var j = 1;

  for (var i = 0; i < len; i++) {
    while (hlSequence[j] !== undefined && hlSequence[j] - hlSequence[j - 1] <= minLength + 1 && j < len) {
      j++;
    }

    result.push([hlSequence[i], hlSequence[j - 1]]);
    i = j - 1;
    j++;
  }

  return result;
}

// =========== Avoid Eval ==================
function otherEval(str) {
  return Function("'use strict'; return (".concat(str, ")"))();
} // =========== PHP replace adapter ==================


function str_replace(search, replace, str) {
  var re = new RegExp(search, "g");
  return str.replace(re, replace);
}

function preg_replace(pattern, replacement, subject) {
  return subject.replace(otherEval(pattern + "g"), replacement);
}

function strtoupper(str) {
  return str.toUpperCase();
} // =========== original Lafzi code ==================

/**
 * mengodekan teks latin (lafadz) menjadi kode fonetik
 * @param {string} $string lafadz dalam teks latin
 * @returns {string} string kode fonetik
 */


function id_fonetik($string) {
  // preproses : uppercase, jadikan spasi tunggal, ubah - jadi spasi, hilangkan semua karakter selain alphabet & ` & '
  $string = strtoupper($string);
  $string = preg_replace("/\\s+/", " ", $string);
  $string = preg_replace("/\\-/", " ", $string);
  $string = preg_replace("/[^A-Z`'\\-\\s]/", "", $string); // transformasi

  $string = id_substitusi_vokal($string);
  $string = id_gabung_konsonan($string);
  $string = id_gabung_vokal($string);
  $string = id_substitusi_diftong($string);
  $string = id_tandai_hamzah($string);
  $string = id_substitusi_ikhfa($string);
  $string = id_substitusi_iqlab($string);
  $string = id_substitusi_idgham($string);
  $string = id_fonetik_2_konsonan($string);
  $string = id_fonetik_1_konsonan($string);
  $string = id_hilangkan_spasi($string);
  return $string;
}
/**
 * mengodekan teks latin (lafadz) menjadi kode fonetik, dihilangkan vokalnya
 * @param {string} $string lafadz dalam teks latin
 * @returns {string} string kode fonetik
 */


function id_fonetik_tanpavokal($string) {
  // preproses : uppercase, jadikan spasi tunggal, ubah - jadi spasi, hilangkan semua karakter selain alphabet & ` & '
  $string = strtoupper($string);
  $string = preg_replace("/\\s+/", " ", $string);
  $string = preg_replace("/\\-/", " ", $string);
  $string = preg_replace("/[^A-Z`'\\-\\s]/", "", $string); // transformasi

  $string = id_substitusi_vokal($string);
  $string = id_gabung_konsonan($string);
  $string = id_gabung_vokal($string);
  $string = id_substitusi_diftong($string);
  $string = id_tandai_hamzah($string);
  $string = id_substitusi_ikhfa($string);
  $string = id_substitusi_iqlab($string);
  $string = id_substitusi_idgham($string);
  $string = id_fonetik_2_konsonan($string);
  $string = id_fonetik_1_konsonan($string);
  $string = id_hilangkan_spasi($string);
  $string = id_hilangkan_vokal($string);
  return $string;
} // substitusi vokal yang tidak ada pada arabic
// param  : $string lafadz dalam teks latin
// return : string vokal tersubstitusi


function id_substitusi_vokal($string) {
  $string = str_replace("O", "A", $string);
  $string = str_replace("E", "I", $string);
  return $string;
} // peleburan konsonan yang sama yang berdampingan
// param  : $string lafadz dalam teks latin
// return : string tanpa konsonan sama berdampingan


function id_gabung_konsonan($string) {
  // gabung yang bergandengan
  $string = preg_replace("/(B|C|D|F|G|H|J|K|L|M|N|P|Q|R|S|T|V|W|X|Y|Z)\\s?\\1+/", "$1", $string); // untuk yang 2 konsonan (KH, SH, dst)

  $string = preg_replace("/(KH|CH|SH|TS|SY|DH|TH|ZH|DZ|GH)\\s?\\1+/", "$1", $string);
  return $string;
} // peleburan vokal yang sama yang berdampingan
// param  : $string lafadz dalam teks latin
// return : string tanpa vokal sama berdampingan


function id_gabung_vokal($string) {
  // gabung yang bergandengan langsung
  $string = preg_replace("/(A|I|U|E|O)\\1+/", "$1", $string);
  return $string;
} // substitusi diftong bahasa Arab
// param  : $string lafadz dalam teks latin
// return : string dengan diftong disesuaikan


function id_substitusi_diftong($string) {
  $string = str_replace("AI", "AY", $string);
  $string = str_replace("AU", "AW", $string);
  return $string;
} // penandaan hamzah
// param  : $string lafadz dalam teks latin
// return : string dengan hamzah ditandai


function id_tandai_hamzah($string) {
  // setelah spasi atau di awal string
  $string = preg_replace("/^(A|I|U)/", " X$1", $string);
  $string = preg_replace("/\\s(A|I|U)/", " X$1", $string); // IA, IU => IXA, IXU

  $string = preg_replace("/I(A|U)/", "IX$1", $string); // UA, UI => UXA, UXI

  $string = preg_replace("/U(A|I)/", "UX$1", $string);
  return $string;
} // substitusi huruf ikhfa (NG)
// param  : $string lafadz dalam teks latin
// return : string dengan huruf ikhfa disesuaikan


function id_substitusi_ikhfa($string) {
  // [vokal][NG][konsonan] => [vokal][N][konsonan]
  $string = preg_replace("/(A|I|U)NG\\s?(D|F|J|K|P|Q|S|T|V|Z)/", "$1N$2", $string);
  return $string;
} // substitusi huruf iqlab
// param  : $string lafadz dalam teks latin
// return : string dengan huruf iqlab disesuaikan


function id_substitusi_iqlab($string) {
  // NB => MB
  $string = preg_replace("/N\\s?B/", "MB", $string);
  return $string;
} // substitusi huruf idgham
// param  : $string lafadz dalam teks latin
// return : string dengan huruf idgham disesuaikan


function id_substitusi_idgham($string) {
  // pengecualian
  $string = str_replace("DUNYA", "DUN_YA", $string);
  $string = str_replace("BUNYAN", "BUN_YAN", $string);
  $string = str_replace("QINWAN", "KIN_WAN", $string);
  $string = str_replace("KINWAN", "KIN_WAN", $string);
  $string = str_replace("SINWAN", "SIN_WAN", $string);
  $string = str_replace("SHINWAN", "SIN_WAN", $string); // N,M,L,R,Y,W

  $string = preg_replace("/N\\s?(N|M|L|R|Y|W)/", "$1", $string); // dikembalikan

  $string = str_replace("DUN_YA", "DUNYA", $string);
  $string = str_replace("BUN_YAN", "BUNYAN", $string);
  $string = str_replace("KIN_WAN", "KINWAN", $string);
  $string = str_replace("SIN_WAN", "SINWAN", $string);
  return $string;
} // substitusi fonetik 2 konsonan
// param  : $string lafadz dalam teks latin
// return : kode fonetik string


function id_fonetik_2_konsonan($string) {
  $string = preg_replace("/KH|CH/", "H", $string);
  $string = preg_replace("/SH|TS|SY/", "S", $string);
  $string = preg_replace("/DH/", "D", $string);
  $string = preg_replace("/ZH|DZ/", "Z", $string);
  $string = preg_replace("/TH/", "T", $string);
  $string = preg_replace("/NG(A|I|U)/", "X$1", $string); // mengatasi "ngalamin"

  $string = preg_replace("/GH/", "G", $string);
  return $string;
} // substitusi fonetik 1 konsonan
// param  : $string lafadz dalam teks latin
// return : kode fonetik string


function id_fonetik_1_konsonan($string) {
  $string = preg_replace("/'|`/", "X", $string);
  $string = preg_replace("/Q|K/", "K", $string);
  $string = preg_replace("/F|V|P/", "F", $string);
  $string = preg_replace("/J|Z/", "Z", $string);
  return $string;
} // menghilangkan spasi
// param  : $string lafadz dalam teks latin
// return : string tanpa spasi


function id_hilangkan_spasi($string) {
  return preg_replace("/\\s/", "", $string);
} // menghilangkan vokal
// param  : $string lafadz dalam teks latin
// return : string tanpa vokal


function id_hilangkan_vokal($string) {
  return preg_replace("/A|I|U/", "", $string);
}

String.prototype.splice = function (idx, rem, s) {
  return this.slice(0, idx) + s + this.slice(idx + Math.abs(rem));
};

function hilight(text, posArray) {
  var startPos, endPos;
  var tmpText = text; // workaround for chromium arabic bug (not completed yet)

  for (var i = posArray.length - 1; i >= 0; i--) {
    startPos = posArray[i][0];
    endPos = posArray[i][1] + 1;
    if (tmpText.length <= startPos) continue;
    var spanStart = "<span class='hl_block'>";
    var spanEnd = "</span>";
    text = text.splice(endPos, 0, spanEnd);
    text = text.splice(startPos, 0, spanStart);
  }

  return text;
}

var LafziDocument = function LafziDocument() {
  this.id = 0;
  this.matchCount = 0;
  this.contigScore = 0;
  this.score = 0;
  this.matchTerms = {};
  this.LCS = [];
  this.highlightPos = [];
};
/**
 * @param {Object.<string,Array.<{docID:Number,freq:Number,pos:Array.<Number>}>>} docIndex
 * @param {string} query
 * @param {number} threshold
 * @param {string} [mode='v']
 * @param {searchCb} callback
 */


var search = function search(docIndex, query, threshold, mode, callback) {
  //  mode = v | nv
  if (mode === undefined) mode = 'v';
  var queryFinal;
  if (mode == 'v') queryFinal = id_fonetik(query);else queryFinal = id_fonetik_tanpavokal(query);
  var queryTrigrams = extract(queryFinal);
  if (Object.keys(queryTrigrams).length <= 0) callback([]);
  var matchedDocs = {};
  Object.keys(queryTrigrams).forEach(function (trigram) {
    var trigramFreq = queryTrigrams[trigram];

    if (docIndex[trigram] && Array.isArray(docIndex[trigram])) {
      var indexEntry = docIndex[trigram];

      for (var i = 0; i < indexEntry.length; i++) {
        var match = indexEntry[i]; // hitung jumlah kemunculan dll

        if (matchedDocs[match.docID] !== undefined) {
          matchedDocs[match.docID].matchCount += trigramFreq < match.freq ? trigramFreq : match.freq;
        } else {
          matchedDocs[match.docID] = new LafziDocument();
          matchedDocs[match.docID].matchCount = 1;
          matchedDocs[match.docID].id = match.docID;
        }

        matchedDocs[match.docID].matchTerms[trigram] = match.pos;
      }
    }
  });
  var filteredDocs = [];
  var minScore = parseFloat(threshold * Object.keys(queryTrigrams).length).toPrecision(2);
  var matches = Object.keys(matchedDocs);

  for (var i = 0; i < matches.length; i++) {
    var docID = matches[i];
    var doc = matchedDocs[docID];
    var lcs = LCS(flattenValues(doc.matchTerms));
    var orderScore = lcs.length;
    doc.LCS = lcs;
    doc.contigScore = contiguityScore(lcs);
    doc.score = orderScore * doc.contigScore;

    if (doc.score >= minScore) {
      filteredDocs.push(doc);
    }
  }

  return new Promise(function (resolve, reject) {
    resolve(filteredDocs);
  }); // callback(filteredDocs);
};
/**
 * @callback searchCb
 * @param {Array.<LafziDocument>} res
 */

Array.prototype.unique = function () {
  var u = {},
      a = [];

  for (var i = 0, l = this.length; i < l; ++i) {
    if (u.hasOwnProperty(this[i])) {
      continue;
    }

    a.push(this[i]);
    u[this[i]] = 1;
  }

  return a;
};
/**
 * @param {Array.<LafziDocument>} filteredDocs
 * @param {Array.<Array>} posmapData
 * @param {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string}>} quranTextData
 * @param {rankCb} callback
 */


var rank = function rank(filteredDocs, posmapData, quranTextData) {
  var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      _ref$multipleHighligh = _ref.multipleHighlightPos,
      multipleHighlightPos = _ref$multipleHighligh === void 0 ? false : _ref$multipleHighligh;

  for (var i = 0; i < filteredDocs.length; i++) {
    var doc = filteredDocs[i];
    var realPos = [];
    var posmap = posmapData[doc.id - 1];
    var seq = [];

    for (var j = 0; j < doc.LCS.length; j++) {
      var pos = doc.LCS[j];
      seq.push(pos);
      seq.push(pos + 1);
      seq.push(pos + 2);
    }

    seq = seq.unique();

    for (var k = 0; k < seq.length; k++) {
      var _pos = seq[k];
      realPos.push(posmap[_pos - 1]);
    } // additional highlight custom


    var tmpHighlight = highlightSpan(realPos, 6);
    doc.highlightPos = tmpHighlight.filter(function (o) {
      return o[0] != undefined && o[1] != undefined;
    }); // additional scoring based on space

    if (quranTextData !== undefined && doc.highlightPos.length) {
      if (multipleHighlightPos) {
        for (var _k = 0; _k < doc.highlightPos.length; _k++) {
          var endPos = doc.highlightPos[_k][1];
          var docText = quranTextData[doc.id - 1].text;

          if (docText[endPos + 1] == ' ' || docText[endPos + 2] == ' ' || docText[endPos + 3] == ' ') {
            // doc.score += 0.001;
            doc.highlightPos[_k][1] += 2; // tambah 2 karakter
          }
        }
      } else {
        var _endPos = doc.highlightPos[doc.highlightPos.length - 1][1];
        var _docText = quranTextData[doc.id - 1].text;

        if (_docText[_endPos + 1] == ' ' || _docText[_endPos + 2] == ' ' || _docText[_endPos + 3] == ' ') {
          // doc.score += 0.001;
          doc.highlightPos[0][1] += 2; // tambah 2 karakter
        }
      }
    }

    delete doc.LCS;
    delete doc.matchTerms;
    delete doc.contigScore;
  }

  filteredDocs.sort(function (docA, docB) {
    return docB.score - docA.score;
  });
  return new Promise(function (resolve, reject) {
    resolve(filteredDocs);
  });
};
/**
 * @callback rankCb
 * @param {Array.<LafziDocument>} res
 */

/**
 * Prepare search result for view
 * @param {Array.<{id:number,matchCount:number,score:number,highlightPos:Array.<number>}>}  rankedSearchResult
 * @param {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string}>}         quranTextData
 * @param {prepareCb} callback
 */

var prepare = function prepare(rankedSearchResult, quranTextData) {
  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      muqathaatData = _ref2.muqathaatData,
      _ref2$isHilight = _ref2.isHilight,
      isHilight = _ref2$isHilight === void 0 ? true : _ref2$isHilight,
      _ref2$multipleHighlig = _ref2.multipleHighlightPos,
      multipleHighlightPos = _ref2$multipleHighlig === void 0 ? false : _ref2$multipleHighlig;

  var result = [];

  for (var i = 0; i < rankedSearchResult.length; i++) {
    var searchRes = rankedSearchResult[i];
    var quranData = quranTextData[searchRes.id - 1];
    var obj = {
      surah: quranData.surah,
      name: quranData.name,
      ayat: quranData.ayat,
      text: quranData.text,
      trans: quranData.trans,
      score: searchRes.score,
      highlightPos: searchRes.highlightPos
    };

    if (muqathaatData && muqathaatData[obj.surah] && muqathaatData[obj.surah][obj.ayat]) {
      obj.text = muqathaatData[obj.surah][obj.ayat];
    }

    obj.highlightPos = multipleHighlightPos ? obj.highlightPos : obj.highlightPos.slice(0, 1); // hilight feature

    obj = isHilight ? Object.assign(obj, {
      text_hilight: hilight(obj.text, obj.highlightPos)
    }) : obj;
    result.push(obj);
  }

  return new Promise(function (resolve, reject) {
    resolve(result);
  }); // callback(result);
};
/**
 * @callback prepareCb
 * @param {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string,score:number,highlightPos:Array.<number>}>} res
 */

function parseData() {
  return _parseData.apply(this, arguments);
}

function _parseData() {
  _parseData = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
    var buffer, dataMuqathaat, dataQuran, dataPosmap, dataIndex;
    return regenerator.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return loadData();

          case 2:
            buffer = _context.sent;
            dataMuqathaat = parseMuqathaat(buffer["muqathaat"]);
            dataQuran = parseQuran(buffer["quran_teks"], buffer["quran_trans_indonesian"]);
            dataPosmap = {};
            dataPosmap["nv"] = parsePosmap(buffer["posmap_nv"]);
            dataPosmap["v"] = parsePosmap(buffer["posmap_v"]);
            dataIndex = {};
            dataIndex["nv"] = parseIndex(buffer["index_nv"]);
            dataIndex["v"] = parseIndex(buffer["index_v"]);
            return _context.abrupt("return", {
              dataIndex: dataIndex,
              dataPosmap: dataPosmap,
              dataQuran: dataQuran,
              dataMuqathaat: dataMuqathaat
            });

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _parseData.apply(this, arguments);
}

function optimizedThreshold(t) {
  var tmpT = parseFloat(t).toPrecision(2) * 10;

  if (tmpT - 1 !== 0) {
    return --tmpT / 10;
  }

  return t;
}

function checkQuery(query) {
  if (query) {
    return decodeURIComponent(query.trim()).replace(/(\-|\+)/g, " ");
  }

  return null;
}

function index() {
  return _index.apply(this, arguments);
}

function _index() {
  _index = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2() {
    var _ref,
        _ref$mode,
        mode,
        _ref$threshold,
        threshold,
        _ref$isHilight,
        isHilight,
        _ref$query,
        query,
        _ref$multipleHighligh,
        multipleHighlightPos,
        _yield$parseData,
        dataIndex,
        dataPosmap,
        dataQuran,
        dataMuqathaat,
        searched,
        oldThreshold,
        ranked,
        result,
        _args2 = arguments;

    return regenerator.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _ref = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : {}, _ref$mode = _ref.mode, mode = _ref$mode === void 0 ? "v" : _ref$mode, _ref$threshold = _ref.threshold, threshold = _ref$threshold === void 0 ? 0.95 : _ref$threshold, _ref$isHilight = _ref.isHilight, isHilight = _ref$isHilight === void 0 ? true : _ref$isHilight, _ref$query = _ref.query, query = _ref$query === void 0 ? null : _ref$query, _ref$multipleHighligh = _ref.multipleHighlightPos, multipleHighlightPos = _ref$multipleHighligh === void 0 ? false : _ref$multipleHighligh;
            query = checkQuery(query);

            if (!(query == null)) {
              _context2.next = 4;
              break;
            }

            return _context2.abrupt("return", []);

          case 4:
            _context2.next = 6;
            return parseData();

          case 6:
            _yield$parseData = _context2.sent;
            dataIndex = _yield$parseData.dataIndex;
            dataPosmap = _yield$parseData.dataPosmap;
            dataQuran = _yield$parseData.dataQuran;
            dataMuqathaat = _yield$parseData.dataMuqathaat;
            _context2.next = 13;
            return search(dataIndex[mode], query, threshold, mode);

          case 13:
            searched = _context2.sent;
            oldThreshold = threshold;

            if (!(searched && searched.length == 0 && oldThreshold !== threshold)) {
              _context2.next = 21;
              break;
            }

            threshold = optimizedThreshold(threshold);
            oldThreshold = threshold;
            _context2.next = 20;
            return search(dataIndex[mode], query, threshold, mode);

          case 20:
            searched = _context2.sent;

          case 21:
            if (!(searched && searched.length == 0 && oldThreshold !== threshold)) {
              _context2.next = 25;
              break;
            }

            _context2.next = 24;
            return search(dataIndex[mode], query, threshold, mode);

          case 24:
            searched = _context2.sent;

          case 25:
            _context2.next = 27;
            return rank(searched, dataPosmap[mode], dataQuran, {
              multipleHighlightPos: multipleHighlightPos
            });

          case 27:
            ranked = _context2.sent;
            _context2.next = 30;
            return prepare(ranked, dataQuran, {
              muqathaatData: dataMuqathaat,
              isHilight: isHilight,
              multipleHighlightPos: multipleHighlightPos
            });

          case 30:
            result = _context2.sent;
            return _context2.abrupt("return", result);

          case 32:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _index.apply(this, arguments);
}

module.exports = index;
