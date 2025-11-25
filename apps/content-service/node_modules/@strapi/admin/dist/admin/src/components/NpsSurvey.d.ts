import * as React from 'react';
declare const NpsSurvey: () => import("react/jsx-runtime").JSX.Element | null;
interface NpsSurveySettings {
    enabled: boolean;
    lastResponseDate: string | null;
    firstDismissalDate: string | null;
    lastDismissalDate: string | null;
}
/**
 * We exported to make it available during admin user registration.
 * Because we only enable the NPS for users who subscribe to the newsletter when signing up
 */
declare function useNpsSurveySettings(): {
    npsSurveySettings: NpsSurveySettings;
    setNpsSurveySettings: React.Dispatch<React.SetStateAction<NpsSurveySettings>>;
};
export { NpsSurvey, useNpsSurveySettings };
