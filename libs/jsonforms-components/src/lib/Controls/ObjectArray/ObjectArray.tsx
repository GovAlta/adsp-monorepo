import React, { useCallback, useState } from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  uiTypeIs,
  and,
  ControlProps,
  WithClassname,
} from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps, withTranslateProps, withJsonFormsControlProps } from '@jsonforms/react';
import { ObjectArrayControl } from './ObjectListControl';
import { DeleteDialog } from './DeleteDialog';
import { Visible } from '../../util';
import { EventControlProps } from '../Inputs/type';
import { constant } from 'lodash';

// interface CombinedProps extends ArrayLayoutProps {
//   controlProps: ControlProps;
// }

export type CombinedProps = ControlProps & WithClassname & ArrayLayoutProps;

export const ArrayControl = (props: CombinedProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string>();
  const [rowData, setRowData] = useState<number>(0);
  const { removeItems, visible, handleChange } = props;
  //const { removeItems, visible, controlProps } = props;

  // const openDeleteDialog = useCallback(
  //   (rowIndex: number, name: string) => {
  //     setOpen(true);
  //     console.log(JSON.stringify(name) + '<>.....name');
  //     setPath(name);
  //     console.log(JSON.stringify(rowIndex) + '<>.....rowIdex');
  //     setRowData(rowIndex);
  //   },
  //   [setOpen, setPath, setRowData]
  // );
  // const deleteCancel = useCallback(() => setOpen(false), [setOpen]);

  // // eslint-disable-next-line
  // const deleteConfirm = useCallback(() => {
  //   // const p = path?.substring(0, path.lastIndexOf('.'));
  //   console.log(JSON.stringify(path) + '>path--');
  //   if (removeItems && path) {
  //     removeItems(path || '', [rowData])();
  //   }
  //   setOpen(false);
  //   // eslint-disable-next-line
  // }, [setOpen, path, rowData]);

  // const addItemY = (a, b): any => {
  //   console.log(JSON.stringify(a) + '<--aaaaaaaaaaaaaaaaaaaaaa');
  //   // console.log(JSON.stringify(b) + '<--bbbbbbbbbbbbbbb');

  //   return props.addItem(a, b);
  // };

  console.log('do we loop 2');

  return (
    <Visible visible={visible}>
      {JSON.stringify(props, null, 2)}
      kkkkkkkkkkkkkk
      {/* <ObjectArrayControl
        {...props}
        handleChange={handleChange}
        addItem={addItemY}
        openDeleteDialog={openDeleteDialog}
      /> */}
      llllllllll
      {/* <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        title={props.translations.deleteDialogTitle || ''}
        message={props.translations.deleteDialogMessage || ''}
      /> */}
    </Visible>
  );
};
//interface CombinedProps extends Omit<ArrayLayoutProps, 'data'>, ControlProps {}

export const ArrayBaseReviewControl = (props: CombinedProps) => {
  const { visible, handleChange } = props;

  console.log('do we loop');

  return (
    <Visible visible={visible}>
      gggggggg
      <ObjectArrayControl
        {...props}
        handleChange={handleChange}
        openDeleteDialog={() => {}}
        isStepperReview={true}
        enabled={true}
      />
    </Visible>
  );
};

export interface WithInputXX {
  //eslint-disable-next-line
  input: any;
}

export const GoAArrayControlTester: RankedTester = rankWith(3, or(isObjectArrayControl, isPrimitiveArrayControl));

// export const InputBaseControl = (props: ControlProps & ArrayLayoutProps): JSX.Element => {
//   const { uischema, visible, label, required, errors, path, removeItems } = props;
//   //const InnerComponent = input;

//   // const addItemX = (a, b): any => {
//   //   console.log(JSON.stringify(a) + '<--aaa');
//   //   console.log(JSON.stringify(b) + '<--bbb');

//   //   return props.addItem(a, b);
//   // };

//   return (
//     <div>
//       --------x-
//       {JSON.stringify(props)}
//       -------------------------- --x--------
//       <InnerComponent {...props} />
//       XXXXXXXXXXXXXXXXXXXXXX
//     </div>
//   );
// };

export const ArrayControlX = (props: ControlProps) => {
  const { data } = props;

  const addItemX = (a, b): any => {
    console.log(JSON.stringify(a) + '<--aaa');
    console.log(JSON.stringify(b) + '<--bbb');
    console.log(JSON.stringify(data) + '<--data');
    //data = data + 1;

    return () => {};
  };

  return (
    <div>
      <ArrayControl
        {...props} //   translations={{}}
        addItem={addItemX}
        translations={{}}
      />
    </div>
    // <InputBaseControl
    //   translations={{}}
    //   addItem={function (path: string, value: any): () => void {
    //     console.log(JSON.stringify(path) + '<----path');
    //     console.log(JSON.stringify(value) + '<----value');
    //     return () => {};
    //   }}
    //   // data={data}
    //   {...props}
    //   input={ArrayControl}
    // />
  );
};

export const ArrayControlY = (props: ControlProps) => {
  const addItemX = (a, b): any => {
    console.log(JSON.stringify(a) + '<--aaa');
    console.log(JSON.stringify(b) + '<--bbb');
    // console.log(JSON.stringify(data) + '<--data');
    //data = data + 1;

    return () => {};
  };

  return (
    <div>ddfdf</div>
    // <InputBaseControl
    //   translations={{}}
    //   addItem={function (path: string, value: any): () => void {
    //     console.log(JSON.stringify(path) + '<----path');
    //     console.log(JSON.stringify(value) + '<----value');
    //     return () => {};
    //   }}
    //   // data={data}
    //   {...props}
    //   input={ArrayControl}
    // />
  );
};

//export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);

export const GoAArrayControlRenderer = withJsonFormsControlProps(ArrayControlX);
export const GoAArrayControlReviewRenderer = withJsonFormsControlProps(ArrayControlY);
//export const GoAArrayControlReviewRendererX = withJsonFormsControlProps(ArrayControlX);
