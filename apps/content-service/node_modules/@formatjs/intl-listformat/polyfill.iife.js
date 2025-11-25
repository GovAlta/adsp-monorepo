(() => {
  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/tslib@2.4.0/node_modules/tslib/tslib.es6.js
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign = function() {
    __assign = Object.assign || function __assign2(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar)
            ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeLocaleList.js
  function CanonicalizeLocaleList(locales) {
    return Intl.getCanonicalLocales(locales);
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/262.js
  function ToString(o) {
    if (typeof o === "symbol") {
      throw TypeError("Cannot convert a Symbol value to a string");
    }
    return String(o);
  }
  function ToObject(arg) {
    if (arg == null) {
      throw new TypeError("undefined/null cannot be converted to object");
    }
    return Object(arg);
  }
  var MINUTES_PER_HOUR = 60;
  var SECONDS_PER_MINUTE = 60;
  var MS_PER_SECOND = 1e3;
  var MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
  var MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/GetOption.js
  function GetOption(opts, prop, type, values, fallback) {
    if (typeof opts !== "object") {
      throw new TypeError("Options must be an object");
    }
    var value = opts[prop];
    if (value !== void 0) {
      if (type !== "boolean" && type !== "string") {
        throw new TypeError("invalid type");
      }
      if (type === "boolean") {
        value = Boolean(value);
      }
      if (type === "string") {
        value = ToString(value);
      }
      if (values !== void 0 && !values.filter(function(val) {
        return val == value;
      }).length) {
        throw new RangeError("".concat(value, " is not within ").concat(values.join(", ")));
      }
      return value;
    }
    return fallback;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/GetOptionsObject.js
  function GetOptionsObject(options) {
    if (typeof options === "undefined") {
      return /* @__PURE__ */ Object.create(null);
    }
    if (typeof options === "object") {
      return options;
    }
    throw new TypeError("Options must be an object");
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/IsSanctionedSimpleUnitIdentifier.js
  var SANCTIONED_UNITS = [
    "angle-degree",
    "area-acre",
    "area-hectare",
    "concentr-percent",
    "digital-bit",
    "digital-byte",
    "digital-gigabit",
    "digital-gigabyte",
    "digital-kilobit",
    "digital-kilobyte",
    "digital-megabit",
    "digital-megabyte",
    "digital-petabyte",
    "digital-terabit",
    "digital-terabyte",
    "duration-day",
    "duration-hour",
    "duration-millisecond",
    "duration-minute",
    "duration-month",
    "duration-second",
    "duration-week",
    "duration-year",
    "length-centimeter",
    "length-foot",
    "length-inch",
    "length-kilometer",
    "length-meter",
    "length-mile-scandinavian",
    "length-mile",
    "length-millimeter",
    "length-yard",
    "mass-gram",
    "mass-kilogram",
    "mass-ounce",
    "mass-pound",
    "mass-stone",
    "temperature-celsius",
    "temperature-fahrenheit",
    "volume-fluid-ounce",
    "volume-gallon",
    "volume-liter",
    "volume-milliliter"
  ];
  function removeUnitNamespace(unit) {
    return unit.slice(unit.indexOf("-") + 1);
  }
  var SIMPLE_UNITS = SANCTIONED_UNITS.map(removeUnitNamespace);

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/utils.js
  function setInternalSlot(map, pl, field, value) {
    if (!map.get(pl)) {
      map.set(pl, /* @__PURE__ */ Object.create(null));
    }
    var slots = map.get(pl);
    slots[field] = value;
  }
  function getInternalSlot(map, pl, field) {
    return getMultiInternalSlots(map, pl, field)[field];
  }
  function getMultiInternalSlots(map, pl) {
    var fields = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      fields[_i - 2] = arguments[_i];
    }
    var slots = map.get(pl);
    if (!slots) {
      throw new TypeError("".concat(pl, " InternalSlot has not been initialized"));
    }
    return fields.reduce(function(all, f) {
      all[f] = slots[f];
      return all;
    }, /* @__PURE__ */ Object.create(null));
  }
  function isLiteralPart(patternPart) {
    return patternPart.type === "literal";
  }
  function invariant(condition, message, Err) {
    if (Err === void 0) {
      Err = Error;
    }
    if (!condition) {
      throw new Err(message);
    }
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/regex.generated.js
  var S_UNICODE_REGEX = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BF\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEE0-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF73\uDF80-\uDFD8\uDFE0-\uDFEB]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDD78\uDD7A-\uDDCB\uDDCD-\uDE53\uDE60-\uDE6D\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6\uDF00-\uDF92\uDF94-\uDFCA]/;

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/format_to_parts.js
  var CARET_S_UNICODE_REGEX = new RegExp("^".concat(S_UNICODE_REGEX.source));
  var S_DOLLAR_UNICODE_REGEX = new RegExp("".concat(S_UNICODE_REGEX.source, "$"));

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/CanonicalizeLocaleList.js
  function CanonicalizeLocaleList2(locales) {
    return Intl.getCanonicalLocales(locales);
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/languageMatching.js
  var data = {
    supplemental: {
      languageMatching: {
        "written-new": [
          {
            paradigmLocales: {
              _locales: "en en_GB es es_419 pt_BR pt_PT"
            }
          },
          {
            $enUS: {
              _value: "AS+CA+GU+MH+MP+PH+PR+UM+US+VI"
            }
          },
          {
            $cnsar: {
              _value: "HK+MO"
            }
          },
          {
            $americas: {
              _value: "019"
            }
          },
          {
            $maghreb: {
              _value: "MA+DZ+TN+LY+MR+EH"
            }
          },
          {
            no: {
              _desired: "nb",
              _distance: "1"
            }
          },
          {
            bs: {
              _desired: "hr",
              _distance: "4"
            }
          },
          {
            bs: {
              _desired: "sh",
              _distance: "4"
            }
          },
          {
            hr: {
              _desired: "sh",
              _distance: "4"
            }
          },
          {
            sr: {
              _desired: "sh",
              _distance: "4"
            }
          },
          {
            aa: {
              _desired: "ssy",
              _distance: "4"
            }
          },
          {
            de: {
              _desired: "gsw",
              _distance: "4",
              _oneway: "true"
            }
          },
          {
            de: {
              _desired: "lb",
              _distance: "4",
              _oneway: "true"
            }
          },
          {
            no: {
              _desired: "da",
              _distance: "8"
            }
          },
          {
            nb: {
              _desired: "da",
              _distance: "8"
            }
          },
          {
            ru: {
              _desired: "ab",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ach",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            nl: {
              _desired: "af",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ak",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "am",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            es: {
              _desired: "ay",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "az",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ur: {
              _desired: "bal",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "be",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "bem",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            hi: {
              _desired: "bh",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "bn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "bo",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "br",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            es: {
              _desired: "ca",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            fil: {
              _desired: "ceb",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "chr",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ckb",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "co",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "crs",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            sk: {
              _desired: "cs",
              _distance: "20"
            }
          },
          {
            en: {
              _desired: "cy",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ee",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "eo",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            es: {
              _desired: "eu",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            da: {
              _desired: "fo",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            nl: {
              _desired: "fy",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ga",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "gaa",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "gd",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            es: {
              _desired: "gl",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            es: {
              _desired: "gn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            hi: {
              _desired: "gu",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ha",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "haw",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "ht",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "hy",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ia",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ig",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "is",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            id: {
              _desired: "jv",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ka",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "kg",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "kk",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "km",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "kn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "kri",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            tr: {
              _desired: "ku",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "ky",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            it: {
              _desired: "la",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "lg",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "ln",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "lo",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "loz",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "lua",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            hi: {
              _desired: "mai",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "mfe",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "mg",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "mi",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ml",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "mn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            hi: {
              _desired: "mr",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            id: {
              _desired: "ms",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "mt",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "my",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ne",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            nb: {
              _desired: "nn",
              _distance: "20"
            }
          },
          {
            no: {
              _desired: "nn",
              _distance: "20"
            }
          },
          {
            en: {
              _desired: "nso",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ny",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "nyn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "oc",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "om",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "or",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "pa",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "pcm",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ps",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            es: {
              _desired: "qu",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            de: {
              _desired: "rm",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "rn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "rw",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            hi: {
              _desired: "sa",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "sd",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "si",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "sn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "so",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "sq",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "st",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            id: {
              _desired: "su",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "sw",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ta",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "te",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "tg",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ti",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "tk",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "tlh",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "tn",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "to",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "tt",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "tum",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "ug",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "uk",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "ur",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ru: {
              _desired: "uz",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            fr: {
              _desired: "wo",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "xh",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "yi",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "yo",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "za",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            en: {
              _desired: "zu",
              _distance: "30",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "aao",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "abh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "abv",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "acm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "acq",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "acw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "acx",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "acy",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "adf",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "aeb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "aec",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "afb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ajp",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "apc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "apd",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "arq",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ars",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ary",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "arz",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "auz",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "avl",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ayh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ayl",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ayn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ayp",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "bbz",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "pga",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "shu",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ar: {
              _desired: "ssh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            az: {
              _desired: "azb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            et: {
              _desired: "vro",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "ffm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fub",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fue",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fuf",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fuh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fui",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fuq",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ff: {
              _desired: "fuv",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            gn: {
              _desired: "gnw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            gn: {
              _desired: "gui",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            gn: {
              _desired: "gun",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            gn: {
              _desired: "nhd",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            iu: {
              _desired: "ikt",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "enb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "eyo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "niq",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "oki",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "pko",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "sgc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "tec",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kln: {
              _desired: "tuy",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kok: {
              _desired: "gom",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            kpe: {
              _desired: "gkp",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "ida",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lkb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lko",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lks",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lri",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lrm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lsm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lto",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lts",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "lwg",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "nle",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "nyd",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            luy: {
              _desired: "rag",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            lv: {
              _desired: "ltg",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "bhr",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "bjq",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "bmm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "bzc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "msh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "skg",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "tdx",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "tkg",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "txy",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "xmv",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mg: {
              _desired: "xmw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            mn: {
              _desired: "mvf",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "bjn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "btj",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "bve",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "bvu",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "coa",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "dup",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "hji",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "id",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "jak",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "jax",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "kvb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "kvr",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "kxd",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "lce",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "lcf",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "liw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "max",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "meo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "mfa",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "mfb",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "min",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "mqg",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "msi",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "mui",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "orn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "ors",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "pel",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "pse",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "tmw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "urk",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "vkk",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "vkt",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "xmm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "zlm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ms: {
              _desired: "zmi",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ne: {
              _desired: "dty",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            om: {
              _desired: "gax",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            om: {
              _desired: "hae",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            om: {
              _desired: "orc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            or: {
              _desired: "spv",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ps: {
              _desired: "pbt",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            ps: {
              _desired: "pst",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qub",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qud",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "quf",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qug",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "quh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "quk",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qul",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qup",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qur",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qus",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "quw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qux",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "quy",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qva",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qve",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvi",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvj",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvl",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvm",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvp",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvs",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qvz",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qwa",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qwc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qwh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qws",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxa",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxl",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxp",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxr",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxt",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxu",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            qu: {
              _desired: "qxw",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            sc: {
              _desired: "sdc",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            sc: {
              _desired: "sdn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            sc: {
              _desired: "sro",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            sq: {
              _desired: "aae",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            sq: {
              _desired: "aat",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            sq: {
              _desired: "aln",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            syr: {
              _desired: "aii",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            uz: {
              _desired: "uzs",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            yi: {
              _desired: "yih",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "cdo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "cjy",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "cpx",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "czh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "czo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "gan",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "hak",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "hsn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "lzh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "mnp",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "nan",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "wuu",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            zh: {
              _desired: "yue",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "*": {
              _desired: "*",
              _distance: "80"
            }
          },
          {
            "en-Latn": {
              _desired: "am-Ethi",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "ru-Cyrl": {
              _desired: "az-Latn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "bn-Beng",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "zh-Hans": {
              _desired: "bo-Tibt",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "ru-Cyrl": {
              _desired: "hy-Armn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ka-Geor",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "km-Khmr",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "kn-Knda",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "lo-Laoo",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ml-Mlym",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "my-Mymr",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ne-Deva",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "or-Orya",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "pa-Guru",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ps-Arab",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "sd-Arab",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "si-Sinh",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ta-Taml",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "te-Telu",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ti-Ethi",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "ru-Cyrl": {
              _desired: "tk-Latn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "ur-Arab",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "ru-Cyrl": {
              _desired: "uz-Latn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "en-Latn": {
              _desired: "yi-Hebr",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "sr-Cyrl": {
              _desired: "sr-Latn",
              _distance: "5"
            }
          },
          {
            "zh-Hans": {
              _desired: "za-Latn",
              _distance: "10",
              _oneway: "true"
            }
          },
          {
            "zh-Hans": {
              _desired: "zh-Hani",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "zh-Hant": {
              _desired: "zh-Hani",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "ar-Arab": {
              _desired: "ar-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "bn-Beng": {
              _desired: "bn-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "gu-Gujr": {
              _desired: "gu-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "hi-Deva": {
              _desired: "hi-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "kn-Knda": {
              _desired: "kn-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "ml-Mlym": {
              _desired: "ml-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "mr-Deva": {
              _desired: "mr-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "ta-Taml": {
              _desired: "ta-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "te-Telu": {
              _desired: "te-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "zh-Hans": {
              _desired: "zh-Latn",
              _distance: "20",
              _oneway: "true"
            }
          },
          {
            "ja-Jpan": {
              _desired: "ja-Latn",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ja-Jpan": {
              _desired: "ja-Hani",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ja-Jpan": {
              _desired: "ja-Hira",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ja-Jpan": {
              _desired: "ja-Kana",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ja-Jpan": {
              _desired: "ja-Hrkt",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ja-Hrkt": {
              _desired: "ja-Hira",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ja-Hrkt": {
              _desired: "ja-Kana",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ko-Kore": {
              _desired: "ko-Hani",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ko-Kore": {
              _desired: "ko-Hang",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ko-Kore": {
              _desired: "ko-Jamo",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "ko-Hang": {
              _desired: "ko-Jamo",
              _distance: "5",
              _oneway: "true"
            }
          },
          {
            "*-*": {
              _desired: "*-*",
              _distance: "50"
            }
          },
          {
            "ar-*-$maghreb": {
              _desired: "ar-*-$maghreb",
              _distance: "4"
            }
          },
          {
            "ar-*-$!maghreb": {
              _desired: "ar-*-$!maghreb",
              _distance: "4"
            }
          },
          {
            "ar-*-*": {
              _desired: "ar-*-*",
              _distance: "5"
            }
          },
          {
            "en-*-$enUS": {
              _desired: "en-*-$enUS",
              _distance: "4"
            }
          },
          {
            "en-*-GB": {
              _desired: "en-*-$!enUS",
              _distance: "3"
            }
          },
          {
            "en-*-$!enUS": {
              _desired: "en-*-$!enUS",
              _distance: "4"
            }
          },
          {
            "en-*-*": {
              _desired: "en-*-*",
              _distance: "5"
            }
          },
          {
            "es-*-$americas": {
              _desired: "es-*-$americas",
              _distance: "4"
            }
          },
          {
            "es-*-$!americas": {
              _desired: "es-*-$!americas",
              _distance: "4"
            }
          },
          {
            "es-*-*": {
              _desired: "es-*-*",
              _distance: "5"
            }
          },
          {
            "pt-*-$americas": {
              _desired: "pt-*-$americas",
              _distance: "4"
            }
          },
          {
            "pt-*-$!americas": {
              _desired: "pt-*-$!americas",
              _distance: "4"
            }
          },
          {
            "pt-*-*": {
              _desired: "pt-*-*",
              _distance: "5"
            }
          },
          {
            "zh-Hant-$cnsar": {
              _desired: "zh-Hant-$cnsar",
              _distance: "4"
            }
          },
          {
            "zh-Hant-$!cnsar": {
              _desired: "zh-Hant-$!cnsar",
              _distance: "4"
            }
          },
          {
            "zh-Hant-*": {
              _desired: "zh-Hant-*",
              _distance: "5"
            }
          },
          {
            "*-*-*": {
              _desired: "*-*-*",
              _distance: "4"
            }
          }
        ]
      }
    }
  };

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/regions.generated.js
  var regions = {
    "001": [
      "001",
      "001-status-grouping",
      "002",
      "005",
      "009",
      "011",
      "013",
      "014",
      "015",
      "017",
      "018",
      "019",
      "021",
      "029",
      "030",
      "034",
      "035",
      "039",
      "053",
      "054",
      "057",
      "061",
      "142",
      "143",
      "145",
      "150",
      "151",
      "154",
      "155",
      "AC",
      "AD",
      "AE",
      "AF",
      "AG",
      "AI",
      "AL",
      "AM",
      "AO",
      "AQ",
      "AR",
      "AS",
      "AT",
      "AU",
      "AW",
      "AX",
      "AZ",
      "BA",
      "BB",
      "BD",
      "BE",
      "BF",
      "BG",
      "BH",
      "BI",
      "BJ",
      "BL",
      "BM",
      "BN",
      "BO",
      "BQ",
      "BR",
      "BS",
      "BT",
      "BV",
      "BW",
      "BY",
      "BZ",
      "CA",
      "CC",
      "CD",
      "CF",
      "CG",
      "CH",
      "CI",
      "CK",
      "CL",
      "CM",
      "CN",
      "CO",
      "CP",
      "CQ",
      "CR",
      "CU",
      "CV",
      "CW",
      "CX",
      "CY",
      "CZ",
      "DE",
      "DG",
      "DJ",
      "DK",
      "DM",
      "DO",
      "DZ",
      "EA",
      "EC",
      "EE",
      "EG",
      "EH",
      "ER",
      "ES",
      "ET",
      "EU",
      "EZ",
      "FI",
      "FJ",
      "FK",
      "FM",
      "FO",
      "FR",
      "GA",
      "GB",
      "GD",
      "GE",
      "GF",
      "GG",
      "GH",
      "GI",
      "GL",
      "GM",
      "GN",
      "GP",
      "GQ",
      "GR",
      "GS",
      "GT",
      "GU",
      "GW",
      "GY",
      "HK",
      "HM",
      "HN",
      "HR",
      "HT",
      "HU",
      "IC",
      "ID",
      "IE",
      "IL",
      "IM",
      "IN",
      "IO",
      "IQ",
      "IR",
      "IS",
      "IT",
      "JE",
      "JM",
      "JO",
      "JP",
      "KE",
      "KG",
      "KH",
      "KI",
      "KM",
      "KN",
      "KP",
      "KR",
      "KW",
      "KY",
      "KZ",
      "LA",
      "LB",
      "LC",
      "LI",
      "LK",
      "LR",
      "LS",
      "LT",
      "LU",
      "LV",
      "LY",
      "MA",
      "MC",
      "MD",
      "ME",
      "MF",
      "MG",
      "MH",
      "MK",
      "ML",
      "MM",
      "MN",
      "MO",
      "MP",
      "MQ",
      "MR",
      "MS",
      "MT",
      "MU",
      "MV",
      "MW",
      "MX",
      "MY",
      "MZ",
      "NA",
      "NC",
      "NE",
      "NF",
      "NG",
      "NI",
      "NL",
      "NO",
      "NP",
      "NR",
      "NU",
      "NZ",
      "OM",
      "PA",
      "PE",
      "PF",
      "PG",
      "PH",
      "PK",
      "PL",
      "PM",
      "PN",
      "PR",
      "PS",
      "PT",
      "PW",
      "PY",
      "QA",
      "QO",
      "RE",
      "RO",
      "RS",
      "RU",
      "RW",
      "SA",
      "SB",
      "SC",
      "SD",
      "SE",
      "SG",
      "SH",
      "SI",
      "SJ",
      "SK",
      "SL",
      "SM",
      "SN",
      "SO",
      "SR",
      "SS",
      "ST",
      "SV",
      "SX",
      "SY",
      "SZ",
      "TA",
      "TC",
      "TD",
      "TF",
      "TG",
      "TH",
      "TJ",
      "TK",
      "TL",
      "TM",
      "TN",
      "TO",
      "TR",
      "TT",
      "TV",
      "TW",
      "TZ",
      "UA",
      "UG",
      "UM",
      "UN",
      "US",
      "UY",
      "UZ",
      "VA",
      "VC",
      "VE",
      "VG",
      "VI",
      "VN",
      "VU",
      "WF",
      "WS",
      "XK",
      "YE",
      "YT",
      "ZA",
      "ZM",
      "ZW"
    ],
    "002": [
      "002",
      "002-status-grouping",
      "011",
      "014",
      "015",
      "017",
      "018",
      "202",
      "AO",
      "BF",
      "BI",
      "BJ",
      "BW",
      "CD",
      "CF",
      "CG",
      "CI",
      "CM",
      "CV",
      "DJ",
      "DZ",
      "EA",
      "EG",
      "EH",
      "ER",
      "ET",
      "GA",
      "GH",
      "GM",
      "GN",
      "GQ",
      "GW",
      "IC",
      "IO",
      "KE",
      "KM",
      "LR",
      "LS",
      "LY",
      "MA",
      "MG",
      "ML",
      "MR",
      "MU",
      "MW",
      "MZ",
      "NA",
      "NE",
      "NG",
      "RE",
      "RW",
      "SC",
      "SD",
      "SH",
      "SL",
      "SN",
      "SO",
      "SS",
      "ST",
      "SZ",
      "TD",
      "TF",
      "TG",
      "TN",
      "TZ",
      "UG",
      "YT",
      "ZA",
      "ZM",
      "ZW"
    ],
    "003": [
      "003",
      "013",
      "021",
      "029",
      "AG",
      "AI",
      "AW",
      "BB",
      "BL",
      "BM",
      "BQ",
      "BS",
      "BZ",
      "CA",
      "CR",
      "CU",
      "CW",
      "DM",
      "DO",
      "GD",
      "GL",
      "GP",
      "GT",
      "HN",
      "HT",
      "JM",
      "KN",
      "KY",
      "LC",
      "MF",
      "MQ",
      "MS",
      "MX",
      "NI",
      "PA",
      "PM",
      "PR",
      "SV",
      "SX",
      "TC",
      "TT",
      "US",
      "VC",
      "VG",
      "VI"
    ],
    "005": [
      "005",
      "AR",
      "BO",
      "BR",
      "BV",
      "CL",
      "CO",
      "EC",
      "FK",
      "GF",
      "GS",
      "GY",
      "PE",
      "PY",
      "SR",
      "UY",
      "VE"
    ],
    "009": [
      "009",
      "053",
      "054",
      "057",
      "061",
      "AC",
      "AQ",
      "AS",
      "AU",
      "CC",
      "CK",
      "CP",
      "CX",
      "DG",
      "FJ",
      "FM",
      "GU",
      "HM",
      "KI",
      "MH",
      "MP",
      "NC",
      "NF",
      "NR",
      "NU",
      "NZ",
      "PF",
      "PG",
      "PN",
      "PW",
      "QO",
      "SB",
      "TA",
      "TK",
      "TO",
      "TV",
      "UM",
      "VU",
      "WF",
      "WS"
    ],
    "011": [
      "011",
      "BF",
      "BJ",
      "CI",
      "CV",
      "GH",
      "GM",
      "GN",
      "GW",
      "LR",
      "ML",
      "MR",
      "NE",
      "NG",
      "SH",
      "SL",
      "SN",
      "TG"
    ],
    "013": [
      "013",
      "BZ",
      "CR",
      "GT",
      "HN",
      "MX",
      "NI",
      "PA",
      "SV"
    ],
    "014": [
      "014",
      "BI",
      "DJ",
      "ER",
      "ET",
      "IO",
      "KE",
      "KM",
      "MG",
      "MU",
      "MW",
      "MZ",
      "RE",
      "RW",
      "SC",
      "SO",
      "SS",
      "TF",
      "TZ",
      "UG",
      "YT",
      "ZM",
      "ZW"
    ],
    "015": [
      "015",
      "DZ",
      "EA",
      "EG",
      "EH",
      "IC",
      "LY",
      "MA",
      "SD",
      "TN"
    ],
    "017": [
      "017",
      "AO",
      "CD",
      "CF",
      "CG",
      "CM",
      "GA",
      "GQ",
      "ST",
      "TD"
    ],
    "018": [
      "018",
      "BW",
      "LS",
      "NA",
      "SZ",
      "ZA"
    ],
    "019": [
      "003",
      "005",
      "013",
      "019",
      "019-status-grouping",
      "021",
      "029",
      "419",
      "AG",
      "AI",
      "AR",
      "AW",
      "BB",
      "BL",
      "BM",
      "BO",
      "BQ",
      "BR",
      "BS",
      "BV",
      "BZ",
      "CA",
      "CL",
      "CO",
      "CR",
      "CU",
      "CW",
      "DM",
      "DO",
      "EC",
      "FK",
      "GD",
      "GF",
      "GL",
      "GP",
      "GS",
      "GT",
      "GY",
      "HN",
      "HT",
      "JM",
      "KN",
      "KY",
      "LC",
      "MF",
      "MQ",
      "MS",
      "MX",
      "NI",
      "PA",
      "PE",
      "PM",
      "PR",
      "PY",
      "SR",
      "SV",
      "SX",
      "TC",
      "TT",
      "US",
      "UY",
      "VC",
      "VE",
      "VG",
      "VI"
    ],
    "021": [
      "021",
      "BM",
      "CA",
      "GL",
      "PM",
      "US"
    ],
    "029": [
      "029",
      "AG",
      "AI",
      "AW",
      "BB",
      "BL",
      "BQ",
      "BS",
      "CU",
      "CW",
      "DM",
      "DO",
      "GD",
      "GP",
      "HT",
      "JM",
      "KN",
      "KY",
      "LC",
      "MF",
      "MQ",
      "MS",
      "PR",
      "SX",
      "TC",
      "TT",
      "VC",
      "VG",
      "VI"
    ],
    "030": [
      "030",
      "CN",
      "HK",
      "JP",
      "KP",
      "KR",
      "MN",
      "MO",
      "TW"
    ],
    "034": [
      "034",
      "AF",
      "BD",
      "BT",
      "IN",
      "IR",
      "LK",
      "MV",
      "NP",
      "PK"
    ],
    "035": [
      "035",
      "BN",
      "ID",
      "KH",
      "LA",
      "MM",
      "MY",
      "PH",
      "SG",
      "TH",
      "TL",
      "VN"
    ],
    "039": [
      "039",
      "AD",
      "AL",
      "BA",
      "ES",
      "GI",
      "GR",
      "HR",
      "IT",
      "ME",
      "MK",
      "MT",
      "PT",
      "RS",
      "SI",
      "SM",
      "VA",
      "XK"
    ],
    "053": [
      "053",
      "AU",
      "CC",
      "CX",
      "HM",
      "NF",
      "NZ"
    ],
    "054": [
      "054",
      "FJ",
      "NC",
      "PG",
      "SB",
      "VU"
    ],
    "057": [
      "057",
      "FM",
      "GU",
      "KI",
      "MH",
      "MP",
      "NR",
      "PW",
      "UM"
    ],
    "061": [
      "061",
      "AS",
      "CK",
      "NU",
      "PF",
      "PN",
      "TK",
      "TO",
      "TV",
      "WF",
      "WS"
    ],
    "142": [
      "030",
      "034",
      "035",
      "142",
      "143",
      "145",
      "AE",
      "AF",
      "AM",
      "AZ",
      "BD",
      "BH",
      "BN",
      "BT",
      "CN",
      "CY",
      "GE",
      "HK",
      "ID",
      "IL",
      "IN",
      "IQ",
      "IR",
      "JO",
      "JP",
      "KG",
      "KH",
      "KP",
      "KR",
      "KW",
      "KZ",
      "LA",
      "LB",
      "LK",
      "MM",
      "MN",
      "MO",
      "MV",
      "MY",
      "NP",
      "OM",
      "PH",
      "PK",
      "PS",
      "QA",
      "SA",
      "SG",
      "SY",
      "TH",
      "TJ",
      "TL",
      "TM",
      "TR",
      "TW",
      "UZ",
      "VN",
      "YE"
    ],
    "143": [
      "143",
      "KG",
      "KZ",
      "TJ",
      "TM",
      "UZ"
    ],
    "145": [
      "145",
      "AE",
      "AM",
      "AZ",
      "BH",
      "CY",
      "GE",
      "IL",
      "IQ",
      "JO",
      "KW",
      "LB",
      "OM",
      "PS",
      "QA",
      "SA",
      "SY",
      "TR",
      "YE"
    ],
    "150": [
      "039",
      "150",
      "151",
      "154",
      "155",
      "AD",
      "AL",
      "AT",
      "AX",
      "BA",
      "BE",
      "BG",
      "BY",
      "CH",
      "CQ",
      "CZ",
      "DE",
      "DK",
      "EE",
      "ES",
      "FI",
      "FO",
      "FR",
      "GB",
      "GG",
      "GI",
      "GR",
      "HR",
      "HU",
      "IE",
      "IM",
      "IS",
      "IT",
      "JE",
      "LI",
      "LT",
      "LU",
      "LV",
      "MC",
      "MD",
      "ME",
      "MK",
      "MT",
      "NL",
      "NO",
      "PL",
      "PT",
      "RO",
      "RS",
      "RU",
      "SE",
      "SI",
      "SJ",
      "SK",
      "SM",
      "UA",
      "VA",
      "XK"
    ],
    "151": [
      "151",
      "BG",
      "BY",
      "CZ",
      "HU",
      "MD",
      "PL",
      "RO",
      "RU",
      "SK",
      "UA"
    ],
    "154": [
      "154",
      "AX",
      "CQ",
      "DK",
      "EE",
      "FI",
      "FO",
      "GB",
      "GG",
      "IE",
      "IM",
      "IS",
      "JE",
      "LT",
      "LV",
      "NO",
      "SE",
      "SJ"
    ],
    "155": [
      "155",
      "AT",
      "BE",
      "CH",
      "DE",
      "FR",
      "LI",
      "LU",
      "MC",
      "NL"
    ],
    "202": [
      "011",
      "014",
      "017",
      "018",
      "202",
      "AO",
      "BF",
      "BI",
      "BJ",
      "BW",
      "CD",
      "CF",
      "CG",
      "CI",
      "CM",
      "CV",
      "DJ",
      "ER",
      "ET",
      "GA",
      "GH",
      "GM",
      "GN",
      "GQ",
      "GW",
      "IO",
      "KE",
      "KM",
      "LR",
      "LS",
      "MG",
      "ML",
      "MR",
      "MU",
      "MW",
      "MZ",
      "NA",
      "NE",
      "NG",
      "RE",
      "RW",
      "SC",
      "SH",
      "SL",
      "SN",
      "SO",
      "SS",
      "ST",
      "SZ",
      "TD",
      "TF",
      "TG",
      "TZ",
      "UG",
      "YT",
      "ZA",
      "ZM",
      "ZW"
    ],
    "419": [
      "005",
      "013",
      "029",
      "419",
      "AG",
      "AI",
      "AR",
      "AW",
      "BB",
      "BL",
      "BO",
      "BQ",
      "BR",
      "BS",
      "BV",
      "BZ",
      "CL",
      "CO",
      "CR",
      "CU",
      "CW",
      "DM",
      "DO",
      "EC",
      "FK",
      "GD",
      "GF",
      "GP",
      "GS",
      "GT",
      "GY",
      "HN",
      "HT",
      "JM",
      "KN",
      "KY",
      "LC",
      "MF",
      "MQ",
      "MS",
      "MX",
      "NI",
      "PA",
      "PE",
      "PR",
      "PY",
      "SR",
      "SV",
      "SX",
      "TC",
      "TT",
      "UY",
      "VC",
      "VE",
      "VG",
      "VI"
    ],
    "EU": [
      "AT",
      "BE",
      "BG",
      "CY",
      "CZ",
      "DE",
      "DK",
      "EE",
      "ES",
      "EU",
      "FI",
      "FR",
      "GR",
      "HR",
      "HU",
      "IE",
      "IT",
      "LT",
      "LU",
      "LV",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SE",
      "SI",
      "SK"
    ],
    "EZ": [
      "AT",
      "BE",
      "CY",
      "DE",
      "EE",
      "ES",
      "EZ",
      "FI",
      "FR",
      "GR",
      "IE",
      "IT",
      "LT",
      "LU",
      "LV",
      "MT",
      "NL",
      "PT",
      "SI",
      "SK"
    ],
    "QO": [
      "AC",
      "AQ",
      "CP",
      "DG",
      "QO",
      "TA"
    ],
    "UN": [
      "AD",
      "AE",
      "AF",
      "AG",
      "AL",
      "AM",
      "AO",
      "AR",
      "AT",
      "AU",
      "AZ",
      "BA",
      "BB",
      "BD",
      "BE",
      "BF",
      "BG",
      "BH",
      "BI",
      "BJ",
      "BN",
      "BO",
      "BR",
      "BS",
      "BT",
      "BW",
      "BY",
      "BZ",
      "CA",
      "CD",
      "CF",
      "CG",
      "CH",
      "CI",
      "CL",
      "CM",
      "CN",
      "CO",
      "CR",
      "CU",
      "CV",
      "CY",
      "CZ",
      "DE",
      "DJ",
      "DK",
      "DM",
      "DO",
      "DZ",
      "EC",
      "EE",
      "EG",
      "ER",
      "ES",
      "ET",
      "FI",
      "FJ",
      "FM",
      "FR",
      "GA",
      "GB",
      "GD",
      "GE",
      "GH",
      "GM",
      "GN",
      "GQ",
      "GR",
      "GT",
      "GW",
      "GY",
      "HN",
      "HR",
      "HT",
      "HU",
      "ID",
      "IE",
      "IL",
      "IN",
      "IQ",
      "IR",
      "IS",
      "IT",
      "JM",
      "JO",
      "JP",
      "KE",
      "KG",
      "KH",
      "KI",
      "KM",
      "KN",
      "KP",
      "KR",
      "KW",
      "KZ",
      "LA",
      "LB",
      "LC",
      "LI",
      "LK",
      "LR",
      "LS",
      "LT",
      "LU",
      "LV",
      "LY",
      "MA",
      "MC",
      "MD",
      "ME",
      "MG",
      "MH",
      "MK",
      "ML",
      "MM",
      "MN",
      "MR",
      "MT",
      "MU",
      "MV",
      "MW",
      "MX",
      "MY",
      "MZ",
      "NA",
      "NE",
      "NG",
      "NI",
      "NL",
      "NO",
      "NP",
      "NR",
      "NZ",
      "OM",
      "PA",
      "PE",
      "PG",
      "PH",
      "PK",
      "PL",
      "PT",
      "PW",
      "PY",
      "QA",
      "RO",
      "RS",
      "RU",
      "RW",
      "SA",
      "SB",
      "SC",
      "SD",
      "SE",
      "SG",
      "SI",
      "SK",
      "SL",
      "SM",
      "SN",
      "SO",
      "SR",
      "SS",
      "ST",
      "SV",
      "SY",
      "SZ",
      "TD",
      "TG",
      "TH",
      "TJ",
      "TL",
      "TM",
      "TN",
      "TO",
      "TR",
      "TT",
      "TV",
      "TZ",
      "UA",
      "UG",
      "UN",
      "US",
      "UY",
      "UZ",
      "VC",
      "VE",
      "VN",
      "VU",
      "WS",
      "YE",
      "ZA",
      "ZM",
      "ZW"
    ]
  };

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js
  var UNICODE_EXTENSION_SEQUENCE_REGEX = /-u(?:-[0-9a-z]{2,8})+/gi;
  function invariant2(condition, message, Err) {
    if (Err === void 0) {
      Err = Error;
    }
    if (!condition) {
      throw new Err(message);
    }
  }
  var DEFAULT_MATCHING_THRESHOLD = 838;
  var PROCESSED_DATA;
  function processData() {
    var _a, _b;
    if (!PROCESSED_DATA) {
      var paradigmLocales = (_b = (_a = data.supplemental.languageMatching["written-new"][0]) === null || _a === void 0 ? void 0 : _a.paradigmLocales) === null || _b === void 0 ? void 0 : _b._locales.split(" ");
      var matchVariables = data.supplemental.languageMatching["written-new"].slice(1, 5);
      var data2 = data.supplemental.languageMatching["written-new"].slice(5);
      var matches = data2.map(function(d) {
        var key = Object.keys(d)[0];
        var value = d[key];
        return {
          supported: key,
          desired: value._desired,
          distance: +value._distance,
          oneway: value.oneway === "true" ? true : false
        };
      }, {});
      PROCESSED_DATA = {
        matches,
        matchVariables: matchVariables.reduce(function(all, d) {
          var key = Object.keys(d)[0];
          var value = d[key];
          all[key.slice(1)] = value._value.split("+");
          return all;
        }, {}),
        paradigmLocales: __spreadArray(__spreadArray([], paradigmLocales, true), paradigmLocales.map(function(l) {
          return new Intl.Locale(l.replace(/_/g, "-")).maximize().toString();
        }), true)
      };
    }
    return PROCESSED_DATA;
  }
  function isMatched(locale, languageMatchInfoLocale, matchVariables) {
    var _a = languageMatchInfoLocale.split("-"), language = _a[0], script = _a[1], region = _a[2];
    var matches = true;
    if (region && region[0] === "$") {
      var shouldInclude = region[1] !== "!";
      var matchRegions = shouldInclude ? matchVariables[region.slice(1)] : matchVariables[region.slice(2)];
      var expandedMatchedRegions = matchRegions.map(function(r) {
        return regions[r] || [r];
      }).reduce(function(all, list) {
        return __spreadArray(__spreadArray([], all, true), list, true);
      }, []);
      matches && (matches = !(expandedMatchedRegions.indexOf(locale.region || "") > 1 != shouldInclude));
    } else {
      matches && (matches = locale.region ? region === "*" || region === locale.region : true);
    }
    matches && (matches = locale.script ? script === "*" || script === locale.script : true);
    matches && (matches = locale.language ? language === "*" || language === locale.language : true);
    return matches;
  }
  function serializeLSR(lsr) {
    return [lsr.language, lsr.script, lsr.region].filter(Boolean).join("-");
  }
  function findMatchingDistanceForLSR(desired, supported, data2) {
    for (var _i = 0, _a = data2.matches; _i < _a.length; _i++) {
      var d = _a[_i];
      var matches = isMatched(desired, d.desired, data2.matchVariables) && isMatched(supported, d.supported, data2.matchVariables);
      if (!d.oneway && !matches) {
        matches = isMatched(desired, d.supported, data2.matchVariables) && isMatched(supported, d.desired, data2.matchVariables);
      }
      if (matches) {
        var distance = d.distance * 10;
        if (data2.paradigmLocales.indexOf(serializeLSR(desired)) > -1 != data2.paradigmLocales.indexOf(serializeLSR(supported)) > -1) {
          return distance - 1;
        }
        return distance;
      }
    }
    throw new Error("No matching distance found");
  }
  function findMatchingDistance(desired, supported) {
    var desiredLocale = new Intl.Locale(desired).maximize();
    var supportedLocale = new Intl.Locale(supported).maximize();
    var desiredLSR = {
      language: desiredLocale.language,
      script: desiredLocale.script || "",
      region: desiredLocale.region || ""
    };
    var supportedLSR = {
      language: supportedLocale.language,
      script: supportedLocale.script || "",
      region: supportedLocale.region || ""
    };
    var matchingDistance = 0;
    var data2 = processData();
    if (desiredLSR.language !== supportedLSR.language) {
      matchingDistance += findMatchingDistanceForLSR({
        language: desiredLocale.language,
        script: "",
        region: ""
      }, {
        language: supportedLocale.language,
        script: "",
        region: ""
      }, data2);
    }
    if (desiredLSR.script !== supportedLSR.script) {
      matchingDistance += findMatchingDistanceForLSR({
        language: desiredLocale.language,
        script: desiredLSR.script,
        region: ""
      }, {
        language: supportedLocale.language,
        script: desiredLSR.script,
        region: ""
      }, data2);
    }
    if (desiredLSR.region !== supportedLSR.region) {
      matchingDistance += findMatchingDistanceForLSR(desiredLSR, supportedLSR, data2);
    }
    return matchingDistance;
  }
  function findBestMatch(requestedLocales, supportedLocales2, threshold) {
    if (threshold === void 0) {
      threshold = DEFAULT_MATCHING_THRESHOLD;
    }
    var lowestDistance = Infinity;
    var result = {
      matchedDesiredLocale: "",
      distances: {}
    };
    requestedLocales.forEach(function(desired, i) {
      if (!result.distances[desired]) {
        result.distances[desired] = {};
      }
      supportedLocales2.forEach(function(supported) {
        var distance = findMatchingDistance(desired, supported) + 0 + i * 40;
        result.distances[desired][supported] = distance;
        if (distance < lowestDistance) {
          lowestDistance = distance;
          result.matchedDesiredLocale = desired;
          result.matchedSupportedLocale = supported;
        }
      });
    });
    if (lowestDistance >= threshold) {
      result.matchedDesiredLocale = void 0;
      result.matchedSupportedLocale = void 0;
    }
    return result;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/BestFitMatcher.js
  function BestFitMatcher(availableLocales, requestedLocales, getDefaultLocale) {
    var foundLocale;
    var extension;
    var noExtensionLocales = [];
    var noExtensionLocaleMap = requestedLocales.reduce(function(all, l) {
      var noExtensionLocale = l.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, "");
      noExtensionLocales.push(noExtensionLocale);
      all[noExtensionLocale] = l;
      return all;
    }, {});
    var result = findBestMatch(noExtensionLocales, availableLocales);
    if (result.matchedSupportedLocale && result.matchedDesiredLocale) {
      foundLocale = result.matchedSupportedLocale;
      extension = noExtensionLocaleMap[result.matchedDesiredLocale].slice(result.matchedDesiredLocale.length) || void 0;
    }
    if (!foundLocale) {
      return { locale: getDefaultLocale() };
    }
    return {
      locale: foundLocale,
      extension
    };
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/BestAvailableLocale.js
  function BestAvailableLocale(availableLocales, locale) {
    var candidate = locale;
    while (true) {
      if (availableLocales.indexOf(candidate) > -1) {
        return candidate;
      }
      var pos = candidate.lastIndexOf("-");
      if (!~pos) {
        return void 0;
      }
      if (pos >= 2 && candidate[pos - 2] === "-") {
        pos -= 2;
      }
      candidate = candidate.slice(0, pos);
    }
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/LookupMatcher.js
  function LookupMatcher(availableLocales, requestedLocales, getDefaultLocale) {
    var result = { locale: "" };
    for (var _i = 0, requestedLocales_1 = requestedLocales; _i < requestedLocales_1.length; _i++) {
      var locale = requestedLocales_1[_i];
      var noExtensionLocale = locale.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, "");
      var availableLocale = BestAvailableLocale(availableLocales, noExtensionLocale);
      if (availableLocale) {
        result.locale = availableLocale;
        if (locale !== noExtensionLocale) {
          result.extension = locale.slice(noExtensionLocale.length, locale.length);
        }
        return result;
      }
    }
    result.locale = getDefaultLocale();
    return result;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/UnicodeExtensionValue.js
  function UnicodeExtensionValue(extension, key) {
    invariant2(key.length === 2, "key must have 2 elements");
    var size = extension.length;
    var searchValue = "-".concat(key, "-");
    var pos = extension.indexOf(searchValue);
    if (pos !== -1) {
      var start = pos + 4;
      var end = start;
      var k = start;
      var done = false;
      while (!done) {
        var e = extension.indexOf("-", k);
        var len = void 0;
        if (e === -1) {
          len = size - k;
        } else {
          len = e - k;
        }
        if (len === 2) {
          done = true;
        } else if (e === -1) {
          end = size;
          done = true;
        } else {
          end = e;
          k = e + 1;
        }
      }
      return extension.slice(start, end);
    }
    searchValue = "-".concat(key);
    pos = extension.indexOf(searchValue);
    if (pos !== -1 && pos + 3 === size) {
      return "";
    }
    return void 0;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/ResolveLocale.js
  function ResolveLocale(availableLocales, requestedLocales, options, relevantExtensionKeys, localeData, getDefaultLocale) {
    var matcher = options.localeMatcher;
    var r;
    if (matcher === "lookup") {
      r = LookupMatcher(Array.from(availableLocales), requestedLocales, getDefaultLocale);
    } else {
      r = BestFitMatcher(Array.from(availableLocales), requestedLocales, getDefaultLocale);
    }
    var foundLocale = r.locale;
    var result = { locale: "", dataLocale: foundLocale };
    var supportedExtension = "-u";
    for (var _i = 0, relevantExtensionKeys_1 = relevantExtensionKeys; _i < relevantExtensionKeys_1.length; _i++) {
      var key = relevantExtensionKeys_1[_i];
      invariant2(foundLocale in localeData, "Missing locale data for ".concat(foundLocale));
      var foundLocaleData = localeData[foundLocale];
      invariant2(typeof foundLocaleData === "object" && foundLocaleData !== null, "locale data ".concat(key, " must be an object"));
      var keyLocaleData = foundLocaleData[key];
      invariant2(Array.isArray(keyLocaleData), "keyLocaleData for ".concat(key, " must be an array"));
      var value = keyLocaleData[0];
      invariant2(typeof value === "string" || value === null, "value must be string or null but got ".concat(typeof value, " in key ").concat(key));
      var supportedExtensionAddition = "";
      if (r.extension) {
        var requestedValue = UnicodeExtensionValue(r.extension, key);
        if (requestedValue !== void 0) {
          if (requestedValue !== "") {
            if (~keyLocaleData.indexOf(requestedValue)) {
              value = requestedValue;
              supportedExtensionAddition = "-".concat(key, "-").concat(value);
            }
          } else if (~requestedValue.indexOf("true")) {
            value = "true";
            supportedExtensionAddition = "-".concat(key);
          }
        }
      }
      if (key in options) {
        var optionsValue = options[key];
        invariant2(typeof optionsValue === "string" || typeof optionsValue === "undefined" || optionsValue === null, "optionsValue must be String, Undefined or Null");
        if (~keyLocaleData.indexOf(optionsValue)) {
          if (optionsValue !== value) {
            value = optionsValue;
            supportedExtensionAddition = "";
          }
        }
      }
      result[key] = value;
      supportedExtension += supportedExtensionAddition;
    }
    if (supportedExtension.length > 2) {
      var privateIndex = foundLocale.indexOf("-x-");
      if (privateIndex === -1) {
        foundLocale = foundLocale + supportedExtension;
      } else {
        var preExtension = foundLocale.slice(0, privateIndex);
        var postExtension = foundLocale.slice(privateIndex, foundLocale.length);
        foundLocale = preExtension + supportedExtension + postExtension;
      }
      foundLocale = Intl.getCanonicalLocales(foundLocale)[0];
    }
    result.locale = foundLocale;
    return result;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/abstract/LookupSupportedLocales.js
  function LookupSupportedLocales(availableLocales, requestedLocales) {
    var subset = [];
    for (var _i = 0, requestedLocales_1 = requestedLocales; _i < requestedLocales_1.length; _i++) {
      var locale = requestedLocales_1[_i];
      var noExtensionLocale = locale.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, "");
      var availableLocale = BestAvailableLocale(availableLocales, noExtensionLocale);
      if (availableLocale) {
        subset.push(availableLocale);
      }
    }
    return subset;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+intl-localematcher@0.0.0/node_modules/@formatjs/intl-localematcher/lib/index.js
  function match(requestedLocales, availableLocales, defaultLocale, opts) {
    return ResolveLocale(availableLocales, CanonicalizeLocaleList2(requestedLocales), {
      localeMatcher: (opts === null || opts === void 0 ? void 0 : opts.algorithm) || "best fit"
    }, [], {}, function() {
      return defaultLocale;
    }).locale;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/PartitionPattern.js
  function PartitionPattern(pattern) {
    var result = [];
    var beginIndex = pattern.indexOf("{");
    var endIndex = 0;
    var nextIndex = 0;
    var length = pattern.length;
    while (beginIndex < pattern.length && beginIndex > -1) {
      endIndex = pattern.indexOf("}", beginIndex);
      invariant(endIndex > beginIndex, "Invalid pattern ".concat(pattern));
      if (beginIndex > nextIndex) {
        result.push({
          type: "literal",
          value: pattern.substring(nextIndex, beginIndex)
        });
      }
      result.push({
        type: pattern.substring(beginIndex + 1, endIndex),
        value: void 0
      });
      nextIndex = endIndex + 1;
      beginIndex = pattern.indexOf("{", nextIndex);
    }
    if (nextIndex < length) {
      result.push({
        type: "literal",
        value: pattern.substring(nextIndex, length)
      });
    }
    return result;
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/SupportedLocales.js
  function SupportedLocales(availableLocales, requestedLocales, options) {
    var matcher = "best fit";
    if (options !== void 0) {
      options = ToObject(options);
      matcher = GetOption(options, "localeMatcher", "string", ["lookup", "best fit"], "best fit");
    }
    if (matcher === "best fit") {
      return LookupSupportedLocales(Array.from(availableLocales), requestedLocales);
    }
    return LookupSupportedLocales(Array.from(availableLocales), requestedLocales);
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/data.js
  var MissingLocaleDataError = (
    /** @class */
    function(_super) {
      __extends(MissingLocaleDataError2, _super);
      function MissingLocaleDataError2() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "MISSING_LOCALE_DATA";
        return _this;
      }
      return MissingLocaleDataError2;
    }(Error)
  );

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/node_modules/.aspect_rules_js/@formatjs+ecma402-abstract@0.0.0/node_modules/@formatjs/ecma402-abstract/lib/types/date-time.js
  var RangePatternType;
  (function(RangePatternType2) {
    RangePatternType2["startRange"] = "startRange";
    RangePatternType2["shared"] = "shared";
    RangePatternType2["endRange"] = "endRange";
  })(RangePatternType || (RangePatternType = {}));

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/packages/intl-listformat/lib/index.js
  function validateInstance(instance, method) {
    if (!(instance instanceof ListFormat)) {
      throw new TypeError("Method Intl.ListFormat.prototype.".concat(method, " called on incompatible receiver ").concat(String(instance)));
    }
  }
  function stringListFromIterable(list) {
    if (list === void 0) {
      return [];
    }
    var result = [];
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
      var el = list_1[_i];
      if (typeof el !== "string") {
        throw new TypeError("array list[".concat(list.indexOf(el), "] is not type String"));
      }
      result.push(el);
    }
    return result;
  }
  function createPartsFromList(internalSlotMap, lf, list) {
    var size = list.length;
    if (size === 0) {
      return [];
    }
    if (size === 2) {
      var pattern = getInternalSlot(internalSlotMap, lf, "templatePair");
      var first = { type: "element", value: list[0] };
      var second = { type: "element", value: list[1] };
      return deconstructPattern(pattern, { "0": first, "1": second });
    }
    var last = {
      type: "element",
      value: list[size - 1]
    };
    var parts = last;
    var i = size - 2;
    while (i >= 0) {
      var pattern = void 0;
      if (i === 0) {
        pattern = getInternalSlot(internalSlotMap, lf, "templateStart");
      } else if (i < size - 2) {
        pattern = getInternalSlot(internalSlotMap, lf, "templateMiddle");
      } else {
        pattern = getInternalSlot(internalSlotMap, lf, "templateEnd");
      }
      var head = { type: "element", value: list[i] };
      parts = deconstructPattern(pattern, { "0": head, "1": parts });
      i--;
    }
    return parts;
  }
  function deconstructPattern(pattern, placeables) {
    var patternParts = PartitionPattern(pattern);
    var result = [];
    for (var _i = 0, patternParts_1 = patternParts; _i < patternParts_1.length; _i++) {
      var patternPart = patternParts_1[_i];
      var part = patternPart.type;
      if (isLiteralPart(patternPart)) {
        result.push({
          type: "literal",
          value: patternPart.value
        });
      } else {
        invariant(part in placeables, "".concat(part, " is missing from placables"));
        var subst = placeables[part];
        if (Array.isArray(subst)) {
          result.push.apply(result, subst);
        } else {
          result.push(subst);
        }
      }
    }
    return result;
  }
  var ListFormat = (
    /** @class */
    function() {
      function ListFormat2(locales, options) {
        var newTarget = this && this instanceof ListFormat2 ? this.constructor : void 0;
        if (!newTarget) {
          throw new TypeError("Intl.ListFormat must be called with 'new'");
        }
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "initializedListFormat", true);
        var requestedLocales = CanonicalizeLocaleList(locales);
        var opt = /* @__PURE__ */ Object.create(null);
        var opts = GetOptionsObject(options);
        var matcher = GetOption(opts, "localeMatcher", "string", ["best fit", "lookup"], "best fit");
        opt.localeMatcher = matcher;
        var localeData = ListFormat2.localeData;
        var r = ResolveLocale(ListFormat2.availableLocales, requestedLocales, opt, ListFormat2.relevantExtensionKeys, localeData, ListFormat2.getDefaultLocale);
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "locale", r.locale);
        var type = GetOption(opts, "type", "string", ["conjunction", "disjunction", "unit"], "conjunction");
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "type", type);
        var style = GetOption(opts, "style", "string", ["long", "short", "narrow"], "long");
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "style", style);
        var dataLocale = r.dataLocale;
        var dataLocaleData = localeData[dataLocale];
        invariant(!!dataLocaleData, "Missing locale data for ".concat(dataLocale));
        var dataLocaleTypes = dataLocaleData[type];
        var templates = dataLocaleTypes[style];
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "templatePair", templates.pair);
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "templateStart", templates.start);
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "templateMiddle", templates.middle);
        setInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "templateEnd", templates.end);
      }
      ListFormat2.prototype.format = function(elements) {
        validateInstance(this, "format");
        var result = "";
        var parts = createPartsFromList(ListFormat2.__INTERNAL_SLOT_MAP__, this, stringListFromIterable(elements));
        if (!Array.isArray(parts)) {
          return parts.value;
        }
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
          var p = parts_1[_i];
          result += p.value;
        }
        return result;
      };
      ListFormat2.prototype.formatToParts = function(elements) {
        validateInstance(this, "format");
        var parts = createPartsFromList(ListFormat2.__INTERNAL_SLOT_MAP__, this, stringListFromIterable(elements));
        if (!Array.isArray(parts)) {
          return [parts];
        }
        var result = [];
        for (var _i = 0, parts_2 = parts; _i < parts_2.length; _i++) {
          var part = parts_2[_i];
          result.push(__assign({}, part));
        }
        return result;
      };
      ListFormat2.prototype.resolvedOptions = function() {
        validateInstance(this, "resolvedOptions");
        return {
          locale: getInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "locale"),
          type: getInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "type"),
          style: getInternalSlot(ListFormat2.__INTERNAL_SLOT_MAP__, this, "style")
        };
      };
      ListFormat2.supportedLocalesOf = function(locales, options) {
        return SupportedLocales(ListFormat2.availableLocales, CanonicalizeLocaleList(locales), options);
      };
      ListFormat2.__addLocaleData = function() {
        var data2 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          data2[_i] = arguments[_i];
        }
        for (var _a = 0, data_1 = data2; _a < data_1.length; _a++) {
          var _b = data_1[_a], d = _b.data, locale = _b.locale;
          var minimizedLocale = new Intl.Locale(locale).minimize().toString();
          ListFormat2.localeData[locale] = ListFormat2.localeData[minimizedLocale] = d;
          ListFormat2.availableLocales.add(minimizedLocale);
          ListFormat2.availableLocales.add(locale);
          if (!ListFormat2.__defaultLocale) {
            ListFormat2.__defaultLocale = minimizedLocale;
          }
        }
      };
      ListFormat2.getDefaultLocale = function() {
        return ListFormat2.__defaultLocale;
      };
      ListFormat2.localeData = {};
      ListFormat2.availableLocales = /* @__PURE__ */ new Set();
      ListFormat2.__defaultLocale = "";
      ListFormat2.relevantExtensionKeys = [];
      ListFormat2.polyfilled = true;
      ListFormat2.__INTERNAL_SLOT_MAP__ = /* @__PURE__ */ new WeakMap();
      return ListFormat2;
    }()
  );
  var lib_default = ListFormat;
  try {
    if (typeof Symbol !== "undefined") {
      Object.defineProperty(ListFormat.prototype, Symbol.toStringTag, {
        value: "Intl.ListFormat",
        writable: false,
        enumerable: false,
        configurable: true
      });
    }
    Object.defineProperty(ListFormat.prototype.constructor, "length", {
      value: 0,
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(ListFormat.supportedLocalesOf, "length", {
      value: 1,
      writable: false,
      enumerable: false,
      configurable: true
    });
  } catch (e) {
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/packages/intl-listformat/lib/supported-locales.generated.js
  var supportedLocales = ["af", "af-NA", "agq", "ak", "am", "ar", "ar-AE", "ar-BH", "ar-DJ", "ar-DZ", "ar-EG", "ar-EH", "ar-ER", "ar-IL", "ar-IQ", "ar-JO", "ar-KM", "ar-KW", "ar-LB", "ar-LY", "ar-MA", "ar-MR", "ar-OM", "ar-PS", "ar-QA", "ar-SA", "ar-SD", "ar-SO", "ar-SS", "ar-SY", "ar-TD", "ar-TN", "ar-YE", "as", "asa", "ast", "az", "az-Cyrl", "az-Latn", "bas", "be", "be-tarask", "bem", "bez", "bg", "bm", "bn", "bn-IN", "bo", "bo-IN", "br", "brx", "bs", "bs-Cyrl", "bs-Latn", "ca", "ca-AD", "ca-ES-valencia", "ca-FR", "ca-IT", "ccp", "ccp-IN", "ce", "ceb", "cgg", "chr", "ckb", "ckb-IR", "cs", "cy", "da", "da-GL", "dav", "de", "de-AT", "de-BE", "de-CH", "de-IT", "de-LI", "de-LU", "dje", "doi", "dsb", "dua", "dyo", "dz", "ebu", "ee", "ee-TG", "el", "el-CY", "en", "en-001", "en-150", "en-AE", "en-AG", "en-AI", "en-AS", "en-AT", "en-AU", "en-BB", "en-BE", "en-BI", "en-BM", "en-BS", "en-BW", "en-BZ", "en-CA", "en-CC", "en-CH", "en-CK", "en-CM", "en-CX", "en-CY", "en-DE", "en-DG", "en-DK", "en-DM", "en-ER", "en-FI", "en-FJ", "en-FK", "en-FM", "en-GB", "en-GD", "en-GG", "en-GH", "en-GI", "en-GM", "en-GU", "en-GY", "en-HK", "en-IE", "en-IL", "en-IM", "en-IN", "en-IO", "en-JE", "en-JM", "en-KE", "en-KI", "en-KN", "en-KY", "en-LC", "en-LR", "en-LS", "en-MG", "en-MH", "en-MO", "en-MP", "en-MS", "en-MT", "en-MU", "en-MW", "en-MY", "en-NA", "en-NF", "en-NG", "en-NL", "en-NR", "en-NU", "en-NZ", "en-PG", "en-PH", "en-PK", "en-PN", "en-PR", "en-PW", "en-RW", "en-SB", "en-SC", "en-SD", "en-SE", "en-SG", "en-SH", "en-SI", "en-SL", "en-SS", "en-SX", "en-SZ", "en-TC", "en-TK", "en-TO", "en-TT", "en-TV", "en-TZ", "en-UG", "en-UM", "en-VC", "en-VG", "en-VI", "en-VU", "en-WS", "en-ZA", "en-ZM", "en-ZW", "eo", "es", "es-419", "es-AR", "es-BO", "es-BR", "es-BZ", "es-CL", "es-CO", "es-CR", "es-CU", "es-DO", "es-EA", "es-EC", "es-GQ", "es-GT", "es-HN", "es-IC", "es-MX", "es-NI", "es-PA", "es-PE", "es-PH", "es-PR", "es-PY", "es-SV", "es-US", "es-UY", "es-VE", "et", "eu", "ewo", "fa", "fa-AF", "ff", "ff-Adlm", "ff-Adlm-BF", "ff-Adlm-CM", "ff-Adlm-GH", "ff-Adlm-GM", "ff-Adlm-GW", "ff-Adlm-LR", "ff-Adlm-MR", "ff-Adlm-NE", "ff-Adlm-NG", "ff-Adlm-SL", "ff-Adlm-SN", "ff-Latn", "ff-Latn-BF", "ff-Latn-CM", "ff-Latn-GH", "ff-Latn-GM", "ff-Latn-GN", "ff-Latn-GW", "ff-Latn-LR", "ff-Latn-MR", "ff-Latn-NE", "ff-Latn-NG", "ff-Latn-SL", "fi", "fil", "fo", "fo-DK", "fr", "fr-BE", "fr-BF", "fr-BI", "fr-BJ", "fr-BL", "fr-CA", "fr-CD", "fr-CF", "fr-CG", "fr-CH", "fr-CI", "fr-CM", "fr-DJ", "fr-DZ", "fr-GA", "fr-GF", "fr-GN", "fr-GP", "fr-GQ", "fr-HT", "fr-KM", "fr-LU", "fr-MA", "fr-MC", "fr-MF", "fr-MG", "fr-ML", "fr-MQ", "fr-MR", "fr-MU", "fr-NC", "fr-NE", "fr-PF", "fr-PM", "fr-RE", "fr-RW", "fr-SC", "fr-SN", "fr-SY", "fr-TD", "fr-TG", "fr-TN", "fr-VU", "fr-WF", "fr-YT", "fur", "fy", "ga", "ga-GB", "gd", "gl", "gsw", "gsw-FR", "gsw-LI", "gu", "guz", "gv", "ha", "ha-GH", "ha-NE", "haw", "he", "hi", "hr", "hr-BA", "hsb", "hu", "hy", "ia", "id", "ig", "ii", "is", "it", "it-CH", "it-SM", "it-VA", "ja", "jgo", "jmc", "jv", "ka", "kab", "kam", "kde", "kea", "kgp", "khq", "ki", "kk", "kkj", "kl", "kln", "km", "kn", "ko", "ko-KP", "kok", "ks", "ks-Arab", "ksb", "ksf", "ksh", "ku", "kw", "ky", "lag", "lb", "lg", "lkt", "ln", "ln-AO", "ln-CF", "ln-CG", "lo", "lrc", "lrc-IQ", "lt", "lu", "luo", "luy", "lv", "mai", "mas", "mas-TZ", "mer", "mfe", "mg", "mgh", "mgo", "mi", "mk", "ml", "mn", "mni", "mni-Beng", "mr", "ms", "ms-BN", "ms-ID", "ms-SG", "mt", "mua", "my", "mzn", "naq", "nb", "nb-SJ", "nd", "nds", "nds-NL", "ne", "ne-IN", "nl", "nl-AW", "nl-BE", "nl-BQ", "nl-CW", "nl-SR", "nl-SX", "nmg", "nn", "nnh", "no", "nus", "nyn", "om", "om-KE", "or", "os", "os-RU", "pa", "pa-Arab", "pa-Guru", "pcm", "pl", "ps", "ps-PK", "pt", "pt-AO", "pt-CH", "pt-CV", "pt-GQ", "pt-GW", "pt-LU", "pt-MO", "pt-MZ", "pt-PT", "pt-ST", "pt-TL", "qu", "qu-BO", "qu-EC", "rm", "rn", "ro", "ro-MD", "rof", "ru", "ru-BY", "ru-KG", "ru-KZ", "ru-MD", "ru-UA", "rw", "rwk", "sa", "sah", "saq", "sat", "sat-Olck", "sbp", "sc", "sd", "sd-Arab", "sd-Deva", "se", "se-FI", "se-SE", "seh", "ses", "sg", "shi", "shi-Latn", "shi-Tfng", "si", "sk", "sl", "smn", "sn", "so", "so-DJ", "so-ET", "so-KE", "sq", "sq-MK", "sq-XK", "sr", "sr-Cyrl", "sr-Cyrl-BA", "sr-Cyrl-ME", "sr-Cyrl-XK", "sr-Latn", "sr-Latn-BA", "sr-Latn-ME", "sr-Latn-XK", "su", "su-Latn", "sv", "sv-AX", "sv-FI", "sw", "sw-CD", "sw-KE", "sw-UG", "ta", "ta-LK", "ta-MY", "ta-SG", "te", "teo", "teo-KE", "tg", "th", "ti", "ti-ER", "tk", "to", "tr", "tr-CY", "tt", "twq", "tzm", "ug", "uk", "und", "ur", "ur-IN", "uz", "uz-Arab", "uz-Cyrl", "uz-Latn", "vai", "vai-Latn", "vai-Vaii", "vi", "vun", "wae", "wo", "xh", "xog", "yav", "yi", "yo", "yo-BJ", "yrl", "yrl-CO", "yrl-VE", "yue", "yue-Hans", "yue-Hant", "zgh", "zh", "zh-Hans", "zh-Hans-HK", "zh-Hans-MO", "zh-Hans-SG", "zh-Hant", "zh-Hant-HK", "zh-Hant-MO", "zu"];

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/packages/intl-listformat/lib/should-polyfill.js
  function supportedLocalesOf(locale) {
    if (!locale) {
      return true;
    }
    var locales = Array.isArray(locale) ? locale : [locale];
    return Intl.ListFormat.supportedLocalesOf(locales).length === locales.length;
  }
  function shouldPolyfill(locale) {
    if (locale === void 0) {
      locale = "en";
    }
    if (!("ListFormat" in Intl) || !supportedLocalesOf(locale)) {
      return locale ? match([locale], supportedLocales, "en") : void 0;
    }
  }

  // ../../../../../../../../execroot/formatjs/bazel-out/darwin_arm64-fastbuild/bin/packages/intl-listformat/lib/polyfill.js
  if (shouldPolyfill()) {
    Object.defineProperty(Intl, "ListFormat", {
      value: lib_default,
      writable: true,
      enumerable: false,
      configurable: true
    });
  }
})();
//# sourceMappingURL=polyfill.iife.js.map
