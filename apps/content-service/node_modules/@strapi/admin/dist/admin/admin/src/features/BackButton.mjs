import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Link } from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import { produce } from 'immer';
import { useIntl } from 'react-intl';
import { useNavigate, NavLink, useLocation, useNavigationType } from 'react-router-dom';
import { createContext } from '../components/Context.mjs';

const [Provider, useHistory] = createContext('History', {
    history: [],
    currentLocationIndex: 0,
    currentLocation: '',
    canGoBack: false,
    pushState: ()=>{
        throw new Error('You must use the `HistoryProvider` to access the `pushState` function.');
    },
    goBack: ()=>{
        throw new Error('You must use the `HistoryProvider` to access the `goBack` function.');
    }
});
const HistoryProvider = ({ children })=>{
    const location = useLocation();
    const navigationType = useNavigationType();
    const navigate = useNavigate();
    const [state, dispatch] = React.useReducer(reducer, {
        history: [],
        currentLocationIndex: 0,
        currentLocation: '',
        canGoBack: false
    });
    const isGoingBack = React.useRef(false);
    const pushState = React.useCallback((path)=>{
        dispatch({
            type: 'PUSH_STATE',
            payload: typeof path === 'string' ? {
                to: path,
                search: ''
            } : path
        });
    }, []);
    const goBack = React.useCallback(()=>{
        /**
     * Perform the browser back action, dispatch the goBack action to keep the state in sync
     * and set the ref to avoid an infinite loop and incorrect state pushing
     */ navigate(-1);
        dispatch({
            type: 'GO_BACK'
        });
        isGoingBack.current = true;
    }, [
        navigate
    ]);
    /**
   * This is a semi-listener pattern to keep the `canGoBack` state in sync.
   */ const prevIndex = React.useRef(state.currentLocationIndex);
    React.useEffect(()=>{
        if (state.currentLocationIndex !== prevIndex.current) {
            dispatch({
                type: 'SET_CAN_GO_BACK',
                payload: state.currentLocationIndex > 1 && state.history.length > 1
            });
            prevIndex.current = state.currentLocationIndex;
        }
    }, [
        prevIndex,
        state.currentLocationIndex,
        state.history.length
    ]);
    /**
   * This effect is responsible for pushing the new state to the history
   * when the user navigates to a new location assuming they're not going back.
   */ React.useLayoutEffect(()=>{
        if (isGoingBack.current) {
            isGoingBack.current = false;
        } else if (navigationType === 'REPLACE') {
            // Prevent appending to the history when the location changes via a replace:true navigation
            dispatch({
                type: 'REPLACE_STATE',
                payload: {
                    to: location.pathname,
                    search: location.search
                }
            });
        } else {
            // this should only occur on link movements, not back/forward clicks
            dispatch({
                type: 'PUSH_STATE',
                payload: {
                    to: location.pathname,
                    search: location.search
                }
            });
        }
    }, [
        dispatch,
        location.pathname,
        location.search,
        navigationType
    ]);
    return /*#__PURE__*/ jsx(Provider, {
        pushState: pushState,
        goBack: goBack,
        ...state,
        children: children
    });
};
const reducer = (state, action)=>produce(state, (draft)=>{
        switch(action.type){
            case 'PUSH_STATE':
                {
                    const path = `${action.payload.to}${action.payload.search}`;
                    if (state.currentLocationIndex === state.history.length) {
                        // add the new place
                        draft.history = [
                            ...state.history,
                            path
                        ];
                    } else {
                        // delete all the history after the current place and then add the new place
                        draft.history = [
                            ...state.history.slice(0, state.currentLocationIndex),
                            path
                        ];
                    }
                    draft.currentLocation = path;
                    draft.currentLocationIndex += 1;
                    break;
                }
            case 'REPLACE_STATE':
                {
                    const path = `${action.payload.to}${action.payload.search}`;
                    draft.history = [
                        ...state.history.slice(0, state.currentLocationIndex - 1),
                        path
                    ];
                    draft.currentLocation = path;
                    break;
                }
            case 'GO_BACK':
                {
                    const newIndex = state.currentLocationIndex - 1;
                    draft.currentLocation = state.history[newIndex - 1];
                    draft.currentLocationIndex = newIndex;
                    break;
                }
            case 'SET_CAN_GO_BACK':
                {
                    draft.canGoBack = action.payload;
                    break;
                }
        }
    });
/**
 * @beta
 * @description The universal back button for the Strapi application. This uses the internal history
 * context to navigate the user back to the previous location. It can be completely disabled in a
 * specific user case. When no history is available, you can provide a fallback destination,
 * otherwise the link will be disabled.
 */ const BackButton = /*#__PURE__*/ React.forwardRef(({ disabled, fallback = '' }, ref)=>{
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const canGoBack = useHistory('BackButton', (state)=>state.canGoBack);
    const goBack = useHistory('BackButton', (state)=>state.goBack);
    const history = useHistory('BackButton', (state)=>state.history);
    const currentLocationIndex = useHistory('BackButton', (state)=>state.currentLocationIndex);
    const hasFallback = fallback !== '';
    const shouldBeDisabled = disabled || !canGoBack && !hasFallback;
    const handleClick = (e)=>{
        e.preventDefault();
        if (canGoBack) {
            goBack();
        } else if (hasFallback) {
            navigate(fallback);
        }
    };
    // The link destination from the history. Undefined if there is only 1 location in the history.
    const historyTo = canGoBack ? history.at(currentLocationIndex - 2) : undefined;
    // If no link destination from the history, use the fallback.
    const toWithFallback = historyTo ?? fallback;
    return /*#__PURE__*/ jsx(Link, {
        ref: ref,
        tag: NavLink,
        to: toWithFallback,
        onClick: handleClick,
        disabled: shouldBeDisabled,
        "aria-disabled": shouldBeDisabled,
        startIcon: /*#__PURE__*/ jsx(ArrowLeft, {}),
        children: formatMessage({
            id: 'global.back',
            defaultMessage: 'Back'
        })
    });
});

export { BackButton, HistoryProvider, useHistory };
//# sourceMappingURL=BackButton.mjs.map
