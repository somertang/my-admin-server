import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/base.entity';

@Entity('my_menu_api')
export class MenuApiEntity extends BaseEntity {
  @Column({ name: 'menu_id', comment: '菜单id' })
  menuId?: string;
  @Column({ name: 'method', comment: '请求方式' })
  method?: string;
  @Column({ name: 'path', comment: 'path' })
  path?: string;
}
