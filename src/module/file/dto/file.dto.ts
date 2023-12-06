import { Rule } from '@midwayjs/validate';
import { ApiProperty } from '@midwayjs/swagger';
import { R } from '@/common/base.error';
import { requiredString } from '@/common/common.validate.rules';
import { FileEntity } from '../entity/file.entity';
import { BaseDTO } from '@/common/base.dto';

export class FileDTO extends BaseDTO<FileEntity> {
  @ApiProperty({
    description: '代码',
  })
  @Rule(requiredString.error(R.validateError('代码不能为空')))
  code?: string;
  @ApiProperty({
    description: '名称',
  })
  @Rule(requiredString.error(R.validateError('名称不能为空')))
  name?: string;
}
