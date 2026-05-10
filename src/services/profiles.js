import { supabase } from '../lib/supabase.js';

const MEMBER_MEDIA_BUCKET = 'member-media';
const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

function safeFileName(fileName) {
  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${baseName || 'profile-photo'}-${Date.now()}${extension ? `.${extension.toLowerCase()}` : ''}`;
}

export async function getUserProfile(authUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      mobile,
      address,
      skill_level,
      auth_user_id,
      date_of_birth,
      profile_photo_media_id,
      emergency_contact_name,
      emergency_contact,
      parent_guardian_name
    `)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.profile_photo_media_id) {
    return data;
  }

  const { data: media } = await supabase
    .from('media')
    .select('id, storage_bucket, storage_path')
    .eq('id', data.profile_photo_media_id)
    .maybeSingle();

  if (!media?.storage_path) {
    return { ...data, profile_photo_url: null };
  }

  const { data: signedData, error: signedError } = await supabase
    .storage
    .from(media.storage_bucket || MEMBER_MEDIA_BUCKET)
    .createSignedUrl(media.storage_path, 60 * 30);

  if (signedError) {
    return { ...data, profile_photo_url: null };
  }

  return { ...data, profile_photo_url: signedData.signedUrl };
}

export async function listPlayers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, skill_level')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateMemberProfile({ profileId, address, dateOfBirth, emergencyContactName, emergencyContact, profilePhotoFile }) {
  const updatePayload = {
    address: address || null,
    date_of_birth: dateOfBirth || null,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact: emergencyContact || null,
  };

  let uploadedStoragePath = '';
  let createdMediaId = null;

  if (profilePhotoFile) {
    if (!profilePhotoFile.type.startsWith('image/')) {
      throw new Error('Upload an image file for the profile photo.');
    }

    if (profilePhotoFile.size > PROFILE_PHOTO_MAX_BYTES) {
      throw new Error('Profile photo must be 2 MB or smaller.');
    }

    uploadedStoragePath = `profiles/${profileId}/${safeFileName(profilePhotoFile.name)}`;

    const { error: uploadError } = await supabase
      .storage
      .from(MEMBER_MEDIA_BUCKET)
      .upload(uploadedStoragePath, profilePhotoFile, {
        cacheControl: '3600',
        contentType: profilePhotoFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({
        profile_id: profileId,
        type: 0,
        storage_bucket: MEMBER_MEDIA_BUCKET,
        storage_path: uploadedStoragePath,
        title: profilePhotoFile.name,
        metadata: {
          size: profilePhotoFile.size,
          mime_type: profilePhotoFile.type,
          source: 'profile_photo',
        },
      })
      .select('id')
      .single();

    if (mediaError) {
      await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([uploadedStoragePath]);
      throw mediaError;
    }

    createdMediaId = media.id;
    updatePayload.profile_photo_media_id = createdMediaId;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', profileId);

  if (error) {
    if (uploadedStoragePath) {
      await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([uploadedStoragePath]);
    }

    if (createdMediaId) {
      await supabase.from('media').delete().eq('id', createdMediaId);
    }

    throw error;
  }
}

export async function listLeaderboard() {
  const { data, error } = await supabase
    .from('player_rankings')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
