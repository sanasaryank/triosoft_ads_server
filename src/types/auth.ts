import type { Translation } from './common';

export interface CurrentUser {
  id: string;
  username: string;
  name: Translation;
}

export interface LoginPayload {
  username: string;
  password: string;
}
