import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BlogService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async createPost(tenantId: string, dto: { title: string; slug: string; content: string; excerpt?: string; cover_image?: string; status?: string }) {
    const { data, error } = await this.supabase
      .from('blog_posts')
      .insert({ tenant_id: tenantId, ...dto, status: dto.status || 'draft' })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listPosts(tenantId: string, status?: string) {
    let query = this.supabase.from('blog_posts').select('*').eq('tenant_id', tenantId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getPost(slug: string) {
    const { data, error } = await this.supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    if (error || !data) throw new NotFoundException('Post not found');
    return data;
  }

  async updatePost(id: string, dto: Partial<{ title: string; content: string; excerpt?: string; cover_image?: string; status?: string }>) {
    const { data, error } = await this.supabase
      .from('blog_posts')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Post not found');
    return data;
  }

  async deletePost(id: string) {
    const { error } = await this.supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Post deleted' };
  }
}
