import { ApiProperty } from '@midwayjs/swagger';
import { Rule, RuleType } from '@midwayjs/validate';

export class RefreshDTO {
  @ApiProperty({ description: '刷新token' })
  @Rule(RuleType.allow(null))
  refreshToken?: string;
}
