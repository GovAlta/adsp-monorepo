import { Document, Model, model, Schema } from 'mongoose';

const tenantSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  realm: {
    type: String,
    required: true,
  },
});

interface Tenant extends Document {
  _id: string;
  name: string;
  realm: string;
}

const Tenant: Model<Tenant> = model('Tenant', tenantSchema);

interface CreateTenantResponse {
  success: boolean;
  errors?: Array<string>;
  id?: string;
}

export async function create(tenant) {
  try {
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
