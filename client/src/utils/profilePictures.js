import { supabase } from './supabase';

export const PROFILE_PICTURE_BUCKET = 'profile-pictures';
export const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PROFILE_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const isAllowedProfilePictureFile = (file) => {
  if (!file) return { ok: false, reason: 'No file selected' };
  if (!ALLOWED_PROFILE_PICTURE_TYPES.includes(file.type)) {
    return { ok: false, reason: 'Use JPG, PNG, WEBP, or GIF' };
  }
  if (file.size > MAX_PROFILE_PICTURE_BYTES) {
    return { ok: false, reason: 'Image must be 2MB or smaller' };
  }
  return { ok: true };
};

export const getPublicStorageUrl = (path) => {
  if (!path || !supabase) return null;
  const { data } = supabase.storage.from(PROFILE_PICTURE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
};
