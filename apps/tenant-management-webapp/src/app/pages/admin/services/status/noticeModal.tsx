import { RootState } from '@store/index';
import { saveNotice } from '@store/notice/actions';
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { GoAButton, GoACheckbox } from '@abgov/react-components';
import {
  GoAForm,
  GoAFormItem,
  GoAModalActions,
  GoAModal,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';
import TimePicker from 'react-time-picker';
import DatePicker from 'react-date-picker';
import styled from 'styled-components';
import Multiselect from 'multiselect-react-dropdown';
import CloseIcon from '@icons/close-outline.svg';

const dateTime = (date, time) => {
  const newDate = new Date(date);
  const combinedDateTime = new Date(
    newDate.getMonth() + 1 + '/' + newDate.getDate() + '/' + newDate.getFullYear() + ' ' + time
  );
  return combinedDateTime;
};

interface NoticeModalProps {
  title: string;
  isOpen: boolean;
}

function NoticeModal(props: NoticeModalProps): JSX.Element {
  const dispatch = useDispatch();
  const history = useHistory();
  const { noticeId } = useParams<{ noticeId: string }>();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isAllApplications, setIsAllApplications] = useState(false);

  const { applications, notices } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
    notices: state.notice.notices,
  }));

  useEffect(() => {
    if (noticeId) {
      const notice = notices.find((nt) => noticeId === nt.id);
      const currentStartDate = new Date(notice.startDate);
      const currentEndDate = new Date(notice.endDate);

      setStartDate(currentStartDate);
      setEndDate(currentEndDate);

      setStartTime(
        `${currentStartDate.getHours()}:${
          currentStartDate.getMinutes() < 10 ? '0' : ''
        }${currentStartDate.getMinutes()}`
      );
      setEndTime(
        `${currentEndDate.getHours()}:${currentEndDate.getMinutes() < 10 ? '0' : ''}${currentEndDate.getMinutes()}`
      );
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
  }, []);

  const [selectedApplications, setSelectedApplications] = useState([]);

  function validDateRangeErrors() {
    if (dateTime(endDate, endTime) < dateTime(startDate, startTime)) {
      return { date: 'End date must be later than start date' };
    }
  }

  function messageExistsErrors() {
    if (message.length === 0) {
      return { message: 'Description is required' };
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

  function setValue(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, customValue?: unknown) {
    const { value } = e.target;
    setMessage(value);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const formErrorList = formErrors();
    if (Object.keys(formErrorList).length === 0) {
      dispatch(
        saveNotice({
          id: noticeId,
          message,
          tennantServRef: selectedApplications,
          startDate: dateTime(startDate, startTime),
          endDate: dateTime(endDate, endTime),
          isAllApplications: isAllApplications,
        })
      );

      history.push('/admin/services/status');
    } else {
      setErrors(formErrorList);
    }
  }

  function cancel() {
    history.push('/admin/services/status');
  }

  function onSelect(selected) {
    const parsedApplications = selected.map((s) => {
      return { id: s._id, name: s.name };
    });
    setSelectedApplications(parsedApplications);
  }

  return (
    <GoAModal isOpen={props.isOpen} testId="notice-modal">
      <GoAModalTitle>{props.title}</GoAModalTitle>
      <GoAModalContent>
        <NoticeFormStyle>
          <GoAForm data-testid="notice-form">
            <GoAFormItem error={errors?.['message']}>
              <label>Description</label>
              <textarea
                data-testid="notice-form-description"
                name="message"
                value={message}
                onChange={setValue}
                maxLength={280}
              />
            </GoAFormItem>

            <div>
              <ErrorWrapper className={errors?.['applications'] && 'error'}>
                <label className="notice-title">Application</label>
                <div>
                  <GoACheckbox
                    name="isAllApplications"
                    checked={isAllApplications}
                    data-testid="notice-form-all-applications-checkbox"
                    onChange={() => {
                      setIsAllApplications(!isAllApplications);
                    }}
                  >
                    <span>All applications</span>
                  </GoACheckbox>
                </div>
                {isAllApplications === false && (
                  <MultiDropdownStyle>
                    <Multiselect
                      options={applications}
                      onSelect={onSelect}
                      onRemove={onSelect}
                      displayValue="name"
                      selectedValues={selectedApplications}
                      placeholder=""
                      showCheckbox
                      singleSelect
                      avoidHighlightFirstOption
                      customCloseIcon={<img src={CloseIcon} alt="Close" width="16" />}
                    />
                  </MultiDropdownStyle>
                )}
                <div className="error-msg">{errors?.['applications']}</div>
              </ErrorWrapper>
            </div>

            <ErrorWrapper className={errors?.['date'] && 'error'}>
              <div className="row-flex">
                <div className="flex1 mr-1">
                  <DatePickerStyle>
                    <label>Start date</label>
                    <DatePicker
                      data-testid="notice-form-start-date-picker"
                      name="startDate"
                      onChange={setStartDate}
                      value={startDate}
                    />
                  </DatePickerStyle>
                </div>
                <div className="flex1 ml-1">
                  <DatePickerStyle>
                    <label>End date</label>
                    <DatePicker
                      name="endDate"
                      data-testid="notice-form-end-date-picker"
                      onChange={setEndDate}
                      value={endDate}
                    />
                  </DatePickerStyle>
                </div>
              </div>

              <div className="row-flex">
                <div className="flex1 mr-1">
                  <DatePickerStyle>
                    <label>Start time</label>
                    <TimePicker
                      name="startTime"
                      onChange={setStartTime}
                      data-testid="notice-form-start-time-picker"
                      value={startTime}
                    />
                  </DatePickerStyle>
                </div>
                <div className="flex1 ml-1">
                  <DatePickerStyle>
                    <label>End time</label>
                    <TimePicker
                      name="endTime"
                      onChange={setEndTime}
                      data-testid="notice-form-end-time-picker"
                      value={endTime}
                    />
                  </DatePickerStyle>
                </div>
              </div>

              <div className="error-msg">{errors?.['date']}</div>
            </ErrorWrapper>
          </GoAForm>
        </NoticeFormStyle>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton buttonType="tertiary" data-testid="notice-form-cancel" onClick={cancel}>
          Cancel
        </GoAButton>
        <GoAButton buttonType="primary" type="submit" data-testid="notice-form-submit" onClick={submit}>
          Save as draft
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
}

export const NoticeFormStyle = styled.div`
  .flex1 {
    flex: 1;
  }

  .row-flex {
    display: flex;
    flex-direction: row;
  }

  .mr-1 {
    margin-right: 1em;
  }

  .ml-1 {
    margin-left: 1em;
  }

  label.notice-title {
    font-weight: var(--fw-bold);
    color: var(--color-gray-900);
  }
`;

export const ErrorWrapper = styled.div`
  .error-msg {
    display: none;
  }

  &.error {
    input,
    textarea {
      border-color: var(--color-red);
    }
    .error-msg {
      display: block;
      color: var(--color-red);
    }

    .searchWrapper,
    .react-date-picker__wrapper,
    .react-time-picker__wrapper {
      border-color: var(--color-red);
    }
  }
`;

export const MultiDropdownStyle = styled.div`
  ul {
    list-style-type: none;
  }

  .multiSelectContainer input {
    text-align: right;
    width: 30px;
    padding-right: 0.6em;
  }

  .searchBox {
    float: right;
    margin-top: 1px;
  }

  ul ul {
    list-style-type: none;
  }

  .chip {
    background: var(--color-white);
    color: var(--color-black);
  }

  .searchWrapper {
    border: 1px solid var(--color-gray-600);
    padding: 3px;
    min-height: 42px;
  }

  .chip {
    font-size: 17px;
    background: var(--color-white);
    padding: 7px 10px 4px 5px;
  }

  .searchBox::placeholder {
    color: var(--color-primary-link);
    font-size: 0.9em;
  }

  ul li {
    margin-left: 0.4em;
    margin-top: 0;
    padding: 0;

    input {
      width: auto;
    }
    input[type='checkbox'] {
      -webkit-appearance: checkbox;
      width: 1.25rem;
      height: 1.25rem;
      background: white;
      border-radius: 5px;
      border: 2px solid #555;
    }
    input[type='checkbox']:checked {
      background: var(--color-primary-link);
    }
  }
`;

export const DatePickerStyle = styled.div`
  padding: 1rem 0 1rem 0;
  margin: 0.1rem;

  .react-date-picker__wrapper,
  .react-time-picker__wrapper {
    border-radius: 5px;
    padding: 5px;
  }

  .react-date-picker,
  .react-time-picker {
    width: 100%;
  }

  label {
    display: block;
    font-weight: var(--fw-bold);
    color: var(--color-gray-900);
  }
`;

export default NoticeModal;
