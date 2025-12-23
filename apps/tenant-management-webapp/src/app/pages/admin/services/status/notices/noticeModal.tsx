import { RootState } from '@store/index';
import { saveNotice } from '@store/notice/actions';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoabTextArea,
  GoabButton,
  GoabCheckbox,
  GoabButtonGroup,
  GoabFormItem,
  GoabModal,
  GoabInput,
  GoabInputTime,
  GoabDropdown,
  GoabDropdownItem,
  GoabGrid,
} from '@abgov/react-components';
import { getTimeFromGMT, getDateTime } from '@lib/timeUtil';
import { HelpTextComponent } from '@components/HelpTextComponent';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
} from '@abgov/ui-components-common';

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
    <GoabModal
      open={props.isOpen}
      testId="notice-modal"
      heading={props.title}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="notice-form-cancel" onClick={cancel}>
            Cancel
          </GoabButton>
          <GoabButton type="primary" data-testId="notice-form-submit" onClick={submit}>
            Save as draft
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem error={errors?.['message']} label="Description">
        <GoabTextArea
          testId="notice-form-description"
          name="message"
          value={message}
          width="100%"
          onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
            setMessage(detail.value);
          }}
          // eslint-disable-next-line
          onChange={() => {}}
        />
        <HelpTextComponent
          length={message.length}
          maxLength={180}
          descErrMessage={descErrMessage}
          errorMsg={errors?.['description']}
        />
      </GoabFormItem>
      <br />
      <GoabFormItem label="Application">
        <GoabCheckbox
          name="isAllApplications"
          checked={isAllApplications}
          testId="notice-form-all-applications-checkbox"
          ariaLabel="notice-form-all-applications-checkbox"
          onChange={() => {
            setIsAllApplications(!isAllApplications);
          }}
          text="All applications"
        />
      </GoabFormItem>

      {isAllApplications === false && (
        <GoabFormItem label="Select an application" error={errors?.['applications']}>
          <GoabDropdown
            name="application"
            value={selectedApplications[0]?.name}
            onChange={(detail: GoabDropdownOnChangeDetail) => onSelect(detail.name)}
            width={'54ch'}
            testId="application-dropdown-list"
            aria-label="application-dropdown"
          >
            {noMonitorOnlyApplications.map((w) => (
              <GoabDropdownItem key={w.name} value={w.name} label={w.name} />
            ))}
          </GoabDropdown>
        </GoabFormItem>
      )}
      <br />

      <GoabGrid gap="s" minChildWidth="25ch">
        <GoabFormItem label="Start date" error={errors?.['date']}>
          <GoabInput
            type="date"
            name="StartDate"
            value={startDate.toISOString().slice(0, 10)}
            width="100%"
            testId="notice-form-start-date-picker"
            onChange={(detail: GoabInputOnChangeDetail) => {
              if (isValidDateString(detail.value)) {
                setErrors({});
                setStartDate(new Date(detail.value));
              } else {
                setErrors({ date: 'Please input right start date format!' });
              }
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="Start time">
          <GoabInput
            type="time"
            name="startTime"
            value={startTime}
            step={1}
            width="100%"
            testId="notice-form-start-time"
            onChange={(detail: GoabInputOnChangeDetail) => {
              setStartTime(detail.value);
            }}
          />
        </GoabFormItem>

        <GoabFormItem label="End date">
          <GoabInput
            type="date"
            name="EndDate"
            value={endDate.toISOString().slice(0, 10)}
            width="100%"
            testId="notice-form-end-date-picker"
            onChange={(detail: GoabInputOnChangeDetail) => {
              if (isValidDateString(detail.value)) {
                setErrors({});
                setEndDate(new Date(detail.value));
              } else {
                setErrors({ date: 'Please input right end date format!' });
              }
            }}
          />
        </GoabFormItem>

        <GoabFormItem label="End time">
          <GoabInput
            type="time"
            name="endTime"
            value={endTime}
            step={1}
            width="100%"
            testId="notice-form-start-time"
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndTime(detail.value);
            }}
          />
        </GoabFormItem>
      </GoabGrid>
    </GoabModal>
  );
}

export default NoticeModal;
