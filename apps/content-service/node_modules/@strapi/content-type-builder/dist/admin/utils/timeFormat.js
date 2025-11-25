'use strict';

// The backend sends a value which has the following format: '00:45:00.000'
// but the time picker only supports hours & minutes so we need to mutate the value
const removeSeconds = (time)=>{
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
};
// we need to send back the value with the same '00:45:00.000' format
const addSecondsAndMilliseconds = (time)=>{
    return time.split(':').length === 2 ? `${time}:00.000` : time;
};
const formatTimeForInput = (value)=>{
    if (!value) return;
    return value.split(':').length > 2 ? removeSeconds(value) : value;
};
const formatTimeForOutput = (value)=>{
    if (!value) return undefined;
    return addSecondsAndMilliseconds(value);
};
const handleTimeChange = ({ value })=>{
    const formattedInputTime = formatTimeForInput(value);
    return formattedInputTime;
};
const handleTimeChangeEvent = (onChange, name, type, time)=>{
    const formattedOutputTime = formatTimeForOutput(time);
    onChange({
        target: {
            name,
            value: formattedOutputTime,
            type
        }
    });
};

exports.handleTimeChange = handleTimeChange;
exports.handleTimeChangeEvent = handleTimeChangeEvent;
//# sourceMappingURL=timeFormat.js.map
