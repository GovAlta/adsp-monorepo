import styled from 'styled-components';
export const SkeletonLoading = styled.div`
  padding: 10px;
  text-align: center;
`;
export const Title = styled.h2`
  && {
    font-weight: var(--fw-regular);
    margin-bottom: 1.5rem;
  }
`;

export const Main = styled.main`
  padding-bottom: 10rem;
`;

export const ServiceStatusesCss = styled.div`
  .section-vs {
    margin-bottom: 5rem;
  }

  .section-vs-small {
    margin-bottom: 2.5rem;
  }

  .line-vs {
    margin-bottom: 1.5rem;
  }

  .line-vs-small {
    padding-bottom: 1rem;
  }

  h3 {
    margin-bottom: 1.5rem !important;
  }
  .small-container {
    max-width: 50rem;
    margin: 0 auto;
    div.goa-form div {
      padding: 0;
      outline: none;
    }
    div.goa-form input {
      border: none;
      margin: 0;
    }
  }

  .small-font {
    font-size: 0.625rem;
  }

  .flex {
    flex: 1;
  }

  .timezone {
    text-align: right;
    color: #70757a;
    font-size: var(-fs-xs);
  }
`;
export const GoAFormActionOverwrite = styled.div`
  margin-top: var(--goa-space-m);
  margin-bottom: var(--goa-space-m);
`;

export const AllApplications = styled.div`
  margin-right: 0.5rem;
  title-line: {
    line-height: 2rem;
    margin-bottom: 0.5rem;
  }
  .goa-callout {
    margin: 0px !important;
  }
  .timezone-text {
    font-size: 0.875rem;
    color: #666666;
    line-height: 2rem;
    text-align: right;
  }

  .mb-1 {
    margin-bottom: 1rem;
  }
`;
export const HeaderContainer = styled.div`
  position: relative;
  border-bottom: 1px solid #dcdcdc;
  margin-bottom: 10px;
`;
