import { jsx } from 'react/jsx-runtime';
import { styled } from 'styled-components';
import { useConfiguration } from '../features/Configuration.mjs';

const Img = styled.img`
  height: 7.2rem;
`;
const Logo = ()=>{
    const { logos: { auth } } = useConfiguration('UnauthenticatedLogo');
    return /*#__PURE__*/ jsx(Img, {
        src: auth?.custom?.url || auth.default,
        "aria-hidden": true,
        alt: ""
    });
};

export { Logo };
//# sourceMappingURL=UnauthenticatedLogo.mjs.map
