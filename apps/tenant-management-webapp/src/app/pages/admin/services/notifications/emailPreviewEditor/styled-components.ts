import styled, { createGlobalStyle } from 'styled-components';

export const NotificationTemplateContainer = styled.div`
  display: flex;
  padding-left: 3rem;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;
// Edit Template components
export const EditTemplateContainer = styled.div`
  width: 40%;
  padding-right: 1rem;
  margin-top: 4rem;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
`;
export const Modal = styled.div<{ open: boolean }>`
  display: ${(props) => (props.open ? `block` : `none`)};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index:10000;
  width: 100%;
`;

export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden` : `auto`)};
  }
`
export const ModalInner = styled.div`
  background: white;
`;
export const PreviewTemplateContainer = styled.div`
  width: 60%;
  margin-left: 2rem;
  padding-top: 4rem;
  padding-left: 2rem;
  background-color: #00000075;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
`;
export const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;
export const EditTemplateActions = styled.div`
  display: flex;
  justify-content: right;
  gap: 1rem;
`;

// preview template components

export const SubjectPreview = styled.div`
  background-color: white;
  padding-left: 1rem;
  margin-right: 2rem;
  height: 100%;
`;

export const BodyPreview = styled.div`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  margin-right: 2rem;
  height: 30rem;
`;
