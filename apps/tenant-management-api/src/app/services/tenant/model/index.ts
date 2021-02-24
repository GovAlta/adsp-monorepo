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

export async function create(tenant) {
  try {
    const newTenant = new Tenant(tenant);
    const response = await newTenant.save();
    return Promise.resolve({
      success: true,
      id: response._id,
    });
  } catch (e) {
    return Promise.resolve({
      success: false,
      errors: [e],
    });
  }
}

export async function findTenantByName(name: string) {
  try {
    const tenant = await Tenant.findOne({ name: name });
    if (tenant === null) {
      throw 'Not found, Please check tenant name';
    }
    return Promise.resolve({
      success: true,
      tenant: tenant,
    });
  } catch (e) {
    return Promise.resolve({
      success: false,
      errors: [e],
    });
  }
}
