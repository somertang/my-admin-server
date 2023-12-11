import { Rule, RuleType } from '@midwayjs/validate';
import { requiredString } from '@/common/common.validate.rules';
import { R } from '@/common/base.error';
import { ApiProperty } from '@midwayjs/swagger';

export class RoleMenuDto {
  @ApiProperty({ description: '角色 id' })
  @Rule(requiredString.error(R.validateError('角色id不能为空')))
  roleId?: string;

  @ApiProperty({ description: '菜单数组' })
  @Rule(RuleType.array().items(RuleType.string()))
  menuIds?: string[];
}
