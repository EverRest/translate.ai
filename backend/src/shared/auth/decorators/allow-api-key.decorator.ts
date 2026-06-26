import { SetMetadata } from '@nestjs/common';

export const ALLOW_API_KEY = 'allowApiKey';

/** Routes callable with a project API key (`Authorization: Bearer ta_live_...`). */
export const AllowApiKey = () => SetMetadata(ALLOW_API_KEY, true);
