import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Provide,
  Query,
  ALL,
  Put,
  Param,
  Del,
} from '@midwayjs/decorator';
import { MenuDTO } from '../dto/menu.dto';
import { MenuService } from '../service/menu.service';
import { R } from '@/common/base.error';

@Provide()
@Controller('/menu')
export class MenuController {
  @Inject()
  menuService: MenuService;

  @Post('/', { description: '新建' })
  async create(@Body(ALL) data: MenuDTO) {
    return await this.menuService.createMenu(data);
  }

  @Put('/', { description: '编辑' })
  async edit(@Body(ALL) data: MenuDTO) {
    const menu = await this.menuService.getById(data.id);
    // update
    return await this.menuService.edit(menu);
  }

  @Del('/:id', { description: '删除' })
  async remove(@Param('id') id: string) {
    const menu = await this.menuService.getById(id);
    if (!menu) {
      throw R.error('删除失败，菜单不存在');
    }
    await this.menuService.removeMenu(menu.id);
  }

  @Get('/:id', { description: '根据id查询' })
  async getById(@Param('id') id: string) {
    return await this.menuService.getById(id);
  }

  @Get('/page', { description: '分页查询' })
  async page(@Query('page') page: number, @Query('size') size: number) {
    return await this.menuService.page(page, size);
  }

  @Get('/list', { description: '查询全部' })
  async list() {
    return await this.menuService.list();
  }

  @Get('/children', { description: '获取子级菜单' })
  async getChildren(@Query('parentId') parentId: string) {
    return await this.menuService.getChildren(parentId);
  }
}
