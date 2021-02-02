import { GoARadioGroup, GoAButton } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import React from 'react';
import './file.css';
import { TYPES } from '../../../../store/actions';
import { DropdownButton, Dropdown } from 'react-bootstrap';

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

        <DropdownButton id="dropdown-basic-button" title="Dropdown button">
          <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
          <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
          <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
        </DropdownButton>
        <Space />
      </div>
    );
  };

  const ServiceManagement = () => {
    const dispatch = useDispatch();

    return (
      <div>
        <h3>Service Management</h3>

        <p>
          Vestibulum eget egestas diam. Fusce est massa, venenatis a condimentum
          sed, elementum vel diam.
        </p>

        <GoAButton
          buttonType="secondary"
          content="Disable Service"
          onClick={() => dispatch({ type: TYPES.FILE_DISABLE })}
        />

        <GoAButton
          className="file-disable-btn"
          buttonType="tertiary"
          content="Delete Service"
          onClick={() => dispatch({ type: TYPES.FILE_DELETE })}
        />
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
