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
import { RoleDTO } from '../dto/role.dto';
import { RoleService } from '../service/role.service';

@Provide()
@Controller('/role')
export class RoleController {
  @Inject()
  roleService: RoleService;

  @Post('/', { description: '新建' })
  async create(@Body(ALL) data: RoleDTO) {
    return await this.roleService.create(data.toEntity());
  }

  @Put('/', { description: '编辑' })
  async edit(@Body(ALL) data: RoleDTO) {
    const role = await this.roleService.getById(data.id);
    // update
    return await this.roleService.edit(role);
  }

  @Del('/:id', { description: '删除' })
  async remove(@Param('id') id: string) {
    const role = await this.roleService.getById(id);
    await this.roleService.remove(role);
  }

  @Get('/:id', { description: '根据id查询' })
  async getById(@Param('id') id: string) {
    return await this.roleService.getById(id);
  }

  @Get('/page', { description: '分页查询' })
  async page(@Query('page') page: number, @Query('size') size: number) {
    return await this.roleService.page(page, size);
  }

  @Get('/list', { description: '查询全部' })
  async list() {
    return await this.roleService.list();
  }
}
