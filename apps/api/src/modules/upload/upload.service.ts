import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async uploadImage(
    tenantId: string,
    file: Buffer,
    filename: string,
    mimetype: string,
    folder: string = 'uploads',
  ): Promise<{ url: string; path: string }> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF o SVG.');
    }

    // Validate file size (max 5MB)
    if (file.length > 5 * 1024 * 1024) {
      throw new BadRequestException('El archivo no puede superar 5MB.');
    }

    // Generate unique filename
    const ext = filename.split('.').pop() || 'png';
    const uniqueName = `${tenantId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
      .from('store-assets')
      .upload(uniqueName, file, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) throw new BadRequestException(`Error subiendo archivo: ${error.message}`);

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('store-assets')
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  }

  async deleteImage(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('store-assets')
      .remove([path]);

    if (error) console.error('Error deleting image:', error.message);
  }
}
