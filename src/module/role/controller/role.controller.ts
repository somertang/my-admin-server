import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Provide,
  Query,
  Put,
  Param,
  Del,
} from '@midwayjs/decorator';
import { RoleDTO } from '../dto/role.dto';
import { RoleService } from '../service/role.service';
import { RoleMenuDto } from '@/module/role/dto/role.menu.dto';
import { RolePageDto } from '@/module/role/dto/role.page.dto';
import { R } from '@/common/base.error';

@Provide()
@Controller('/role')
export class RoleController {
  @Inject()
  roleService: RoleService;

  @Post('/', { description: '创建角色' })
  async create(@Body() data: RoleDTO) {
    return await this.roleService.createRole(data);
  }

  @Put('/', { description: '更新角色' })
  async update(@Body() data: RoleDTO) {
    return await this.roleService.editRole(data);
  }

  @Del('/:id', { description: '删除角色' })
  async remove(
    @Param('id')
    id: string
  ) {
    if (!id) {
      throw R.validateError('id不能为空');
    }
    return await this.roleService.removeRole(id);
  }

  @Get('/page', { description: '分页获取角色列表' })
  async page(@Query() rolePageDTO: RolePageDto) {
    return await this.roleService.getRoleListByPage(rolePageDTO);
  }

  @Post('/alloc/menu', { description: '角色分配菜单' })
  async allocMenu(@Body() roleMenuDTO: RoleMenuDto) {
    return await this.roleService.allocMenu(
      roleMenuDTO.roleId,
      roleMenuDTO.menuIds
    );
  }

  @Get('/list', { description: '获取角色列表' })
  async list() {
    return await this.roleService.list();
  }

  @Get('/menu/list', { description: '根据角色id获取菜单列表' })
  async getMenusByRoleId(@Query('id') id: string) {
    return (await this.roleService.getMenusByRoleId(id)).map(o => o.menuId);
  }
}
