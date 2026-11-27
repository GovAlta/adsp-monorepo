import React, { useEffect, useState, type ReactNode } from 'react';
import { GoabCallout, GoabText } from '@abgov/react-components';
import { AdspCapabilityProvider, type AdspCapabilityRoleMap } from '@abgov/adsp-components-react';
import { getAccessToken } from '../../../state';

interface FileTypeRoles {
  updateRoles?: string[];
}

export type FileTypeCapabilities =
  | { status: 'none' }
  | { status: 'loading' }
  // File service didn't say who may upload (missing type, network error): the component explains it itself.
  | { status: 'unknown' }
  | { status: 'resolved'; capabilities: AdspCapabilityRoleMap };

// Reads who may upload to a File Type, so the page can refuse before the user picks a file.
export const useFileTypeCapabilities = (
  fileServiceUrl: string | undefined,
  fileTypeId: string,
): FileTypeCapabilities => {
  // Kept with the File Type it was read for, so one type's roles are never applied to the next.
  const [loaded, setLoaded] = useState<{ fileTypeId: string; result: FileTypeCapabilities }>();

  useEffect(() => {
    if (!fileServiceUrl || !fileTypeId) {
      return;
    }

    let current = true;
    const setResult = (result: FileTypeCapabilities) => setLoaded({ fileTypeId, result });

    const load = async (): Promise<FileTypeCapabilities> => {
      const token = await getAccessToken();
      const response = await fetch(new URL(`/file/v1/types/${encodeURIComponent(fileTypeId)}`, fileServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const type = (await response.json()) as FileTypeRoles;
        return { status: 'resolved', capabilities: { 'file.upload': type.updateRoles ?? [] } };
      }
      // File service refuses a File Type to a user with neither its read nor its update roles.
      if (response.status === 401 || response.status === 403) {
        return { status: 'resolved', capabilities: {} };
      }
      return { status: 'unknown' };
    };

    load()
      .catch((): FileTypeCapabilities => ({ status: 'unknown' }))
      .then((result) => current && setResult(result));

    return () => {
      current = false;
    };
  }, [fileServiceUrl, fileTypeId]);

  if (!fileServiceUrl || !fileTypeId) {
    return { status: 'none' } as const;
  }
  return loaded?.fileTypeId === fileTypeId ? loaded.result : ({ status: 'loading' } as const);
};

export const UploadDenied = ({ testId }: { testId?: string }) => (
  <GoabCallout type="important" size="medium" heading="You can't upload files here" testId={testId}>
    Your account doesn't have a role that permits uploads to this file type. Ask your administrator for access.
  </GoabCallout>
);

interface UploadPermissionProps {
  capabilities: FileTypeCapabilities;
  roles: string[];
  children: ReactNode;
}

// Puts the File Type's upload roles in front of the upload components it wraps.
export const UploadPermission = ({ capabilities, roles, children }: UploadPermissionProps) => {
  if (capabilities.status === 'loading') {
    return <GoabText size="body-s">Checking your upload permission…</GoabText>;
  }
  if (capabilities.status !== 'resolved') {
    return <>{children}</>;
  }
  return (
    <AdspCapabilityProvider roles={roles} capabilities={capabilities.capabilities}>
      {children}
    </AdspCapabilityProvider>
  );
};
