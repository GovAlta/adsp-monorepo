'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var collections = require('../constants/collections.js');
var data = require('../pages/EditView/utils/data.js');
var forms = require('../pages/EditView/utils/forms.js');
var documents = require('../services/documents.js');
var api = require('../utils/api.js');
var validation = require('../utils/validation.js');
var useContentTypeSchema = require('./useContentTypeSchema.js');
var useDocumentLayout = require('./useDocumentLayout.js');

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

/* -------------------------------------------------------------------------------------------------
 * useDocument
 * -----------------------------------------------------------------------------------------------*/ /**
 * @alpha
 * @public
 * @description Returns a document based on the model, collection type & id passed as arguments.
 * Also extracts its schema from the redux cache to be used for creating a validation schema.
 * @example
 * ```tsx
 * const { id, model, collectionType } = useParams<{ id: string; model: string; collectionType: string }>();
 *
 * if(!model || !collectionType) return null;
 *
 * const { document, isLoading, validate } = useDocument({ documentId: id, model, collectionType, params: { locale: 'en-GB' } })
 * const { update } = useDocumentActions()
 *
 * const onSubmit = async (document: Document) => {
 *  const errors = validate(document);
 *
 *  if(errors) {
 *      // handle errors
 *  }
 *
 *  await update({ collectionType, model, id }, document)
 * }
 * ```
 *
 * @see {@link https://contributor.strapi.io/docs/core/content-manager/hooks/use-document} for more information
 */ const useDocument = (args, opts)=>{
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { formatMessage } = reactIntl.useIntl();
    const { currentData: data$1, isLoading: isLoadingDocument, isFetching: isFetchingDocument, error, refetch } = documents.useGetDocumentQuery(args, {
        ...opts,
        skip: !args.documentId && args.collectionType !== collections.SINGLE_TYPES || opts?.skip
    });
    const document = data$1?.data;
    const meta = data$1?.meta;
    const { components, schema, schemas, isLoading: isLoadingSchema } = useContentTypeSchema.useContentTypeSchema(args.model);
    const isSingleType = schema?.kind === 'singleType';
    const getTitle = (mainField)=>{
        // Always use mainField if it's not an id
        if (mainField !== 'id' && document?.[mainField]) {
            return document[mainField];
        }
        // When it's a singleType without a mainField, use the contentType displayName
        if (isSingleType && schema?.info.displayName) {
            return schema.info.displayName;
        }
        // Otherwise, use a fallback
        return formatMessage({
            id: 'content-manager.containers.untitled',
            defaultMessage: 'Untitled'
        });
    };
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
        formatAPIError,
        args.collectionType
    ]);
    const validationSchema = React__namespace.useMemo(()=>{
        if (!schema) {
            return null;
        }
        return validation.createYupSchema(schema.attributes, components);
    }, [
        schema,
        components
    ]);
    const validate = React__namespace.useCallback((document)=>{
        if (!validationSchema) {
            throw new Error('There is no validation schema generated, this is likely due to the schema not being loaded yet.');
        }
        try {
            validationSchema.validateSync(document, {
                abortEarly: false,
                strict: true
            });
            return null;
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                return strapiAdmin.getYupValidationErrors(error);
            }
            throw error;
        }
    }, [
        validationSchema
    ]);
    /**
   * Here we prepare the form for editing, we need to:
   * - remove prohibited fields from the document (passwords | ADD YOURS WHEN THERES A NEW ONE)
   * - swap out count objects on relations for empty arrays
   * - set __temp_key__ on array objects for drag & drop
   *
   * We also prepare the form for new documents, so we need to:
   * - set default values on fields
   */ const getInitialFormValues = React__namespace.useCallback((isCreatingDocument = false)=>{
        if (!document && !isCreatingDocument && !isSingleType || !schema) {
            return undefined;
        }
        /**
       * Check that we have an ID so we know the
       * document has been created in some way.
       */ const form = document?.id ? document : forms.createDefaultForm(schema, components);
        return data.transformDocument(schema, components)(form);
    }, [
        document,
        isSingleType,
        schema,
        components
    ]);
    const isLoading = isLoadingDocument || isFetchingDocument || isLoadingSchema;
    const hasError = !!error;
    return {
        components,
        document,
        meta,
        isLoading,
        hasError,
        schema,
        schemas,
        validate,
        getTitle,
        getInitialFormValues,
        refetch
    };
};
/* -------------------------------------------------------------------------------------------------
 * useDoc
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal this hook uses the router to extract the model, collection type & id from the url.
 * therefore, it shouldn't be used outside of the content-manager because it won't work as intended.
 */ const useDoc = ()=>{
    const { id, slug, collectionType, origin } = reactRouterDom.useParams();
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query), [
        query
    ]);
    if (!collectionType) {
        throw new Error('Could not find collectionType in url params');
    }
    if (!slug) {
        throw new Error('Could not find model in url params');
    }
    const document = useDocument({
        documentId: origin || id,
        model: slug,
        collectionType,
        params
    }, {
        skip: id === 'create' || !origin && !id && collectionType !== collections.SINGLE_TYPES
    });
    const returnId = origin || id === 'create' ? undefined : id;
    return {
        collectionType,
        model: slug,
        id: returnId,
        ...document
    };
};
/**
 * @public
 * @experimental
 * Content manager context hooks for plugin development.
 * Make sure to use this hook inside the content manager.
 */ const useContentManagerContext = ()=>{
    const { collectionType, model, id, components, isLoading: isLoadingDoc, schema, schemas } = useDoc();
    const layout = useDocumentLayout.useDocumentLayout(model);
    const form = strapiAdmin.useForm('useContentManagerContext', (state)=>state);
    const isSingleType = collectionType === collections.SINGLE_TYPES;
    const slug = model;
    const isCreatingEntry = id === 'create';
    useContentTypeSchema.useContentTypeSchema();
    const isLoading = isLoadingDoc || layout.isLoading;
    const error = layout.error;
    return {
        error,
        isLoading,
        // Base metadata
        model,
        collectionType,
        id,
        slug,
        isCreatingEntry,
        isSingleType,
        hasDraftAndPublish: schema?.options?.draftAndPublish ?? false,
        // All schema infos
        components,
        contentType: schema,
        contentTypes: schemas,
        // Form state
        form,
        // layout infos
        layout
    };
};

exports.useContentManagerContext = useContentManagerContext;
exports.useDoc = useDoc;
exports.useDocument = useDocument;
//# sourceMappingURL=useDocument.js.map
