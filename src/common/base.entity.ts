import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class BaseEntity {
  @PrimaryColumn()
  id: string;
  @Column({
    default: 'admin',
    name: 'created_by',
    comment: '创建人',
  })
  createdBy: string;
  @CreateDateColumn({
    name: 'created_date',
    comment: '创建时间',
  })
  createdDate: Date;
  @Column({
    default: 'admin',
    name: 'last_update_by',
    comment: '最后更新人',
  })
  lastUpdateBy: string;
  @UpdateDateColumn({
    name: 'last_update_date',
    comment: '最后更新时间',
  })
  lastUpdateDate: Date;
  @VersionColumn({
    default: 0,
    name: 'object_version_number',
    comment: '版本号',
  })
  objectVersionNumber: number;
}
