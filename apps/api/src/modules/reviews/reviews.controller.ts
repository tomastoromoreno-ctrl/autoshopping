import {
  Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Req, BadRequestException,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreateReviewDto {
  @IsString()
  product_id: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  order_id?: string;
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    if (!userId) throw new BadRequestException('No user associated');
    return this.reviews.create({ ...dto, tenant_id: tenantId, user_id: userId });
  }

  @Get('product/:productId')
  listByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviews.listByProduct(productId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('stats/:productId')
  getStats(@Param('productId') productId: string) {
    return this.reviews.getStats(productId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('No user associated');
    return this.reviews.delete(id, userId);
  }
}
