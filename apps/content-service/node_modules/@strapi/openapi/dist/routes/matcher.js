'use strict';

/**
 * Class responsible for matching routes based on provided rules.
 */ class RouteMatcher {
    /**
   * Checks if a given route matches all provided rules.
   *
   * Exits early if any rule fails.
   *
   * @param route - The route to check.
   * @returns `true` if the route satisfies all rules, otherwise `false`.
   */ match(route) {
        return this._rules.every((rule)=>rule(route));
    }
    /**
   * @param rules - A list of matcher rules to apply. Defaults to an empty array.
   */ constructor(rules = []){
        this._rules = rules;
    }
}

exports.RouteMatcher = RouteMatcher;
//# sourceMappingURL=matcher.js.map
