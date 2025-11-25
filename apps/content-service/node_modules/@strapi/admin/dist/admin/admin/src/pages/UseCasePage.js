'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var PrivateRoute = require('../components/PrivateRoute.js');
var UnauthenticatedLogo = require('../components/UnauthenticatedLogo.js');
var Auth = require('../features/Auth.js');
var Notifications = require('../features/Notifications.js');
var UnauthenticatedLayout = require('../layouts/UnauthenticatedLayout.js');

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

const options = [
    {
        intlLabel: {
            id: 'Usecase.front-end',
            defaultMessage: 'Front-end developer'
        },
        value: 'front_end_developer'
    },
    {
        intlLabel: {
            id: 'Usecase.back-end',
            defaultMessage: 'Back-end developer'
        },
        value: 'back_end_developer'
    },
    {
        intlLabel: {
            id: 'Usecase.full-stack',
            defaultMessage: 'Full-stack developer'
        },
        value: 'full_stack_developer'
    },
    {
        intlLabel: {
            id: 'global.content-manager',
            defaultMessage: 'Content Manager'
        },
        value: 'content_manager'
    },
    {
        intlLabel: {
            id: 'Usecase.content-creator',
            defaultMessage: 'Content Creator'
        },
        value: 'content_creator'
    },
    {
        intlLabel: {
            id: 'Usecase.other',
            defaultMessage: 'Other'
        },
        value: 'other'
    }
];
const UseCasePage = ()=>{
    const { toggleNotification } = Notifications.useNotification();
    const location = reactRouterDom.useLocation();
    const navigate = reactRouterDom.useNavigate();
    const { formatMessage } = reactIntl.useIntl();
    const [role, setRole] = React__namespace.useState(null);
    const [otherRole, setOtherRole] = React__namespace.useState('');
    const { firstname, email } = Auth.useAuth('UseCasePage', (state)=>state.user) ?? {};
    const { hasAdmin } = qs.parse(location.search, {
        ignoreQueryPrefix: true
    });
    const isOther = role === 'other';
    const handleSubmit = async (event, skipPersona)=>{
        event.preventDefault();
        try {
            await fetch(`${process.env.STRAPI_ANALYTICS_URL || 'https://analytics.strapi.io'}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    username: firstname,
                    firstAdmin: Boolean(!hasAdmin),
                    persona: {
                        role: skipPersona ? undefined : role,
                        otherRole: skipPersona ? undefined : otherRole
                    }
                })
            });
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'Usecase.notification.success.project-created',
                    defaultMessage: 'Project has been successfully created'
                })
            });
            navigate('/');
        } catch (err) {
        // Silent
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            labelledBy: "usecase-title",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.LayoutContent, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs("form", {
                        onSubmit: (e)=>handleSubmit(e, false),
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                paddingBottom: 7,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLogo.Logo, {}),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        paddingTop: 6,
                                        paddingBottom: 1,
                                        width: `25rem`,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            textAlign: "center",
                                            variant: "alpha",
                                            tag: "h1",
                                            id: "usecase-title",
                                            children: formatMessage({
                                                id: 'Usecase.title',
                                                defaultMessage: 'Tell us a bit more about yourself'
                                            })
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 6,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                        name: "usecase",
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                children: formatMessage({
                                                    id: 'Usecase.input.work-type',
                                                    defaultMessage: 'What type of work do you do?'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                                onChange: (value)=>setRole(value),
                                                value: role,
                                                children: options.map(({ intlLabel, value })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                        value: value,
                                                        children: formatMessage(intlLabel)
                                                    }, value))
                                            })
                                        ]
                                    }),
                                    isOther && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                        name: "other",
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                children: formatMessage({
                                                    id: 'Usecase.other',
                                                    defaultMessage: 'Other'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                                                value: otherRole,
                                                onChange: (e)=>setOtherRole(e.target.value)
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        type: "submit",
                                        size: "L",
                                        fullWidth: true,
                                        disabled: !role,
                                        children: formatMessage({
                                            id: 'global.finish',
                                            defaultMessage: 'Finish'
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextButton, {
                            onClick: (event)=>handleSubmit(event, true),
                            children: formatMessage({
                                id: 'Usecase.button.skip',
                                defaultMessage: 'Skip this question'
                            })
                        })
                    })
                })
            ]
        })
    });
};
const PrivateUseCasePage = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(PrivateRoute.PrivateRoute, {
        children: /*#__PURE__*/ jsxRuntime.jsx(UseCasePage, {})
    });
};

exports.PrivateUseCasePage = PrivateUseCasePage;
exports.UseCasePage = UseCasePage;
exports.options = options;
//# sourceMappingURL=UseCasePage.js.map
