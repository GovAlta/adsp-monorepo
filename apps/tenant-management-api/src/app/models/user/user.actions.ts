import * as UserModel from './user';

interface CreateUserResponse {
  success: boolean;
  id?: string;
  errors?: [string];
}

interface FetchUserByEmailResponse {
  user?: UserModel.User;
  success: boolean;
  errors?: [string];
}

interface DeleteUserByEmailResponse {
  success: boolean;
  errors?: [string];
}

interface AddAdminTenantResponse {
  success: boolean;
  errors?: [string];
}

export async function create(user) {
  try {
    const newUser = new UserModel.User(user);
    await newUser.save();
    return Promise.resolve({
      success: true,
      id: newUser._id,
    });
  } catch (e) {
    console.error(e);
    const response: CreateUserResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

export async function findUserByEmail(email) {
  try {
    const user = await UserModel.User.findOne({ email: email });

    if (user === null) {
      throw Error('Not found');
    }
    const response: FetchUserByEmailResponse = {
      success: true,
      user: user,
    };
    return Promise.resolve(response);
  } catch (e) {
    console.log(e);
    const response: FetchUserByEmailResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}

export async function deleteUserByEmail(email) {
  try {
    await UserModel.User.deleteOne({ email: email });
    const response: DeleteUserByEmailResponse = {
      success: true,
    };
    return Promise.resolve(response);
  } catch (e) {
    console.error(e);
    const response: DeleteUserByEmailResponse = {
      success: false,
      errors: [e],
    };
    return Promise.resolve(response);
  }
}
