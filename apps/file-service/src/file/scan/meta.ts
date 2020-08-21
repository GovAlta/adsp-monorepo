import * as fs from 'fs';
import * as hasha from 'hasha';
import fetch from 'node-fetch';
import { ScanService, ScanProps } from '.';
import { FileEntity } from '../model';

export const createMetaDefenderScan = ({
  rootStoragePath,
  host,
  port
}: ScanProps) => {

  const apiUrl = `${host}:${port}`;
  const hashUrl = `${apiUrl}/metascan_rest/hash`;
  const hashLookupRequest = (path: string) => hasha.fromFile(
    path, { algorithm: 'sha1' }
  ).then((hash) => 
    fetch(`${hashUrl}/${hash}`)
    .then(res => 
      res.json()
    )
  ).then((result) => 
    result ? result.scan_results : null
  );

  const scanUrl = `${apiUrl}/metascan_rest/file`;
  const scanRequest = (file: FileEntity, path: string) => {
    
    const fileStream = fs.createReadStream(path);
    return fetch(
      scanUrl, 
      { 
        method: 'POST',
        headers: {
          'Content-Length': `${file.size}`,
          filename: file.filename,
          source: `${file.createdBy.name} (ID: ${file.createdBy.id})`
        },
        body: fileStream 
      }
    )
    .then((res) => 
      res.json()
    ).then(({data_id: scanId}) => 
      new Promise(resolve =>
        setTimeout(() => resolve(scanId), 10000)
      )
    ).then((scanId) => 
      fetch(`${scanUrl}/${scanId}`)
      .then((res) => 
        res.json()
      )
    ).then((result) => 
      result ? result.scan_results : null
    );
  }

  const service: ScanService = {
    scan: (file) => {
      const filePath = file.getFilePath(rootStoragePath);
      return hashLookupRequest(filePath) 
      .then((result) => 
        !result ?
          scanRequest(file, filePath) :
          result
      ).then((result) => 
        ({
          scanned: !!result,
          infected: result && result.scan_all_result_i !== 0
        })
      );
    }
  }

  return service;
}
