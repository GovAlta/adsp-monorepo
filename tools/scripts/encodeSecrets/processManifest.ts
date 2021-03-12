// This script in-place replaces secret data with base64 encoded value.
import { Base64 } from 'js-base64';

const SECRET = 'Secret';
const LIST = 'List';

interface OcResource {
  kind: string
}

interface Secret extends OcResource {
  kind: typeof SECRET
  data: Record<string, string>
}

interface List extends OcResource {
  kind: typeof LIST
  items: Resource[]
}

type Resource = Secret | List | OcResource;

const isSecret = (value: Resource): value is Secret => {
  return value.kind && value.kind === SECRET;
}

const isList = (value: Resource): value is List => {
  return value.kind && value.kind === LIST;
}

const encodeSecretData = (item: Secret) => {
  let updated = false;
  if (item.data) {
    Object.keys(item.data).forEach((key) => {
      if (item.data[key]) {
        item.data[key] = Base64.encode(item.data[key]);
        updated = true;
      }
    });
  }
  return updated;
};

export const processManifest = <T extends OcResource>(manifest: T): T => {

  let result = null;
  if (isSecret(manifest)) {
    if (encodeSecretData(manifest)) {
      result = manifest;
    }
  } else if (isList(manifest)) {
    let updated = false;
    manifest.items.forEach(
      (item) => {
        if (isSecret(item)) {
          updated = encodeSecretData(item) || updated;
        }
      }
    );

    if (updated) {
      result = manifest;
    }
  }

  return result;
};
