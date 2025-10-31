import { GoAIconButton } from '@abgov/react-components';
import { Dirent } from 'fs';
import { useEffect, useRef, useState } from 'react';
import { styled } from 'styled-components';

const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
  margin-right: 4px;
`;

const Tooltip = styled.div`
  position: relative;
  p {
    display: none;
    position: absolute;
  }
  &:hover p {
    display: block;
    margin: 0;
    padding: 3px 7px;
    background: #ffffff;
    border: 1px solid grey;
    bottom: -37px;
    width: max-content;
    min-width: 200px;
    font-size: 16px;
  }
`;

const Edit = styled.div`
  .flexRow {
    display: flex;
    flex-direction: row;
  }

  .badgePadding {
    margin: 6px 0 0 5px;
  }

  goa-icon-button {
    position: relative;
    left: -0.25rem;
  }

  a {
    margin-top: 3px;
    margin-right: var(--goa-space-xs);
    text-decoration: underline;
    line-height: 28px;
  }
  display: flex;
  flex-direction: row;
  margin-right: var(--goa-space-m);
  margin-top: 0;
  padding-top: var(--goa-space-3xs);
`;

const ConfigurationFormWrapper = styled.div`
  margin-top: var(--goa-space-m);
  font-size: var(--goa-fontSize-3);
  padding-left: 3px;
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: 3px;
  height: 7.375rem;
  background-color: var(--goa-color-greyscale-100);
  padding-right: var(--goa-color-greyscale-100);
  min-width: 0;

  display: flex;
  margin-bottom: var(--goa-space-l);
  .nameColumn {
    width: 91px;
    height: 85px;
    margin: var(--goa-space-m);
  }
  .idColumn {
    width: 105px;
    height: 118px;
    margin: var(--goa-space-m);
  }
  .descColumn {
    min-width: 150px;
    max-width: 606px;
    height: 118px;
    margin: var(--goa-space-m);
    p {
      bottom: -105px !important;
      max-width: 300px !important;
    }
  }
  .overflowContainer {
    height: 48px;
    overflow: hidden;
    vertical-align: top;
    width: 100%;
    -webkit-box-orient: vertical;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    font-size: 16px;
    font-weight: 400;
    font-family: 'acumin-pro-semi-condensed';
    line-height: 24px;
    word-wrap: break-word;
    word-break: break-word;
  }
  .editColumn {
    float: right;
    width: 53px;

    margin: var(--goa-space-m) var(--goa-space-m) var(--goa-space-m) auto;
  }
  .separator {
    margin-top: var(--goa-space-m);
    width: 1px;
    height: 5.375rem;

    border-left: var(--goa-border-width-s) solid #ccc;
  }
  table {
  }
  th {
    white-space: nowrap;
    text-align: left;
    font-size: var(--goa-font-size-4);
    line-height: var(--goa-line-height-3);
    font-weight: var(--goa-font-weight-bold);
    font-family: var(--goa-font-family-sans);
  }
`;

interface EditorConfigurationFormProps {
  resource: Partial<{ id: string; name: string; description: string }>;
  canEdit?: boolean;
  onEdit?: () => void;
}
export const EditorConfigurationForm = ({ resource, canEdit = true, onEdit }: EditorConfigurationFormProps) => {
  const { id, name, description } = resource || {};

  const [isEllipsesActive, setIsEllipsesActive] = useState(false);
  const tooltipElem = useRef<HTMLDivElement>(null);
  const [isNameEllipsesActive, setIsNameEllipsesActive] = useState(false);
  const tooltipNameElem = useRef<HTMLDivElement>(null);
  const [isDescEllipsesActive, setIsDescEllipsesActive] = useState(false);
  const tooltipDescElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elem = tooltipNameElem.current;
    setIsNameEllipsesActive(
      elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false
    );
  }, []);

  useEffect(() => {
    const elem = tooltipElem.current;
    setIsEllipsesActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);

  useEffect(() => {
    const elem = tooltipDescElem.current;
    setIsDescEllipsesActive(
      elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false
    );
  }, []);

  return (
    <ConfigurationFormWrapper>
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="resource-name">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipNameElem}>
                    {name}
                  </div>
                  {isNameEllipsesActive && <p>{name}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="idColumn">
        <table>
          <thead>
            <tr>
              <th>ID</th>
            </tr>
            <tr>
              <td data-testid="resource-id">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipElem}>
                    {id}
                  </div>
                  {isEllipsesActive && <p>{id}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="descColumn">
        <table>
          <thead>
            <tr>
              <th>Description</th>
            </tr>
            <tr>
              <td data-testid="resource-description">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipDescElem}>
                    {description}
                  </div>
                  {isDescEllipsesActive && <p>{description}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      {canEdit && (
        <div className="editColumn">
          <Edit>
            <Anchor rel="noopener noreferrer" onClick={onEdit}>
              Edit
            </Anchor>
            <GoAIconButton icon="create" testId="edit-icon-button" title="Edit" size="small" onClick={onEdit} />
          </Edit>
        </div>
      )}
    </ConfigurationFormWrapper>
  );
};
