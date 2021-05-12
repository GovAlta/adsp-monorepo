import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoARadioGroup, GoAButton } from '@abgov/react-components';
import { UpdateTenantConfigService } from '@store/tenantConfig/actions';
import { TerminateFileService } from '@store/file/actions';
import { FILE_INIT } from '@store/file/models';
import { RootState } from '@store/index';

const FileSettings = () => {
  const Space = () => {
    const style = {
      height: '28px',
    };
    return <div style={style}></div>;
  };

  const SecuritySettings = () => {
    const settingOptions = [
      {
        text: 'OptionA',
        value: 'option-a',
      },
      {
        text: 'OptionB',
        value: 'option-b',
      },
    ];

    // TODO: need to update the options when config is ready
    const mockOptions = [
      {
        text: 'OptionA',
        value: 'option-a',
      },
      {
        text: 'OptionB',
        value: 'option-b',
      },
    ];

    return (
      <div>
        <h3>Security Settings</h3>
        <Space />
        <b>Would you like this setting set to setted?</b>
        <GoARadioGroup
          name="fileSecurityOptions"
          items={settingOptions}
          onChange={() => {
            console.log('avoid lint error');
          }}
        />

        <h4>As stated above, want this set?</h4>

        <GoARadioGroup
          name="mockSecurityOptions"
          items={mockOptions}
          onChange={() => {
            console.log('avoid lint error');
          }}
        />

        <b>This is a dropbox with a world of options:</b>
        {/* TODO: Need to add the GoA dropdown later */}

        <Space />
      </div>
    );
  };

  const ServiceManagement = () => {
    const dispatch = useDispatch();
    const tenantConfig = useSelector((state: RootState) => state.tenantConfig);
    return (
      <div>
        <h3>Service Management</h3>

        <p>Vestibulum eget egestas diam. Fusce est massa, venenatis a condimentum sed, elementum vel diam.</p>

        <GoAButton
          buttonType="secondary"
          onClick={() => {
            const oldConfig = Object.assign({}, tenantConfig);

            const updatedConfig = {
              ...oldConfig,
              fileService: {
                isActive: false,
                isEnabled: false,
              },
            };

            dispatch(UpdateTenantConfigService(updatedConfig));
          }}
        >
          Disable File Service
        </GoAButton>

        <GoAButton
          className="file-disable-btn"
          buttonType="tertiary"
          onClick={() =>
            dispatch(
              TerminateFileService(
                FILE_INIT // FIXME: this is not right, but currently the method is defined as needing these params
              )
            )
          }
        >
          Terminate File Service
        </GoAButton>
      </div>
    );
  };

  return (
    <div>
      <SecuritySettings />
      <ServiceManagement />
    </div>
  );
};

export default FileSettings;
