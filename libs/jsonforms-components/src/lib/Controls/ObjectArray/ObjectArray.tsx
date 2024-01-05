import React, { useCallback, useState } from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react';
import { ObjectArrayControl } from './ObjectListControl';
import { Hidden } from '@mui/material';
import { DeleteDialog } from './DeleteDialog';

export const ArrayControl = (props: ArrayLayoutProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(undefined);
  const [rowData, setRowData] = useState(undefined);
  const { removeItems, visible } = props;

  const openDeleteDialog = useCallback(
    (p: string, rowIndex: number) => {
      setOpen(true);
      setPath(p);
      setRowData(rowIndex);
    },
    [setOpen, setPath, setRowData]
  );
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);
  const deleteConfirm = useCallback(() => {
    const p = path.substring(0, path.lastIndexOf('.'));
    removeItems(p, [rowData])();
    setOpen(false);
  }, [setOpen, path, rowData]);

  return (
    <Hidden xsUp={!visible}>
      <ObjectArrayControl {...props} openDeleteDialog={openDeleteDialog} />
      <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        title={props.translations.deleteDialogTitle}
        message={props.translations.deleteDialogMessage}
      />
    </Hidden>
  );
};

export const ArrayControlTester: RankedTester = rankWith(3, or(isObjectArrayControl, isPrimitiveArrayControl));
export const ArrayControlRenderer = withJsonFormsArrayLayoutProps(ArrayControl);
