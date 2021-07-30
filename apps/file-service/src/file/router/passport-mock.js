/**
 * Author: Michael Weibel <michael.weibel@gmail.com>
 * License: MIT
 */
import * as passport from 'passport';
import StrategyMock from './strategy-mock';

export default function passportMock(app, options) {
  // create your verify function on your own -- should do similar things as
  // the "real" one.
  passport.use(new StrategyMock(options, verifyFunction));

  app.get('/fileTypes/type-1', passport.authenticate('mock', { successRedirect: '/', failureRedirect: '/login' }));
}

function verifyFunction(user, done) {
  // user = { id: 1};
  // Emulate database fetch result
  var mock = {
    id: 1,
    role: 'default',
    first_name: 'John',
    last_name: 'Doe',
  };
  done(null, mock);
}
