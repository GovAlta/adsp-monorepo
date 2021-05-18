import { Document, Model, model, Schema } from 'mongoose';

const INITIAL_REALM = 'core';

const tenantSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    version: {
      type: String,
      default: 'v1',
    },
    realm: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminEmail: {
      type: String,
      required: true,
    },
    tokenIssuer: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export interface Tenant extends Document {
  _id: string;
  name: string;
  realm: string;
  tokenIssuer: string;
  createdBy: string;
}

export const Tenant: Model<Tenant> = model('Tenant', tenantSchema);

interface CreateTenantResponse {
  success: boolean;
  errors?: Array<string>;
  id?: string;
}

export async function create(tenant) {
  try {
    tenant.tokenIssuer = tenant.tokenIssuer.replace(INITIAL_REALM, tenant.realm);
    const newTenant = new Tenant(tenant);
    const _tenant = await newTenant.save();
    const response: CreateTenantResponse = {
      success: true,
      id: _tenant._id,
    };
    return Promise.resolve(response);
  } catch (e) {
    const response: CreateTenantResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

interface FetchTenantResponse {
  success: boolean;
  errors?: Array<string>;
  tenant?: Tenant;
}

interface DeleteTenantResponse {
  success: boolean;
  errors?: Array<string>;
}

interface ValidateIssuerResponse {
  success: boolean;
  isValid?: boolean;
  errors?: Array<string>;
}

interface FetchIssuersResponse {
  success: boolean;
  issuers?: Array<string>;
  errors?: Array<string>;
}

interface FetchNameRealmMappingResponse {
  success: boolean;
  realmToNameMapping?: Record<string, string>;
  errors?: Array<string>;
}

export async function deleteTenantByName(name: string) {
  try {
    await Tenant.deleteOne({ name: name });
    const response: DeleteTenantResponse = {
      success: true,
    };

    return Promise.resolve(response);
  } catch (e) {
    console.error(e);
    const response: DeleteTenantResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

export async function deleteTenantByRealm(realm: string) {
  try {
    await Tenant.deleteOne({ realm: realm });
    const response: DeleteTenantResponse = {
      success: true,
    };

    return Promise.resolve(response);
  } catch (e) {
    console.error(e);
    const response: DeleteTenantResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

export async function findTenantByName(name: string) {
  try {
    const tenant = await Tenant.findOne({ name: name });
    if (tenant === null) {
      throw 'Not found, Please check tenant name';
    }

    const response: FetchTenantResponse = {
      success: true,
      tenant: tenant,
    };

    return Promise.resolve(response);
  } catch (e) {
    const response: FetchTenantResponse = {
      success: false,
      errors: [e],
    };

    return Promise.resolve(response);
  }
}

export async function findTenantByEmail(email: string) {
  try {
    const tenant = await Tenant.findOne({ adminEmail: email }).populate('createdBy');
    if (tenant === null) {
      throw 'Not found, Please check admin name';
    }

    const response: FetchTenantResponse = {
      success: true,
      tenant: tenant,
    };

    return Promise.resolve(response);
  } catch (e) {
    const response: FetchTenantResponse = {
      success: false,
      errors: [e],
    };

    return Promise.resolve(response);
  }
}

export async function findTenantByRealm(realm: string) {
  try {
    const tenant = await Tenant.findOne({ realm: realm }).populate('createdBy');
    if (tenant === null) {
      throw 'Not found, Please check realm name';
    }

    const response: FetchTenantResponse = {
      success: true,
      tenant: tenant,
    };

    return Promise.resolve(response);
  } catch (e) {
    const response: FetchTenantResponse = {
      success: false,
      errors: [e],
    };

    return Promise.resolve(response);
  }
}

export async function validateTenantIssuer(issuer: string) {
  try {
    const isValid = await Tenant.exists({ tokenIssuer: issuer });
    const response: ValidateIssuerResponse = {
      success: true,
      isValid: isValid,
    };

    return Promise.resolve(response);
  } catch (e) {
    const response: ValidateIssuerResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

export async function fetchIssuers() {
  try {
    const issuerObjs = await Tenant.find().select('tokenIssuer');

    const response: FetchIssuersResponse = {
      success: true,
      issuers: issuerObjs
        .map((issuerObj) => issuerObj.tokenIssuer)
        .filter((tokenIssuer) => {
          return tokenIssuer !== undefined;
        }),
    };

    return Promise.resolve(response);
  } catch (e) {
    const response: FetchIssuersResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

export async function fetchRealmToNameMapping() {
  try {
    const tenants = await Tenant.find();
    const mapping = {};
    for (const tenant of tenants) {
      mapping[tenant.realm] = tenant.name;
    }

    const response: FetchNameRealmMappingResponse = {
      success: true,
      realmToNameMapping: mapping,
    };

    return Promise.resolve(response);
  } catch (e) {
    const response: FetchNameRealmMappingResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}
