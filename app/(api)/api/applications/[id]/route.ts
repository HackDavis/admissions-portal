import authenticated from '@utils/authentication/authenticated';
import { PUT as put } from './put';
import { GET as get } from './get';
import { DELETE as del } from './delete';

const PUT = authenticated(put);
const GET = authenticated(get);
const DELETE = authenticated(del);

export { PUT, GET, DELETE };
