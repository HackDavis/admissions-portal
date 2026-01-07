import authenticated from '@utils/authentication/authenticated';
import { POST as post } from './post';
import { GET as get } from './get';

const POST = authenticated(post);
const GET = authenticated(get);

export { POST, GET };
