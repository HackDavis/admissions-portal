import { GET as get } from './get';
import authenticated from '@utils/authentication/authenticated';

const GET = authenticated(get);

export { GET };
