import { User } from '@abgov/adsp-service-sdk';
import * as hasha from 'hasha';
import fetch from 'node-fetch';
import { ScanService, ServiceUserRoles, FileEntity } from '../file';
import { ScanProps } from './index';

export const createMetaDefenderScan = ({ host, port }: ScanProps): ScanService => {
  const user = { id: 'meta-scan-service', roles: [ServiceUserRoles.Admin] } as User;
  // Hash lookup checks the result.
  const apiUrl = `${host}:${port}`;
  const hashUrl = `${apiUrl}/metascan_rest/hash`;
  const hashLookupRequest = async (file: FileEntity) => {
    const stream = await file.readFile(user);
    const hash = await hasha.fromStream(stream, { algorithm: 'sha1' });

    const lookupResponse = await fetch(`${hashUrl}/${hash}`);
    const result = await lookupResponse.json();
    return result?.scan_results;
  };

  const scanUrl = `${apiUrl}/metascan_rest/file`;

  const scanRequest = async (file: FileEntity) => {
    const fileStream = await file.readFile(user);
    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Length': `${file.size}`,
        filename: file.filename,
        source: `${file.createdBy.name} (ID: ${file.createdBy.id})`,
      },
      body: fileStream,
    });

    const { data_id: scanId } = await scanResponse.json();

    // Wait for a second then check the result.
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    const resultResponse = await fetch(`${scanUrl}/${scanId}`);
    const result = await resultResponse.json();

    return result?.scan_results;
  };

  const service: ScanService = {
    scan: async (file) => {
      let result = await hashLookupRequest(file);
      if (!result) {
        result = await scanRequest(file);
      }

      return {
        scanned: !!result,
        infected: result && result.scan_all_result_i !== 0,
      };
    },
  };

  return service;
};
