import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async create(dto: {
    tenant_id: string;
    product_id: string;
    user_id: string;
    order_id?: string;
    rating: number;
    title?: string;
    comment?: string;
  }) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const existing = await this.supabase
      .from('reviews')
      .select('id')
      .eq('product_id', dto.product_id)
      .eq('user_id', dto.user_id)
      .single();

    if (existing.data) {
      throw new BadRequestException('Ya has reseñado este producto');
    }

    let isVerified = false;
    if (dto.order_id) {
      const { data: order } = await this.supabase
        .from('orders')
        .select('id, status')
        .eq('id', dto.order_id)
        .eq('tenant_id', dto.tenant_id)
        .eq('customer_email', (await this.supabase.from('users').select('email').eq('id', dto.user_id).single()).data?.email || '')
        .single();

      if (order?.status === 'delivered') {
        isVerified = true;
      }
    }

    const { data, error } = await this.supabase
      .from('reviews')
      .insert({
        tenant_id: dto.tenant_id,
        product_id: dto.product_id,
        user_id: dto.user_id,
        order_id: dto.order_id || null,
        rating: dto.rating,
        title: dto.title || null,
        comment: dto.comment || null,
        is_verified: isVerified,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new BadRequestException('Ya has reseñado este producto');
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async listByProduct(productId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('reviews')
      .select(`
        *,
        users:user_id (name, avatar_url)
      `, { count: 'exact' })
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    const { data: stats } = await this.supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_active', true);

    const ratings = (stats || []).map((r: any) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: ratings.filter((r: number) => r === star).length,
    }));

    return {
      data: data || [],
      total: count,
      stats: {
        average: Math.round(avgRating * 10) / 10,
        total: ratings.length,
        distribution,
      },
      page,
      limit,
    };
  }

  async delete(id: string, userId: string) {
    const { data: review, error: findError } = await this.supabase
      .from('reviews')
      .select('user_id')
      .eq('id', id)
      .single();

    if (findError || !review) throw new NotFoundException('Review not found');
    if (review.user_id !== userId) throw new ForbiddenException('No puedes eliminar esta reseña');

    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Reseña eliminada' };
  }

  async getStats(productId: string) {
    const { data } = await this.supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_active', true);

    const ratings = (data || []).map((r: any) => r.rating);
    const avg = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

    return {
      average: Math.round(avg * 10) / 10,
      total: ratings.length,
      distribution: [1, 2, 3, 4, 5].map((star) => ({
        star,
        count: ratings.filter((r: number) => r === star).length,
      })),
    };
  }
}
