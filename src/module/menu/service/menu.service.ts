import { Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  IsNull,
  Repository,
} from 'typeorm';
import { BaseService } from '@/common/base.service';
import { MenuEntity } from '../entity/menu.entity';
import { MenuApiEntity } from '@/module/menu/entity/menu.api.entity';
import { MenuDTO } from '@/module/menu/dto/menu.dto';
import { R } from '@/common/base.error';
import { ILogger, Inject } from '@midwayjs/core';

@Provide()
export class MenuService extends BaseService<MenuEntity> {
  @InjectEntityModel(MenuEntity)
  menuModel: Repository<MenuEntity>;

  @InjectEntityModel(MenuApiEntity)
  menuApiModal: Repository<MenuApiEntity>;

  @Inject()
  logger: ILogger;

  getModel(): Repository<MenuEntity> {
    return this.menuModel;
  }

  /**
   * 创建菜单
   * @param data
   */
  async createMenu(data: MenuDTO) {
    if ((await this.menuModel.countBy({ route: data.route })) > 0) {
      throw R.error('路由不能重复');
    }

    return await this.create(data.toEntity());
  }

  /**
   * 菜单分页查询接口
   * @param page
   * @param pageSize
   * @param where
   */
  async page(
    page: number,
    pageSize: number,
    where?: FindOptionsWhere<MenuEntity>
  ) {
    if (where) {
      where.parentId = IsNull();
    } else {
      where = { parentId: IsNull() };
    }

    const order: FindOptionsOrder<MenuEntity> = { orderNumber: 'ASC' };

    const [data, total] = await this.menuModel.findAndCount({
      where,
      order,
      skip: page * pageSize,
      take: pageSize,
    });

    if (!data.length) return { data: [], total: 0 };

    const ids = data.map((o: MenuEntity) => o.id);
    const countMap = await this.menuModel
      .createQueryBuilder('menu')
      .select('COUNT(menu.parentId)', 'count')
      .addSelect('menu.parentId', 'id')
      .where('menu.parentId IN (:...ids)', { ids })
      .groupBy('menu.parentId')
      .getRawMany();

    const result = data.map((item: MenuEntity) => {
      const count =
        countMap.find((o: { id: string; count: number }) => o.id === item.id)
          ?.count || 0;

      return {
        ...item,
        hasChild: Number(count) > 0,
      };
    });

    return { data: result, total };
  }

  /**
   * 获取子菜单
   * @param parentId
   */
  async getChildren(parentId?: string) {
    if (!parentId) {
      throw R.validateError('父节点id不能为空');
    }
    const data = await this.menuModel.find({
      where: { parentId: parentId },
      order: { orderNumber: 'ASC' },
    });
    if (!data.length) return [];

    const ids = data.map((o: any) => o.id);

    const countMap = await this.menuModel
      .createQueryBuilder('menu')
      .select('COUNT(menu.parent_id)', 'count')
      .addSelect('menu.parent_id', 'id')
      .where('menu.parent_id IN (:...ids)', { ids })
      .groupBy('menu.parent_id')
      .getRawMany();
    this.logger.info(countMap, 'countMap');

    const result = data.map((item: any) => {
      const count = countMap.find(o => o.id === item.id)?.count || 0;
      return {
        ...item,
        hasChild: Number(count) > 0,
      };
    });

    return result;
  }

  /**
   * 删除菜单
   * @param id
   */
  async removeMenu(id: string) {
    await this.menuModel
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .orWhere('parentId = :id', { id })
      .execute();
  }
}
