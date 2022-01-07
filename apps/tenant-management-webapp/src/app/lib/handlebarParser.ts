import * as handlebars from 'handlebars/dist/cjs/handlebars';

import * as _ from 'lodash';

const extract = (template, callback) => {
  const emit = (segs, optional) => {
    return callback(_.flatten(segs), optional);
  };

  const helperDetails = _.merge(
    {},
    {
      each: {
        contextParam: 0,
        transmogrify: (path) => {
          const clone = path.slice(0);
          clone.push('#');
          return clone;
        },
      },
      with: {
        contextParam: 0,
      },
      if: {
        optional: true,
      },
    }
  );

  const parsed = handlebars.parse(template);

  const extend = (path, subpath) => {
    let clone;
    if (subpath.original != null && subpath.original.startsWith('@root')) {
      clone = _.clone(subpath.parts);
      return [clone.slice(1)];
    } else if (subpath.original != null && (subpath.original.startsWith('../') || subpath.original.startsWith('@'))) {
      clone = path.endWith('#') ? path.slice(0, -2) : path.slice(0, -1);
      clone.push(subpath.parts);
      return clone;
    } else {
      clone = _.clone(path);
      clone.push(subpath.parts);
      return clone;
    }
  };

  const visit = (emit, path, node, optional?) => {
    let helper, newPath, replace, _ref;
    if (optional == null) {
      optional = false;
    }
    switch (node.type) {
      case 'Program':
        node.body.forEach((child) => {
          return visit(emit, path, child, optional);
        });
        break;
      case 'BlockStatement':
        newPath = path;
        helper = helperDetails[node.path.original];
        node.params.forEach((child) => {
          return visit(emit, path, child, optional || (helper != null ? helper.optional : void 0));
        });
        if ((helper != null ? helper.contextParam : void 0) != null) {
          replace = (path) => {
            return (newPath = path);
          };
          visit(replace, path, node.params[helper.contextParam]);
          if ((helper != null ? helper.transmogrify : void 0) != null) {
            newPath = (_ref = helperDetails[node.path.original]) != null ? _ref.transmogrify(newPath) : void 0;
          }
        }
        visit(emit, newPath, node.program, optional || (helper != null ? helper.optional : void 0));
        break;
      case 'PathExpression':
        emit(extend(path, node), optional);
        break;
      case 'MustacheStatement':
        helper = helperDetails[node.path.original];
        if (_.isEmpty(node.params)) {
          visit(emit, path, node.path, optional);
        } else {
          node.params.forEach((child) => {
            return visit(emit, path, child, optional || (helper != null ? helper.optional : void 0));
          });
        }
    }
  };
  return visit(emit, [], parsed);
};

export const extractSchema: any = (template: string) => {
  const obj = {};
  const callback = (path, optional) => {
    const augment = (obj, path) => {
      let segment;
      obj._optional = _.has(obj, '_optional') ? optional && obj._optional : optional;
      if (!(_.isEmpty(path) || (path.length === 1 && path[0] === 'length'))) {
        obj._type = 'object';
        segment = _.head(path);
        if (segment === '#') {
          obj._type = 'array';
        }
        obj[segment] = obj[segment] || {};
        return augment(obj[segment], _.tail(path));
      } else {
        obj._type = 'any';
        return obj;
      }
    };
    return augment(obj, path);
  };

  extract(template, callback);
  return obj;
};
