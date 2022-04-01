import React, { FC, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveApplication } from '@store/status/actions';
import { fetchDirectory, fetchDirectoryDetailByURNs } from '@store/directory/actions';
import { ServiceStatusApplication } from '@store/status/models';
import { GoAButton, GoADropdownOption } from '@abgov/react-components';
import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { createSelector } from 'reselect';
import * as ReactDOM from 'react-dom';

interface Props {
  isOpen: boolean;
  title: string;
  defaultApplication: ServiceStatusApplication;
  onCancel?: () => void;
  onSave?: () => void;
}
const tenantServiceURNSelector = createSelector(
  (state: RootState) => state.directory.directory,
  (directory) => {
    if (!directory) {
      return [];
    }
    return Object.entries(directory)
      .filter((_directory) => {
        return _directory[1].isCore === false;
      })
      .map((_directory) => {
        return _directory[1].urn;
      });
  }
);

const healthEndpointsSelector = createSelector(
  (state: RootState) => state.directory.directory,
  (directory) => {
    console.log(directory);
    return directory
      .filter((_directory) => {
        return _directory?.metadata?._links?.health?.href !== undefined;
      })
      .map((_directory) => {
        return _directory?.metadata._links.health.href;
      });
  }
);

export const ApplicationFormModal: FC<Props> = ({ isOpen, title, onCancel, onSave, defaultApplication }: Props) => {
  const dispatch = useDispatch();
  const [application, setApplication] = useState<ServiceStatusApplication>({ ...defaultApplication });
  const tenantServiceUrns = useSelector(tenantServiceURNSelector);
  const healthEndpoints = useSelector(healthEndpointsSelector);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);

  const dropdownRef = useRef();

  function isFormValid(): boolean {
    if (!application?.name) return false;
    if (!application?.endpoint.url) return false;
    return true;
  }

  function save() {
    if (!isFormValid()) {
      return;
    }
    dispatch(saveApplication(application));
    if (onSave) onSave();
  }

  function getDropdownInput() {
    return (ReactDOM.findDOMNode(dropdownRef.current) as Element).getElementsByClassName('input--goa')[0];
  }

  useEffect(() => {
    dispatch(fetchDirectory());
  }, []);

  useEffect(() => {
    dispatch(fetchDirectoryDetailByURNs(tenantServiceUrns));
  }, [tenantServiceUrns.length]);

  useEffect(() => {
    const dropdownInput = getDropdownInput();
    if (dropdownInput) {
      dropdownInput.addEventListener(
        'click',
        (e) => {
          setOpenDropdown(!openDropdown);
        },
        { passive: true }
      );
    }
  });

  useEffect(() => {}, [healthEndpoints]);
  return (
    <GoAModal isOpen={isOpen}>
      <GoAModalTitle>{title}</GoAModalTitle>

      <GoAModalContent>
        <p>{String(openDropdown)}</p>

        <GoAForm>
          <GoAFormItem>
            <label>Application name</label>
            <GoAInput
              type="text"
              name="name"
              value={application?.name}
              onChange={(name, value) => {
                setApplication({
                  ...application,
                  name: value,
                });
              }}
              aria-label="name"
            />
          </GoAFormItem>

          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              value={application?.description}
              onChange={(e) =>
                setApplication({
                  ...application,
                  description: e.target.value,
                })
              }
              aria-label="description"
            />
          </GoAFormItem>
          <GoAFormItem>
            <div ref={dropdownRef}>
              <GoAInput
                type="test"
                name="url"
                value={application?.endpoint?.url}
                onChange={(name, value) => {
                  setApplication({
                    ...application,
                    endpoint: {
                      url: value,
                      status: 'offline',
                    },
                  });
                  console.log(value);
                }}
              />

              {openDropdown &&
                healthEndpoints.map((endpoint): JSX.Element => {
                  return (
                    <GoADropdownOption
                      label={endpoint}
                      value={endpoint}
                      key={endpoint}
                      visible={true}
                      onClick={(value) => {
                        setOpenDropdown(false);
                        setApplication({
                          ...application,
                          endpoint: {
                            url: value,
                            status: 'offline',
                          },
                        });
                      }}
                    />
                  );
                })}
            </div>
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="tertiary"
          onClick={() => {
            if (onCancel) onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton disabled={!isFormValid()} buttonType="primary" onClick={save}>
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};

export default ApplicationFormModal;
