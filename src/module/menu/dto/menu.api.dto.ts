import { BaseDTO } from '@/common/base.dto';
import { MenuApiEntity } from '@/module/menu/entity/menu.api.entity';
import { requiredString } from '@/common/common.validate.rules';
import { Rule } from '@midwayjs/validate';
import { R } from '@/common/base.error';

export class MenuApiDto extends BaseDTO<MenuApiEntity> {
  @Rule(requiredString.error(R.validateError('menu_id不能为空')))
  menu_id?: string;
  // @Rule(RuleType.array())
  // interface_infos: ApiDTO[];
}
