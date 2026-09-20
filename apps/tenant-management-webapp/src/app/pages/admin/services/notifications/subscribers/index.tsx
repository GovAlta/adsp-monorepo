import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton, GoabCallout } from '@abgov/react-components';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { CreateSubscriber, DeleteSubscriber, FindSubscribers, UpdateSubscriber } from '@store/subscription/actions';
import type { Subscriber, SubscriberSort } from '@store/subscription/models';
import { DEFAULT_PAGE_SIZE, DEFAULT_SUBSCRIBER_SORT } from '@store/subscription/models';
import { PageIndicator } from '@components/Indicator';
import { DeleteModal } from '@components/DeleteModal';
import { renderNoItem } from '@components/NoItem';
import { RecipientSearchForm } from './recipientSearchForm';
import { SubscriberList } from './subscriberList';
import { SubscriberModalForm } from './editSubscriber';
import { RecipientDetails } from './recipientDetails';
import { RecipientPagination } from './recipientPagination';
import { useHasRole } from '../subscription/useHasRole';
import { hideDecorativeIcons } from '@lib/hideDecorativeIcons';

export const Subscribers: FunctionComponent = () => {
  const dispatch = useDispatch();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SubscriberSort>(DEFAULT_SUBSCRIBER_SORT);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>(null);
  const [isAddSubscriberOpen, setIsAddSubscriberOpen] = useState(false);
  const [editing, setEditing] = useState<Subscriber>(null);
  const [deleting, setDeleting] = useState<Subscriber>(null);

  // The service pages with an opaque cursor that only points forward, so the cursor that opened
  // each page already visited is kept to be able to step back through them.
  const pageCursors = useRef<string[]>([null]);

  const subscribers = useSelector((state: RootState) => {
    const results = state.subscription.subscriberSearch.results;
    return results ? results.map((id) => state.subscription.subscribers[id]).filter((sub) => !!sub) : null;
  });
  const next = useSelector((state: RootState) => state.subscription.subscriberSearch.next);
  const total = useSelector((state: RootState) => state.subscription.subscriberSearch.total);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const hasSubscriptionAdmin = useHasRole('subscription-admin');

  useEffect(() => {
    if (hasSubscriptionAdmin) {
      dispatch(FindSubscribers({ top: DEFAULT_PAGE_SIZE, search, sort, next: pageCursors.current[pageIndex] || null }));
    }
  }, [dispatch, hasSubscriptionAdmin, search, sort, pageIndex]);

  useEffect(() => {
    if (next) {
      pageCursors.current[pageIndex + 1] = next;
    }
  }, [next, pageIndex]);

  // The button's own text already names the action, so its leading icon is purely decorative.
  useEffect(() => hideDecorativeIcons('[testid="add-subscriber"]'), []);

  // The selected recipient is read back out of the results so that the details pane shows the
  // edited values as soon as the list holds them.
  const selected = useMemo(
    () => subscribers?.find((subscriber) => subscriber.id === selectedId) || null,
    [subscribers, selectedId],
  );

  const restart = () => {
    pageCursors.current = [null];
    setPageIndex(0);
    setSelectedId(null);
  };

  const onSearch = (value: string) => {
    restart();
    setSearch(value);
  };

  const onReset = () => {
    restart();
    setSearch('');
    setSort(DEFAULT_SUBSCRIBER_SORT);
  };

  const onSort = (value: SubscriberSort) => {
    restart();
    setSort(value);
  };

  if (!hasSubscriptionAdmin) {
    return (
      <GoabCallout type="important" testId="check-role-callout">
        <h3>Access to subscriptions requires admin roles</h3>
        <p>
          You require the <strong>subscription-admin</strong> role to access notifications. Contact your administrator
          if you believe this is an error.
        </p>
      </GoabCallout>
    );
  }

  const isEmpty = indicator.show === false && subscribers && subscribers.length === 0;

  return (
    <section>
      <div data-testid="subscribers-list-title">
        <PageHeader>
          <div>
            <h2>Registered recipients</h2>
            <p>
              Recipients are people or groups registered to receive notifications. Register a recipient so they can be
              subscribed to one or more notification types.
            </p>
          </div>
          <GoabButton
            size="compact"
            leadingIcon="add-circle"
            testId="add-subscriber"
            onClick={() => setIsAddSubscriberOpen(true)}
          >
            Register recipient
          </GoabButton>
        </PageHeader>

        <RecipientSearchForm searchValue={search} onSearch={onSearch} onReset={onReset} />

        <ListHeaderRow>
          <strong data-testid="recipient-total-count">
            {total} {total === 1 ? 'recipient' : 'recipients'}
          </strong>
        </ListHeaderRow>

        {indicator.show && <PageIndicator />}
        {isEmpty && renderNoItem('subscriber')}

        {!isEmpty && (
          <RegistryLayout>
            <div>
              <SubscriberList
                subscribers={subscribers}
                selectedId={selectedId}
                sort={sort}
                onSelect={(subscriber) => setSelectedId(subscriber.id)}
                onSort={onSort}
              />
              <RecipientPagination
                pageIndex={pageIndex}
                pageSize={DEFAULT_PAGE_SIZE}
                shownCount={subscribers?.length || 0}
                total={total}
                hasNext={!!next}
                onPage={(target) => {
                  setSelectedId(null);
                  setPageIndex(target);
                }}
              />
            </div>
            <RecipientDetails
              subscriber={selected}
              onEdit={setEditing}
              onDelete={setDeleting}
              onClose={() => setSelectedId(null)}
            />
          </RegistryLayout>
        )}
      </div>

      <SubscriberModalForm
        open={isAddSubscriberOpen}
        isNew
        initialValue={{ addressAs: '', channels: [] }}
        onSave={(subscriber) => {
          const { id: _id, ...newSubscriber } = subscriber;
          dispatch(CreateSubscriber(newSubscriber));
          setIsAddSubscriberOpen(false);
        }}
        onCancel={() => setIsAddSubscriberOpen(false)}
      />

      <SubscriberModalForm
        open={editing !== null}
        initialValue={editing}
        onSave={(subscriber) => {
          dispatch(UpdateSubscriber(subscriber));
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />

      <DeleteModal
        title="Delete subscriber"
        isOpen={deleting !== null}
        onCancel={() => setDeleting(null)}
        content={
          <div>
            <div>Deletion of the following subscriber will remove all of its related subscriptions.</div>
            <div>Do you still want to continue?</div>
            <b data-testid="delete-subscriber-name">{deleting?.addressAs}</b>
          </div>
        }
        onDelete={() => {
          dispatch(DeleteSubscriber(deleting.id));
          setSelectedId(null);
          setDeleting(null);
        }}
      />
    </section>
  );
};

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-m);

  h2 {
    margin: 0 0 var(--goa-space-xs) 0;
  }

  p {
    margin: 0;
    max-width: 70ch;
  }
`;

const ListHeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
  margin: var(--goa-space-m) 0 var(--goa-space-s) 0;
`;

const RegistryLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: var(--goa-space-l);
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;
