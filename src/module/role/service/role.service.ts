import { Provide } from '@midwayjs/decorator';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseService } from '@/common/base.service';
import { RoleEntity } from '../entity/role.entity';
import { RoleDTO } from '@/module/role/dto/role.dto';
import { R } from '@/common/base.error';
import { RoleMenuEntity } from '@/module/role/entity/role.menu.entity';
import {
  createQueryBuilder,
  likeQueryByQueryBuilder,
} from '@/utils/typeorm.utils';
import { RolePageDto } from '@/module/role/dto/role.page.dto';

@Provide()
export class RoleService extends BaseService<RoleEntity> {
  @InjectEntityModel(RoleEntity)
  roleModel: Repository<RoleEntity>;

  @InjectEntityModel(RoleMenuEntity)
  roleMenuModel: Repository<RoleMenuEntity>;

  @InjectDataSource()
  defaultDataSource: DataSource;

  getModel(): Repository<RoleEntity> {
    return this.roleModel;
  }

  async createRole(roleDto: RoleDTO) {
    if ((await this.roleModel.countBy({ code: roleDto.code })) > 0) {
      throw R.error('角色编码不能重复');
    }
    await this.defaultDataSource.transaction(async entityManager => {
      const entity = roleDto.toEntity();
      await entityManager.save(RoleEntity, entity);
      const roleMenus = roleDto.menuIds.map(item => {
        const roleMenuEntity = new RoleMenuEntity();
        roleMenuEntity.menuId = item;
        roleMenuEntity.roleId = entity.id;
        return roleMenuEntity;
      });
      if (roleMenus.length === 0) {
        return;
      }
      await entityManager
        .createQueryBuilder()
        .insert()
        .into(RoleMenuEntity)
        .values(roleMenus)
        .execute();
    });
  }

  async editRole(roleDto: RoleDTO) {
    await this.defaultDataSource.transaction(async entityManager => {
      const entity = roleDto.toEntity();
      await entityManager.save(RoleEntity, entity);
      if (Array.isArray(roleDto.menuIds)) {
        await entityManager
          .createQueryBuilder()
          .delete()
          .from(RoleMenuEntity)
          .where('roleId := id', { id: roleDto.id })
          .execute();

        const roleMenus = roleDto.menuIds.map(item => {
          const roleMenuEntity = new RoleMenuEntity();
          roleMenuEntity.menuId = item;
          roleMenuEntity.roleId = entity.id;
          return roleMenuEntity;
        });

        if (roleMenus.length) {
          await entityManager
            .createQueryBuilder()
            .insert()
            .into(RoleMenuEntity)
            .values(roleMenus)
            .execute();
        }
      }
    });
  }

  async removeRole(id: string) {
    await this.defaultDataSource.transaction(async entityManager => {
      await entityManager
        .createQueryBuilder()
        .delete()
        .from(RoleEntity)
        .where('id := roleId', { roleId: id })
        .execute();

      await entityManager
        .createQueryBuilder()
        .delete()
        .from(RoleMenuEntity)
        .where('roleId := id', { id })
        .execute();
    });
  }

  async getRoleListByPage(rolePageDTO: RolePageDto) {
    const { name, code, page, size } = rolePageDTO;
    let queryBuilder = createQueryBuilder<RoleEntity>(this.roleModel);
    queryBuilder = likeQueryByQueryBuilder(queryBuilder, {
      code,
      name,
    });

    const [data, total] = await queryBuilder
      .orderBy('created_date', 'DESC')
      .skip(page * size)
      .take(size)
      .getManyAndCount();

    return {
      total,
      data,
    };
  }

  async getMenusByRoleId(roleId: string) {
    return await this.roleMenuModel.find({
      where: { roleId: roleId },
    });
  }

  async allocMenu(roleId: string, menuIds: string[]) {
    const curRoleMenus = await this.roleMenuModel.findBy({
      roleId,
    });

    const roleMenus = [];
    menuIds.forEach((menuId: string) => {
      const roleMenu = new RoleMenuEntity();
      roleMenu.menuId = menuId;
      roleMenu.roleId = roleId;
      roleMenus.push(roleMenu);
    });

    await this.defaultDataSource.transaction(async transaction => {
      await Promise.all([transaction.remove(RoleMenuEntity, curRoleMenus)]);
      await Promise.all([transaction.save(RoleMenuEntity, roleMenus)]);
    });
  }
}
