import { createPrompt, useState, useKeypress, isEnterKey, isTabKey, usePrefix, makeTheme, } from '@inquirer/core';
import { styleText } from 'node:util';
const confirmTheme = {
    keywords: {
        yes: 'Yes',
        no: 'No',
        error: ({ yes, no }) => `You must answer with "${yes}" or "${no}"`,
    },
    style: {
        confirmDefault: (text) => {
            const first = text[0] ?? '';
            if (first.toLowerCase() === first.toUpperCase()) {
                return styleText('cyan', text);
            }
            return first.toUpperCase() + text.slice(1);
        },
    },
};
export default createPrompt((config, done) => {
    const [status, setStatus] = useState('idle');
    const [value, setValue] = useState('');
    const [errorMsg, setError] = useState();
    const theme = makeTheme(confirmTheme, config.theme);
    const prefix = usePrefix({ status, theme });
    const { yes, no } = theme.keywords;
    // The hint shows the first character of each label, lowercased; the default
    // side is then uppercased (or colored) by `confirmDefault`.
    const yesHint = (yes[0] ?? '').toLowerCase();
    const noHint = (no[0] ?? '').toLowerCase();
    const hint = config.default === false
        ? `${yesHint}/${theme.style.confirmDefault(noHint)}`
        : `${theme.style.confirmDefault(yesHint)}/${noHint}`;
    function boolToString(value) {
        return value ? yes : no;
    }
    const { transformer = boolToString } = config;
    // Note: the built-in English `y`/`n`/`yes`/`no` answers are always accepted,
    // whatever the localized keywords are; typing a single ASCII key is the
    // terminal muscle memory, even in non-Latin locales.
    function getBooleanValue(value) {
        const v = value.trim().toLowerCase();
        // Empty input selects the default answer (the one highlighted in the hint).
        if (v === '')
            return config.default !== false;
        if (yes.toLowerCase().startsWith(v))
            return true;
        if (no.toLowerCase().startsWith(v))
            return false;
        if ('yes'.startsWith(v))
            return true;
        if ('no'.startsWith(v))
            return false;
        // Unrecognized input is rejected by the caller (shows an error).
        return undefined;
    }
    useKeypress((key, rl) => {
        if (status !== 'idle')
            return;
        if (isEnterKey(key)) {
            const answer = getBooleanValue(value);
            if (answer === undefined) {
                // Reject unrecognized input instead of silently falling back on the
                // default. Restore the typed input (the line event cleared it).
                rl.write(value);
                setError(theme.keywords.error({ yes, no }));
                return;
            }
            setValue(transformer(answer));
            setStatus('done');
            done(answer);
        }
        else if (isTabKey(key)) {
            const answer = boolToString(!(getBooleanValue(value) ?? config.default !== false));
            rl.clearLine(0); // Remove the tab character.
            rl.write(answer);
            setValue(answer);
        }
        else {
            setValue(rl.line);
            setError(undefined);
        }
    });
    let formattedValue = value;
    let defaultValue = '';
    if (status === 'done') {
        formattedValue = theme.style.answer(value);
    }
    else {
        defaultValue = ` ${theme.style.defaultAnswer(hint)}`;
    }
    const message = theme.style.message(config.message, status);
    let error = '';
    if (errorMsg) {
        error = theme.style.error(errorMsg);
    }
    return [`${prefix} ${message}${defaultValue} ${formattedValue}`, error];
});
