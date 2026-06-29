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
  ): Promise<{ url: string; path: string; imageId?: string; variants?: any }> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF o SVG.');
    }

    // Validate file size (max 5MB)
    if (file.length > 5 * 1024 * 1024) {
      throw new BadRequestException('El archivo no puede superar 5MB.');
    }

    const imageId = crypto.randomUUID();
    const ext = filename.split('.').pop() || 'png';
    
    // Default base upload for the original file
    const originalPath = `tenants/${tenantId}/images/${imageId}/original.${ext}`;

    const { data: originalData, error: originalError } = await this.supabase.storage
      .from('store-assets')
      .upload(originalPath, file, {
        contentType: mimetype,
        upsert: false,
      });

    if (originalError) throw new BadRequestException(`Error subiendo archivo original: ${originalError.message}`);

    const { data: originalUrlData } = this.supabase.storage
      .from('store-assets')
      .getPublicUrl(originalData.path);

    const originalUrl = originalUrlData.publicUrl;

    const variants: Record<string, { url: string; size_bytes: number }> = {
      original: { url: originalUrl, size_bytes: file.length },
    };

    let processingStatus = 'ready';

    // Image variants logic
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150, fit: 'cover' },
      { name: 'small', width: 400, height: 400, fit: 'inside' },
      { name: 'medium', width: 800, height: 800, fit: 'inside' },
      { name: 'large', width: 1600, height: 1600, fit: 'inside' },
    ];

    try {
      // Dynamic import of sharp to avoid compile issues if not present
      const sharp = require('sharp');
      
      for (const size of sizes) {
        const resizedBuffer = await sharp(file)
          .resize(size.width, size.height, { fit: size.fit as any, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        const sizePath = `tenants/${tenantId}/images/${imageId}/${size.name}.webp`;
        
        const { data: sizeData } = await this.supabase.storage
          .from('store-assets')
          .upload(sizePath, resizedBuffer, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (sizeData) {
          const { data: sizeUrlData } = this.supabase.storage
            .from('store-assets')
            .getPublicUrl(sizeData.path);

          variants[size.name] = {
            url: sizeUrlData.publicUrl,
            size_bytes: resizedBuffer.length,
          };
        }
      }
    } catch (e) {
      console.warn('Sharp library not available or failed resizing. Using original file as fallback for variants:', e.message);
      // Fallback: use original url for all variants
      sizes.forEach(size => {
        variants[size.name] = {
          url: originalUrl,
          size_bytes: file.length,
        };
      });
      processingStatus = 'ready'; // fallback is ready to use immediately
    }

    // Insert image metadata in images table
    const { error: dbError } = await this.supabase
      .from('images')
      .insert({
        id: imageId,
        tenant_id: tenantId,
        original_filename: filename,
        mime_type: mimetype,
        size_bytes: file.length,
        variants,
        processing_status: processingStatus,
      });

    if (dbError) {
      console.error('Failed to log image in database:', dbError.message);
    }

    return {
      url: originalUrl,
      path: originalData.path,
      imageId,
      variants,
    };
  }

  async uploadWithFixedPath(
    tenantId: string,
    file: Buffer,
    filename: string,
    mimetype: string,
    folder: string,
    fixedName: string,
  ): Promise<{ url: string; path: string }> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido.');
    }
    if (file.length > 5 * 1024 * 1024) {
      throw new BadRequestException('El archivo no puede superar 5MB.');
    }

    const ext = filename.split('.').pop() || 'png';
    const filePath = `tenants/${tenantId}/${folder}/${fixedName}.${ext}`;

    const { error } = await this.supabase.storage
      .from('store-assets')
      .upload(filePath, file, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) throw new BadRequestException(`Error subiendo archivo: ${error.message}`);

    const { data: urlData } = this.supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  }

  async deleteImage(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('store-assets')
      .remove([path]);

    if (error) console.error('Error deleting image:', error.message);
  }
}
