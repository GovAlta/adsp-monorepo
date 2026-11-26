import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabFilterChip,
  GoabFormItem,
  GoabInput,
  GoabModal,
} from '@abgov/react-components';
import type { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import styled from 'styled-components';
import type { RealmUser } from './clientSecretsApi';
import { CONTACT_EMAIL_PATTERN, MAX_CONTACTS_LENGTH, MIN_USER_SEARCH_LENGTH, USER_SEARCH_DELAY_MS } from './constants';

interface ContactsModalProps {
  heading: string;
  contacts: string[];
  searchUsers: (search: string) => Promise<RealmUser[]>;
  onSave: (contacts: string[]) => void;
  onClose: () => void;
}

const sameContacts = (a: string[], b: string[]) => a.join(',') === b.join(',');

/** Edits a client's contacts as chips. Admins pick realm users from a search or type an email address and press Enter. */
export const ContactsModal: FunctionComponent<ContactsModalProps> = ({
  heading,
  contacts: initial,
  searchUsers,
  onSave,
  onClose,
}) => {
  const [contacts, setContacts] = useState(initial);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RealmUser[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const [typedError, setTypedError] = useState<string>();

  // Wait for a pause in typing, and ignore the answer to a search the admin has already replaced.
  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_USER_SEARCH_LENGTH) {
      setResults([]);
      setSearchFailed(false);
      return;
    }
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(term);
        if (current) {
          setResults(users);
          setSearchFailed(false);
        }
      } catch {
        if (current) {
          setResults([]);
          setSearchFailed(true);
        }
      }
    }, USER_SEARCH_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, searchUsers]);

  const has = (email: string) => contacts.some((contact) => contact.toLowerCase() === email.toLowerCase());

  const add = (email: string) => {
    if (!has(email)) {
      setContacts((current) => [...current, email]);
    }
    setQuery('');
    setResults([]);
    setTypedError(undefined);
  };

  const addTyped = () => {
    const email = query.trim();
    if (!email) {
      return;
    }
    if (CONTACT_EMAIL_PATTERN.test(email)) {
      add(email);
    } else {
      setTypedError(`${email} is not a valid email address.`);
    }
  };

  const tooLong = contacts.join(',').length > MAX_CONTACTS_LENGTH;
  const available = results.filter(({ email }) => !has(email));

  return (
    <GoabModal
      heading={heading}
      open={true}
      onClose={onClose}
      testId="contacts-modal"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" size="compact" onClick={onClose} testId="contacts-cancel">
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            size="compact"
            disabled={tooLong || sameContacts(contacts, initial)}
            onClick={() => onSave(contacts)}
            testId="contacts-save"
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem
        label="Add contacts"
        helpText="Search the users of this realm, or type an email address and press Enter. These contacts are notified before this client's secret expires."
        error={
          typedError ?? (tooLong ? `Contacts must total no more than ${MAX_CONTACTS_LENGTH} characters.` : undefined)
        }
      >
        <SearchBox $open={available.length > 0}>
          <Anchor>
            <GoabInput
              name="contact-search"
              type="search"
              size="compact"
              leadingIcon="search"
              placeholder="Type 3 or more letters of a name or email"
              width="100%"
              value={query}
              error={!!typedError}
              onChange={(detail: GoabInputOnChangeDetail) => {
                setQuery(detail.value);
                setTypedError(undefined);
              }}
              onKeyPress={(detail: { key: string }) => detail.key === 'Enter' && addTyped()}
              testId="contacts-input"
            />
            {available.length > 0 && (
              <Results role="listbox" aria-label="Matching users" data-testid="contacts-results">
                {available.map((user) => (
                  <Result
                    key={user.id}
                    type="button"
                    onClick={() => add(user.email)}
                    data-testid={`contact-result-${user.id}`}
                  >
                    <strong>{user.name ?? user.username}</strong>
                    <span>{user.email}</span>
                  </Result>
                ))}
              </Results>
            )}
          </Anchor>
        </SearchBox>
      </GoabFormItem>

      {searchFailed && (
        <Hint data-testid="contacts-search-error">Users could not be searched. Type an email address instead.</Hint>
      )}

      <Count>
        {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
      </Count>
      <Chips data-testid="contacts-chips">
        {contacts.length === 0 && <Hint>No contacts. Search above to add some.</Hint>}
        {contacts.map((contact) => (
          <GoabFilterChip
            key={contact}
            content={contact}
            onClick={() => setContacts((current) => current.filter((value) => value !== contact))}
            testId={`contact-chip-${contact}`}
          />
        ))}
      </Chips>
    </GoabModal>
  );
};

const Hint = styled.p`
  margin: var(--goa-space-xs) 0 0;
  color: var(--goa-color-text-secondary);
`;

const SearchBox = styled.div<{ $open: boolean }>`
  /* Reserve the dropdown's height so the modal grows instead of clipping it. */
  min-height: ${({ $open }) => ($open ? '13rem' : '0')};
`;

const Anchor = styled.div`
  position: relative;
`;

const Count = styled.div`
  margin-top: var(--goa-space-m);
  font-weight: var(--goa-font-weight-bold);
`;

const Results = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  margin-top: 2px;
  background: var(--goa-color-greyscale-white);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  max-height: 11rem;
  overflow-y: auto;
`;

const Result = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--goa-space-xs) var(--goa-space-s);
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--goa-color-greyscale-100);
  }
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-xs);
  margin-top: var(--goa-space-xs);
  max-height: 10rem;
  overflow-y: auto;
`;
