import { RootState } from '@store/index';
import { saveNotice } from '@store/notice/actions';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoATextArea,
  GoAButton,
  GoACheckbox,
  GoAButtonGroup,
  GoAFormItem,
  GoAModal,
  GoAInputDate,
  GoAInputTime,
  GoADropdown,
  GoADropdownItem,
  GoAGrid,
} from '@abgov/react-components';
import { getTimeFromGMT, getDateTime } from '@lib/timeUtil';
import { HelpTextComponent } from '@components/HelpTextComponent';

interface NoticeModalProps {
  title: string;
  isOpen: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  noticeId?: string;
}

function NoticeModal(props: NoticeModalProps): JSX.Element {
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isAllApplications, setIsAllApplications] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const descErrMessage = 'Notice description can not be over 180 characters';
  const { applications, notices } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
    notices: state.notice.notices,
  }));

  const noMonitorOnlyApplications = applications.filter((application) => !application.monitorOnly);

  useEffect(() => {
    if (props.noticeId) {
      const notice = notices.find((nt) => props?.noticeId === nt.id);
      const currentStartDate = new Date(notice.startDate);
      const currentEndDate = new Date(notice.endDate);
      setStartDate(currentStartDate);
      setEndDate(currentEndDate);

      setStartTime(getTimeFromGMT(currentStartDate));
      setEndTime(getTimeFromGMT(currentEndDate));
      setMessage(notice.message);

      let parsedApplications = [];
      try {
        parsedApplications = notice.tennantServRef;
      } catch (e) {
        console.log(e);
      } finally {
        setSelectedApplications(parsedApplications);
        setIsAllApplications(notice.isAllApplications);
      }
    }
  }, [props.noticeId]); // eslint-disable-line react-hooks/exhaustive-deps

  function validDateRangeErrors() {
    if (getDateTime(endDate, endTime) < getDateTime(startDate, startTime)) {
      setErrors({ date: 'End date must be later than start date' });
      return { date: 'End date must be later than start date' };
    }
  }

  function messageExistsErrors() {
    if (message.length === 0) {
      return { message: 'Description is required' };
    }
    if (message.length > 250) {
      return { message: 'Description could not over 250 characters' };
    }
  }

  function applicationSelectedErrors() {
    if (selectedApplications.length === 0) {
      return { applications: 'You must select at least 1 application' };
    }
  }

  function formErrors() {
    const applicationSelectedConst = isAllApplications ? null : applicationSelectedErrors();
    const validDateRangeConst = validDateRangeErrors();
    const messageExistsConst = messageExistsErrors();

    return { ...applicationSelectedConst, ...validDateRangeConst, ...messageExistsConst };
  }

  function submit() {
    const formErrorList = formErrors();
    if (Object.keys(formErrorList).length === 0) {
      dispatch(
        saveNotice({
          id: props?.noticeId,
          message,
          tennantServRef: selectedApplications,
          startDate: getDateTime(startDate, startTime),
          endDate: getDateTime(endDate, endTime),
          isAllApplications: isAllApplications,
        })
      );

      if (props.onSave) props.onSave();
    }
  }

  function cancel() {
    setNoticeDefaults();
    if (props.onCancel) props.onCancel();
  }

  function onSelect(selected) {
    const application = noMonitorOnlyApplications.find((s) => s.name === selected);
    const parsedApplications = { id: application.appKey, name: application.name };
    setSelectedApplications([parsedApplications]);
  }

  function setNoticeDefaults() {
    setMessage('');
    setIsAllApplications(false);
    setErrors({});
    setStartDate(new Date());
    setStartTime('10:00');
    setEndDate(new Date());
    setEndTime('14:00');
    setSelectedApplications([]);
  }
  const isValidDateString = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  return (
    <GoAModal
      open={props.isOpen}
      testId="notice-modal"
      heading={props.title}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" testId="notice-form-cancel" onClick={cancel}>
            Cancel
          </GoAButton>
          <GoAButton type="primary" data-testId="notice-form-submit" onClick={submit}>
            Save as draft
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['message']} label="Description">
        <GoATextArea
          testId="notice-form-description"
          name="message"
          value={message}
          width="100%"
          onKeyPress={(name, value, key) => {
            setMessage(value);
          }}
          // eslint-disable-next-line
          onChange={(name, value) => {}}
        />
        <HelpTextComponent
          length={message.length}
          maxLength={180}
          descErrMessage={descErrMessage}
          errorMsg={errors?.['description']}
        />
      </GoAFormItem>
      <br />
      <GoAFormItem label="Application">
        <GoACheckbox
          name="isAllApplications"
          checked={isAllApplications}
          testId="notice-form-all-applications-checkbox"
          ariaLabel="notice-form-all-applications-checkbox"
          onChange={() => {
            setIsAllApplications(!isAllApplications);
          }}
          text="All applications"
        />
      </GoAFormItem>

      {isAllApplications === false && (
        <GoAFormItem label="Select an application" error={errors?.['applications']}>
          <GoADropdown
            name="application"
            value={selectedApplications[0]?.name}
            onChange={(_, name) => onSelect(name)}
            width={'54ch'}
            testId="application-dropdown-list"
            aria-label="application-dropdown"
          >
            {noMonitorOnlyApplications.map((w) => (
              <GoADropdownItem key={w.name} value={w.name} label={w.name} />
            ))}
          </GoADropdown>
        </GoAFormItem>
      )}
      <br />

      <GoAGrid gap="s" minChildWidth="25ch">
        <GoAFormItem label="Start date" error={errors?.['date']}>
          <GoAInputDate
            name="StartDate"
            value={startDate}
            width="100%"
            testId="notice-form-start-date-picker"
            onChange={(name, value) => {
              if (isValidDateString(value)) {
                setErrors({});
                setStartDate(new Date(value));
              } else {
                setErrors({ date: 'Please input right start date format!' });
              }
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Start time">
          <GoAInputTime
            name="startTime"
            value={startTime}
            step={1}
            width="100%"
            testId="notice-form-start-time"
            onChange={(name, value) => {
              setStartTime(value);
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End date">
          <GoAInputDate
            name="EndDate"
            value={endDate}
            width="100%"
            testId="notice-form-end-date-picker"
            onChange={(name, value) => {
              if (isValidDateString(value)) {
                setErrors({});
                setEndDate(new Date(value));
              } else {
                setErrors({ date: 'Please input right end date format!' });
              }
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End time">
          <GoAInputTime
            name="endTime"
            value={endTime}
            step={1}
            width="100%"
            testId="notice-form-start-time"
            onChange={(name, value) => {
              setEndTime(value);
            }}
          />
        </GoAFormItem>
      </GoAGrid>
    </GoAModal>
  );
}

export default NoticeModal;
