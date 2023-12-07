import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/base.entity';

@Entity('my_file')
export class FileEntity extends BaseEntity {
  @Column({ name: 'file_name', comment: '文件名' })
  fileName?: string;
  @Column({ name: 'file_path', comment: '文件路径' })
  filePath?: string;
  @Column({ name: 'pk_name', comment: '外健名称', nullable: true })
  pkName: string;
  @Column({ name: 'pk_value', comment: '外健值', nullable: true })
  pkValue?: string;
}
