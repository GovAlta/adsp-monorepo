import { createCommand } from 'commander';
import { yup } from '@strapi/utils';
import _ from 'lodash';
import inquirer from 'inquirer';
import { compileStrapi, createStrapi } from '@strapi/core';
import { runAction } from '../../utils/helpers.mjs';

const emailValidator = yup.string().email('Invalid email address').lowercase();
const passwordValidator = yup.string().min(8, 'Password must be at least 8 characters long').matches(/[a-z]/, 'Password must contain at least one lowercase character').matches(/[A-Z]/, 'Password must contain at least one uppercase character').matches(/\d/, 'Password must contain at least one number');
const adminCreateSchema = yup.object().shape({
    email: emailValidator,
    password: passwordValidator,
    firstname: yup.string().trim().required('First name is required'),
    lastname: yup.string()
});
/**
 * It's not an observable, in reality this is
 * `ReadOnlyArray<inquirer.DistinctQuestion<Answers>>`
 * but then the logic of the validate function needs to change.
 */ // eslint-disable-next-line rxjs/finnish
const promptQuestions = [
    {
        type: 'input',
        name: 'email',
        message: 'Admin email?',
        async validate (value) {
            const validEmail = await emailValidator.validate(value);
            return validEmail === value || validEmail;
        }
    },
    {
        type: 'password',
        name: 'password',
        message: 'Admin password?',
        async validate (value) {
            const validPassword = await passwordValidator.validate(value);
            return validPassword === value || validPassword;
        }
    },
    {
        type: 'input',
        name: 'firstname',
        message: 'First name?'
    },
    {
        type: 'input',
        name: 'lastname',
        message: 'Last name?'
    },
    {
        type: 'confirm',
        name: 'confirm',
        message: 'Do you really want to create a new admin?'
    }
];
async function createAdmin({ email, password, firstname, lastname }) {
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();
    const user = await app.admin.services.user.exists({
        email
    });
    if (user) {
        console.error(`User with email "${email}" already exists`);
        process.exit(1);
    }
    const superAdminRole = await app.admin.services.role.getSuperAdmin();
    await app.admin.services.user.create({
        email,
        firstname,
        lastname,
        isActive: true,
        roles: [
            superAdminRole.id
        ],
        ...password && {
            password,
            registrationToken: null
        }
    });
    console.log(`Successfully created new admin`);
    process.exit(0);
}
/**
 * Create new admin user
 */ const action = async (cmdOptions = {})=>{
    let { email, password, firstname, lastname } = cmdOptions;
    if (_.isEmpty(email) && _.isEmpty(password) && _.isEmpty(firstname) && _.isEmpty(lastname) && process.stdin.isTTY) {
        const inquiry = await inquirer.prompt(promptQuestions);
        if (!inquiry.confirm) {
            process.exit(0);
        }
        ({ email, password, firstname, lastname } = inquiry);
    }
    try {
        await adminCreateSchema.validate({
            email,
            password,
            firstname,
            lastname
        });
    } catch (err) {
        if (err instanceof yup.ValidationError) {
            console.error(err.errors[0]);
        }
        process.exit(1);
    }
    return createAdmin({
        email,
        password,
        firstname,
        lastname
    });
};
/**
 * `$ strapi admin:create-user`
 */ const command = ()=>{
    return createCommand('admin:create-user').alias('admin:create').description('Create a new admin').option('-e, --email <email>', 'Email of the new admin').option('-p, --password <password>', 'Password of the new admin').option('-f, --firstname <first name>', 'First name of the new admin').option('-l, --lastname <last name>', 'Last name of the new admin').action(runAction('admin:create-user', action));
};

export { action, command };
//# sourceMappingURL=create-user.mjs.map
