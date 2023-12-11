import { Rule, RuleType } from '@midwayjs/validate';
import { ApiProperty } from '@midwayjs/swagger';
import { email, phone, requiredString } from '@/common/common.validate.rules';
import { R } from '@/common/base.error';
import { BaseDTO } from '@/common/base.dto';
import { UserEntity } from '@/module/user/entity/user.entity';

export class UserDto extends BaseDTO<UserEntity> {
  @ApiProperty({ description: '用户名' })
  @Rule(requiredString.error(R.validateError('用户名称不能为空'))) // username不能为空，并且是数字
  userName: string;

  @ApiProperty({ description: '用户昵称' })
  @Rule(requiredString.error(R.validateError('用户昵称不能为空')))
  nickName: string;

  @ApiProperty({ description: '手机号码' })
  @Rule(phone.error(R.validateError('无效的手机号码格式')))
  userMobile: string;

  @ApiProperty({ description: '邮箱地址' })
  @Rule(email.error(R.validateError('无效的邮箱地址')))
  userEmail: string;

  @ApiProperty({ description: '头像', nullable: true })
  userAvatar?: string;

  @ApiProperty({ description: '个人描述', nullable: true })
  userDesc?: string;

  @ApiProperty({ description: '性别' })
  @Rule(RuleType.number())
  sex?: number;

  @ApiProperty({ description: '邮箱验证码' })
  @Rule(RuleType.string())
  emailCaptcha?: string;

  @Rule(RuleType.array().items(RuleType.string()))
  roleIds?: string[];
}
