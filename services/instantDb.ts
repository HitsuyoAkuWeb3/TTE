import { init } from '@instantdb/react';

// Use the same APP_ID from your .env
const APP_ID = '4c1efd0e-e1de-4326-bf79-3135db5cdeef';

export const db = init({ appId: APP_ID });
