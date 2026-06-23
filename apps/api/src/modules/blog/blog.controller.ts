import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() body: any) {
    return this.blog.createPost(req.user.tenant_id, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  list(@Req() req: any) {
    return this.blog.listPosts(req.user.tenant_id);
  }

  @Get('public/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.blog.getPost(slug);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.blog.updatePost(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id') id: string) {
    return this.blog.deletePost(id);
  }
}
