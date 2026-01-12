import { POST as post } from './post';
import { GET as get } from './get';
import { PATCH as patch } from './patch';
import authenticated from '@utils/authentication/authenticated';

const POST = post;
const GET = authenticated(get);
const PATCH = authenticated(patch);

export { POST, GET, PATCH };
