import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'opscoach-storage',
  access: (allow) => ({
    'uploads/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'frames/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  })
});

