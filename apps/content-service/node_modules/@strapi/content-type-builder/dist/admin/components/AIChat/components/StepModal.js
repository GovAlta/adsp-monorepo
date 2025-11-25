'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');

const StepModalContext = /*#__PURE__*/ React.createContext(null);
const useStepModal = ()=>{
    const context = React.useContext(StepModalContext);
    if (!context) {
        throw new Error('useStepModal must be used within a StepModal');
    }
    return context;
};
const StepModal = ({ open, onOpenChange, title, children, onComplete, onCancel })=>{
    const [currentStep, setCurrentStep] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const childrenArray = React.Children.toArray(children).filter((child)=>/*#__PURE__*/ React.isValidElement(child)).map((child)=>child.props);
    const totalSteps = childrenArray.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    // Reset states when modal opens/closes
    React.useEffect(()=>{
        if (!open) {
            // Reset states when modal is closed
            setCurrentStep(0);
            setIsLoading(false);
            setError(null);
        }
    }, [
        open
    ]);
    const resetStates = ()=>{
        setCurrentStep(0);
        setIsLoading(false);
        setError(null);
    };
    const handleCancel = ()=>{
        onCancel?.();
        resetStates();
        onOpenChange(false);
    };
    const handleBack = ()=>{
        setCurrentStep((prev)=>Math.max(0, prev - 1));
        setError(null);
    };
    const nextStep = async ()=>{
        const currentStepProps = childrenArray[currentStep];
        if (currentStepProps.onNext) {
            setIsLoading(true);
            setError(null);
            try {
                if (isLastStep) {
                    onComplete?.();
                    resetStates();
                    onOpenChange(false);
                } else {
                    await currentStepProps.onNext();
                    setCurrentStep((prev)=>prev + 1);
                }
                return true;
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                return false;
            } finally{
                setIsLoading(false);
            }
        } else {
            // Default behavior: just move to next step
            if (isLastStep) {
                onComplete?.();
                resetStates();
                onOpenChange(false);
            } else {
                setCurrentStep((prev)=>prev + 1);
            }
            return true;
        }
    };
    // Handle form submission (triggered by Enter key)
    const handleFormSubmit = (e)=>{
        e.preventDefault();
        if (!isLoading && !childrenArray[currentStep]?.disableNext) {
            nextStep();
        }
    };
    const contextValue = {
        currentStep,
        goToStep: setCurrentStep,
        nextStep,
        prevStep: handleBack,
        isFirstStep,
        isLastStep,
        totalSteps,
        isLoading,
        error,
        setError
    };
    const currentChild = childrenArray[currentStep];
    return /*#__PURE__*/ jsxRuntime.jsx(StepModalContext.Provider, {
        value: contextValue,
        children: open && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
            open: true,
            onOpenChange: handleCancel,
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "omega",
                            fontWeight: "bold",
                            children: currentChild?.title || title
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs("form", {
                        onSubmit: handleFormSubmit,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Body, {
                                children: [
                                    React.Children.toArray(children)[currentStep],
                                    error && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        marginTop: 4,
                                        padding: 3,
                                        background: "danger100",
                                        color: "danger600",
                                        borderRadius: "4px",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "pi",
                                            children: error.message
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                                children: [
                                    isFirstStep ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        variant: "tertiary",
                                        onClick: handleCancel,
                                        type: "button",
                                        children: currentChild?.cancelLabel || 'Cancel'
                                    }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        variant: "tertiary",
                                        onClick: handleBack,
                                        type: "button",
                                        children: currentChild?.backLabel || 'Back'
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        variant: "default",
                                        type: "submit",
                                        disabled: isLoading || currentChild?.disableNext,
                                        loading: isLoading,
                                        children: currentChild?.nextLabel || (isLastStep ? 'Complete' : 'Next')
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Step
 * -----------------------------------------------------------------------------------------------*/ const Step = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: children
    });
};
StepModal.Step = Step;

exports.Step = Step;
exports.StepModal = StepModal;
exports.useStepModal = useStepModal;
//# sourceMappingURL=StepModal.js.map
