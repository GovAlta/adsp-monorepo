import React from 'react';
import styled from 'styled-components';
const Wrapper = styled.div`max-width: 1000px; margin: 0 auto; padding: 24px;`;
const Container: React.FC<React.PropsWithChildren<{}>> = ({ children }) => <Wrapper>{children}</Wrapper>;
export default Container;