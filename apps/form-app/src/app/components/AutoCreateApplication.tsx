import React, { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, Form as FormObject, busySelector, createForm, findUserForm } from '../state';
import { useDispatch, useSelector } from 'react-redux';

interface AutoCreateApplicationProps {
  form: FormObject;
}

/**
 * This is a pass through component that automatically creates the form and then
 * redirects the user to the draft form
 */
export const AutoCreateApplication: FunctionComponent<AutoCreateApplicationProps> = ({ form }) => {
  const dispatch = useDispatch<AppDispatch>();
  const busy = useSelector(busySelector);
  const { definitionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function create() {
      if (!form && !busy.creating) {
        const { payload } = await dispatch(createForm(definitionId));
        const form = payload as FormObject;
        if (form?.id) {
          navigate(`${form.id}`);
        }
      }
    }
    create();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(findUserForm(definitionId));
  }, [form, dispatch, definitionId]);

  return null;
};
