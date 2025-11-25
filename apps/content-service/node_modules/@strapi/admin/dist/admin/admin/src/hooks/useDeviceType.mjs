import * as React from 'react';

/**
 * Hook to detect the device type used by the user
 * @returns {DeviceType} The device type
 */ function useDeviceType() {
    const [deviceType, setDeviceType] = React.useState('desktop');
    React.useEffect(()=>{
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(userAgent)) {
            setDeviceType('mobile');
        } else if (/ipad|tablet|android(?!.*mobile)/.test(userAgent)) {
            setDeviceType('tablet');
        } else {
            setDeviceType('desktop');
        }
    }, []);
    return deviceType;
}

export { useDeviceType };
//# sourceMappingURL=useDeviceType.mjs.map
