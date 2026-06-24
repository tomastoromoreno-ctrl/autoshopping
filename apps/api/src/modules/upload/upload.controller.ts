import {
  Controller, Post, Delete, Param, Body, UseGuards, Req, BadRequestException,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadImage(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    if (!file) throw new BadRequestException('No se proporcionó archivo');

    const result = await this.upload.uploadImage(
      tenantId,
      file.buffer,
      file.originalname,
      file.mimetype,
      folder || 'uploads',
    );

    return result;
  }

  @Delete('image/:path')
  @UseGuards(AuthGuard)
  async deleteImage(@Param('path') path: string) {
    await this.upload.deleteImage(path);
    return { message: 'Imagen eliminada' };
  }
}
