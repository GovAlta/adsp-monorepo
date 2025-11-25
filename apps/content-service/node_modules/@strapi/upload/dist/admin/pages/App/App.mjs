import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useQueryParams, Page } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { Routes, Route } from 'react-router-dom';
import { useConfig } from '../../hooks/useConfig.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { MediaLibrary } from './MediaLibrary/MediaLibrary.mjs';

// TODO: find a better naming convention for the file that was an index file before
const ConfigureTheView = /*#__PURE__*/ React.lazy(async ()=>import('./ConfigureTheView/ConfigureTheView.mjs').then((mod)=>({
            default: mod.ConfigureTheView
        })));
const Upload = ()=>{
    const { config: { isLoading, isError, data: config } } = useConfig();
    const [{ rawQuery }, setQuery] = useQueryParams();
    const { formatMessage } = useIntl();
    const title = formatMessage({
        id: getTrad('plugin.name'),
        defaultMessage: 'Media Library'
    });
    React.useEffect(()=>{
        if (isLoading || isError || rawQuery) {
            return;
        }
        setQuery({
            sort: config.sort,
            page: 1,
            pageSize: config.pageSize
        });
    }, [
        isLoading,
        isError,
        config,
        rawQuery,
        setQuery
    ]);
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: title
            }),
            rawQuery ? /*#__PURE__*/ jsx(React.Suspense, {
                fallback: /*#__PURE__*/ jsx(Page.Loading, {}),
                children: /*#__PURE__*/ jsxs(Routes, {
                    children: [
                        /*#__PURE__*/ jsx(Route, {
                            index: true,
                            element: /*#__PURE__*/ jsx(MediaLibrary, {})
                        }),
                        /*#__PURE__*/ jsx(Route, {
                            path: "configuration",
                            element: /*#__PURE__*/ jsx(ConfigureTheView, {
                                config: config
                            })
                        })
                    ]
                })
            }) : null
        ]
    });
};

export { Upload };
//# sourceMappingURL=App.mjs.map
