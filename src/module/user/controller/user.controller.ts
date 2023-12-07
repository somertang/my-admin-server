import {
  ALL,
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@midwayjs/core';
import { UserService } from '../service/user.service';
import { UserDto } from '../dto/user.dto';
import { PageDTO } from '@/common/page.dto';
import { UserEntity } from '@/module/user/entity/user.entity';
import { FindOptionsWhere } from 'typeorm';
import { MailService } from '@/common/mail.service';
import { R } from '@/common/base.error';
import { generateRandomCode } from '@/utils/uuid';
import { RedisService } from '@midwayjs/redis';

@Controller('/user')
export class UserController {
  @Inject()
  userService: UserService;

  @Inject()
  mailService: MailService;

  @Inject()
  redisService: RedisService;

  @Post('/create')
  async createUser(@Body(ALL) user: UserDto) {
    return await this.userService.createUser(user);
  }

  @Get('/page')
  async page(@Query() pageParam: PageDTO) {
    const query: FindOptionsWhere<UserEntity> = {};
    return await this.userService.pageUser<UserEntity>(
      pageParam.page,
      pageParam.size,
      query
    );
  }

  @Put('/update')
  async updateUser(@Body(ALL) userParam: UserDto) {
    console.log(userParam.toEntity(), 'ss');
    return await this.userService.editUser(userParam.toEntity());
  }

  @Del('/delete/:id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.userService.getById(id);
    return await this.userService.remove(user);
  }

  @Get('/list')
  async list(@Query() userParam: UserDto) {
    return await this.userService.list(userParam);
  }

  @Post('/send/email/captcha', { description: '发送邮箱验证码' })
  async sendEmailCaptcha(@Body() emailInfo: { email: string }) {
    if (!emailInfo.email) {
      throw R.error('邮箱不能为空');
    }

    // 生成随机4位数
    const emailCaptcha = generateRandomCode();
    // 把生成的随机数存到redis中，后面添加用户的时候需要做验证
    await this.redisService.set(
      `emailCaptcha:${emailInfo.email}`,
      emailCaptcha,
      'EX',
      60 * 30 // 30分钟
    );

    // 这里邮件内容支持html，后面会做一个在线自定义邮件模版功能，就不用写死在代码里了。
    await this.mailService.sendMail({
      to: emailInfo.email,
      html: `<div>
        您本次的验证码是<span style="color:#5867dd;font-weight:800;font-size:24px;">${emailCaptcha}</span>，验证码有效期为30分钟。
      </div>`,
      subject: 'my-admin平台邮箱校验提醒',
    });
  }
}
