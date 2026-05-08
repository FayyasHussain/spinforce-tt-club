import { supabase } from '../lib/supabase.js';

const MEMBER_MEDIA_BUCKET = 'member-media';

function getMediaType(file) {
  if (file.type.startsWith('image/')) {
    return 0;
  }

  if (file.type.startsWith('video/')) {
    return 1;
  }

  throw new Error('Upload an image or video file.');
}

function safeFileName(fileName) {
  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${baseName || 'media'}-${Date.now()}${extension ? `.${extension.toLowerCase()}` : ''}`;
}

export async function listSkillMedia(progressIds) {
  if (!progressIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('member_skill_media')
    .select(`
      id,
      progress_id,
      media_id,
      profile_id,
      caption,
      practice_date,
      created_at,
      media:media_id (
        id,
        type,
        storage_bucket,
        storage_path,
        thumbnail_path,
        title,
        description,
        created_at
      )
    `)
    .in('progress_id', progressIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const signedRows = await Promise.all(rows.map(async (row) => {
    if (!row.media?.storage_path) {
      return { ...row, signedUrl: null };
    }

    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(row.media.storage_bucket || MEMBER_MEDIA_BUCKET)
      .createSignedUrl(row.media.storage_path, 60 * 30);

    if (signedError) {
      return { ...row, signedUrl: null, signedUrlError: signedError.message };
    }

    return { ...row, signedUrl: signedData.signedUrl };
  }));

  return signedRows;
}

export async function uploadSkillMedia({ profileId, progressId, skillId, file, caption }) {
  const type = getMediaType(file);
  const storagePath = `skills/${profileId}/${skillId}/${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase
    .storage
    .from(MEMBER_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: media, error: mediaError } = await supabase
    .from('media')
    .insert({
      profile_id: profileId,
      type,
      storage_bucket: MEMBER_MEDIA_BUCKET,
      storage_path: storagePath,
      title: file.name,
      description: caption || null,
      metadata: {
        size: file.size,
        mime_type: file.type,
        source: 'skill_ladder',
      },
    })
    .select('id, type, storage_bucket, storage_path, title, description, created_at')
    .single();

  if (mediaError) {
    await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([storagePath]);
    throw mediaError;
  }

  const { data: link, error: linkError } = await supabase
    .from('member_skill_media')
    .insert({
      progress_id: progressId,
      media_id: media.id,
      profile_id: profileId,
      caption: caption || null,
      practice_date: new Date().toISOString().slice(0, 10),
    })
    .select('id, progress_id, media_id, profile_id, caption, practice_date, created_at')
    .single();

  if (linkError) {
    await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([storagePath]);
    await supabase.from('media').delete().eq('id', media.id);
    throw linkError;
  }

  const { data: signedData, error: signedError } = await supabase
    .storage
    .from(MEMBER_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 60 * 30);

  return {
    ...link,
    media,
    signedUrl: signedError ? null : signedData.signedUrl,
    signedUrlError: signedError?.message,
  };
}

export async function updateSkillMediaCaption({ mediaItem, caption }) {
  const nextCaption = caption || null;

  const { data: link, error: linkError } = await supabase
    .from('member_skill_media')
    .update({ caption: nextCaption })
    .eq('id', mediaItem.id)
    .select('id, progress_id, media_id, profile_id, caption, practice_date, created_at')
    .single();

  if (linkError) {
    throw linkError;
  }

  const { data: media, error: mediaError } = await supabase
    .from('media')
    .update({ description: nextCaption })
    .eq('id', mediaItem.media_id)
    .select('id, type, storage_bucket, storage_path, thumbnail_path, title, description, created_at')
    .single();

  if (mediaError) {
    throw mediaError;
  }

  return {
    ...mediaItem,
    ...link,
    media,
  };
}

export async function deleteSkillMedia(mediaItem) {
  const storageBucket = mediaItem.media?.storage_bucket || MEMBER_MEDIA_BUCKET;
  const storagePath = mediaItem.media?.storage_path;

  if (storagePath) {
    const { error: storageError } = await supabase
      .storage
      .from(storageBucket)
      .remove([storagePath]);

    if (storageError) {
      throw storageError;
    }
  }

  const { error: linkError } = await supabase
    .from('member_skill_media')
    .delete()
    .eq('id', mediaItem.id);

  if (linkError) {
    throw linkError;
  }

  const { error: mediaError } = await supabase
    .from('media')
    .delete()
    .eq('id', mediaItem.media_id);

  if (mediaError) {
    throw mediaError;
  }

  return mediaItem.id;
}
