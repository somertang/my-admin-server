import { BaseEntity } from '@/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('my_user_role')
export class UserRoleEntity extends BaseEntity {
  @Column({ name: 'user_id', comment: '用户id' })
  userId?: string;
  @Column({ name: 'role_id', comment: '角色id' })
  roleId?: string;
}
