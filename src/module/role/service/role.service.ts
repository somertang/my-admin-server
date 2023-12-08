import { Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@/common/base.service';
import { RoleEntity } from '../entity/role.entity';

@Provide()
export class RoleService extends BaseService<RoleEntity> {
  @InjectEntityModel(RoleEntity)
  roleModel: Repository<RoleEntity>;

  getModel(): Repository<RoleEntity> {
    return this.roleModel;
  }
}
