import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/base.entity';

@Entity('my_menu')
export class MenuEntity extends BaseEntity {
  @Column({ name: 'parent_id', comment: '上级id', nullable: true })
  parentId?: string;
  @Column({ name: 'name', comment: '名称' })
  name?: string;
  @Column({ name: 'icon', comment: '图标', nullable: true })
  icon?: string;
  @Column({ name: 'type', comment: '类型，1:目录 2:菜单' })
  type?: number;
  @Column({ name: 'route', comment: '路由' })
  route?: string;
  @Column({ name: 'file_path', comment: '本地组件地址', nullable: true })
  filePath?: string;
  @Column({ name: 'order_number', comment: '排序号' })
  orderNumber?: number;
  @Column({ name: 'url', comment: 'url', nullable: true })
  url?: string;
  @Column({ name: 'enable', comment: '是否在菜单中显示', default: 0 })
  enable?: boolean;
}
