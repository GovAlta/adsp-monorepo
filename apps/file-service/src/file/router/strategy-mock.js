/**
 * Author: Michael Weibel <michael.weibel@gmail.com>
 * License: MIT
 */
'use strict';

import passport from 'passport';
import util from 'util';

export default function StrategyMock(options, verify) {
  this.name = 'mock';
  this.passAuthentication = options.passAuthentication || true;
  this.userId = options.userId || 1;
  this.verify = verify;
}

util.inherits(StrategyMock, passport.Strategy);

StrategyMock.prototype.authenticate = function authenticate(req) {
  if (this.passAuthentication) {
    var user = {
        id: this.userId,
      },
      self = this;
    this.verify(user, function (err, resident) {
      if (err) {
        self.fail(err);
      } else {
        self.success(resident);
      }
    });
  } else {
    this.fail('Unauthorized');
  }
};
