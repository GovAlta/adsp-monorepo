'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var init = require('../services/init.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

/**
 * @internal
 * @description Given a model UID, return the schema and the schemas
 * of the associated components within said model's schema. A wrapper
 * implementation around the `useGetInitialDataQuery` with a unique
 * `selectFromResult` function to memoize the calculation.
 *
 * If no model is provided, the hook will return all the schemas.
 */ const useContentTypeSchema = (model)=>{
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { data, error, isLoading, isFetching } = init.useGetInitialDataQuery(undefined);
    const { components, contentType, contentTypes } = React__namespace.useMemo(()=>{
        const contentType = data?.contentTypes.find((ct)=>ct.uid === model);
        const componentsByKey = data?.components.reduce((acc, component)=>{
            acc[component.uid] = component;
            return acc;
        }, {});
        const components = extractContentTypeComponents(contentType?.attributes, componentsByKey);
        return {
            components: Object.keys(components).length === 0 ? undefined : components,
            contentType,
            contentTypes: data?.contentTypes ?? []
        };
    }, [
        model,
        data
    ]);
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        toggleNotification,
        error,
        formatAPIError
    ]);
    return {
        // This must be memoized to avoid inifiinite re-renders where the empty object is different everytime.
        components: React__namespace.useMemo(()=>components ?? {}, [
            components
        ]),
        schema: contentType,
        schemas: contentTypes,
        isLoading: isLoading || isFetching
    };
};
/* -------------------------------------------------------------------------------------------------
 * extractContentTypeComponents
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal
 * @description Extracts the components used in a content type's attributes recursively.
 */ const extractContentTypeComponents = (attributes = {}, allComponents = {})=>{
    const getComponents = (attributes)=>{
        return attributes.reduce((acc, attribute)=>{
            /**
       * If the attribute is a component or dynamiczone, we need to recursively
       * extract the component UIDs from its attributes.
       */ if (attribute.type === 'component') {
                const componentAttributes = Object.values(allComponents[attribute.component]?.attributes ?? {});
                acc.push(attribute.component, ...getComponents(componentAttributes));
            } else if (attribute.type === 'dynamiczone') {
                acc.push(...attribute.components, /**
           * Dynamic zones have an array of components, so we flatMap over them
           * performing the same search as above.
           */ ...attribute.components.flatMap((componentUid)=>{
                    const componentAttributes = Object.values(allComponents[componentUid]?.attributes ?? {});
                    return getComponents(componentAttributes);
                }));
            }
            return acc;
        }, []);
    };
    const componentUids = getComponents(Object.values(attributes));
    const uniqueComponentUids = [
        ...new Set(componentUids)
    ];
    const componentsByKey = uniqueComponentUids.reduce((acc, uid)=>{
        acc[uid] = allComponents[uid];
        return acc;
    }, {});
    return componentsByKey;
};

exports.extractContentTypeComponents = extractContentTypeComponents;
exports.useContentTypeSchema = useContentTypeSchema;
//# sourceMappingURL=useContentTypeSchema.js.map
