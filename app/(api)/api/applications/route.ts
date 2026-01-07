import { POST as post } from './post';
import { GET as get } from './get';
import authenticated from '@utils/authentication/authenticated';

const POST = post;
const GET = authenticated(get);

export { POST, GET };
