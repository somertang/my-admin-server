import { BaseEntity } from '@/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('my_role_menu')
export class RoleMenuEntity extends BaseEntity {
  @Column({ comment: '角色id' })
  roleId?: string;
  @Column({ comment: '菜单id' })
  menuId?: string;
}
