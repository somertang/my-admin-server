import { PageDTO } from '@/common/page.dto';
import { Rule } from '@midwayjs/validate';
import { ApiProperty } from '@midwayjs/swagger';
import { string } from '@/common/common.validate.rules';

export class RolePageDto extends PageDTO {
  @ApiProperty()
  @Rule(string.allow(null, ''))
  code?: string;
  @ApiProperty()
  @Rule(string.allow(null, ''))
  name?: string;
}
