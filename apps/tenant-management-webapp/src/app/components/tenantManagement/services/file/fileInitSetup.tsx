import { GoAButton } from '@abgov/react-components';
import React from 'react';
import { useDispatch } from 'react-redux';
import { SetupFileService } from '../../../../store/file/actions'

const InitSetup = () => {
  const dispatch = useDispatch();

  return (
    <div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
        volutpat odio est, eget faucibus nisl accumsan eu. Ut sit amet elit non
        elit semper varius. Integer nunc felis, tristique at congue ac,
        efficitur sed ante. Phasellus mi nibh, tempus in ultrices id, lacinia
        sit amet nisi. Vestibulum dictum dignissim nibh a accumsan. Vestibulum
        eget egestas diam. Fusce est massa, venenatis a condimentum sed,
        elementum vel diam.
      </p>
      <GoAButton
        content="Setup Service"
        onClick={() => dispatch(SetupFileService())}
      />
    </div>
  );
};

export default InitSetup;
