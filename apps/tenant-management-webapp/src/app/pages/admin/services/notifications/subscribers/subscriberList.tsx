import React, { FunctionComponent } from 'react';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';

export const SubscriberList: FunctionComponent = () => {
  const subscribers = useSelector((state: RootState) => state.subscription.search.subscribers.data);
  if (!subscribers || subscribers.length === 0) {
    return (<></>)
  }

  return (
    <div>
      <DataTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>id</th>
          </tr>
        </thead>
        <tbody>
          {
            subscribers.map((subscriber) => {
              return (
                <tr key={subscriber.id}>
                  <td>{subscriber?.addressAs}</td>
                  <td>{subscriber?.id}</td>
                </tr>
              )
            })
          }
        </tbody>
      </DataTable>
    </div>
  )
}
