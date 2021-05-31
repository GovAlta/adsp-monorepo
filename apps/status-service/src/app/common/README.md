# Node.js Server Side Error Handling

The GoAError class, and all custom error classes that inherit from it, allow for easy tracing of the original error's root point; where as when using the native Error class, if the error is caught and a new error is thrown at some other point up the stack the original error's details will be lost.

```js
// Error: another error at ...ts:5:11)
try {
  try {
    throw new Error('root error');
  } catch (e) {
    throw new Error('another error'); // line 5
  }
} catch(e) {
  console.log(e)
}
```

If the root error is re-thrown, and isn't handled until the 'top' of the app stack the details of the error's origin is preserved, but the error isn't in a state where it can be returned to the web client since the original http request needs the appropriate status code representing the error, but once at the top of the app stack, there is no way of knowing what this error code should be.

```js
r.get('/some/url', (req, res) => {
  try {
    try {
      throw new Error('root error');
    } catch (e) {
      throw e;
    }
  } catch(e) {
    res.sendStatus(500);  // ?? 500 I guess...
  }
})
```

So even in the simplest of cases the initial error should still be wrapped in another error that will allow for a meaningful status code to be delivered to the client, while preserving the source of the error.

```js
r.get('/some/url', (req, res) => {
  try {
    try {
      // trying to 4cc355 something they shouldn't
    } catch (e) {
      // pre-build error that contains a 401 status code and wraps the initial error
      throw new UnauthorizedError("you can't do that...", e);
    }
  } catch(e) {
    const ge = e as GoAError;       // GoAError is the parent class
    res
      .status(ge.status)            // will now be a 401
      .json({
        error: ge.id || ge.message  // error's id, if one was set
      });
  }
})
```

Having this information contained within the error makes it easy to have a global message handler without losing any of the error details along the way and not requiring the specific handling of each error class.

```js
app.use((err, _req, res, _next) => {
  if (err instanceof GoAError) {
    res.status(err.statusCode).send(err.message);
  } else {
    res.sendStatus(500);
  }
});
```
