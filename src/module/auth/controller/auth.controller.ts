import { Controller, Get, Inject, Provide } from '@midwayjs/decorator';
import { AuthService } from '../service/auth.service';
import { CaptchaService } from '@/module/auth/service/captcha.service';
import { RedisService } from '@midwayjs/redis';
import { ALL, Body, Post } from '@midwayjs/core';
import { LoginDTO } from '@/module/auth/dto/login.dto';
import { ApiResponse } from '@midwayjs/swagger';
import { TokenVo } from '@/module/auth/vo/token.vo';
import { R } from '@/common/base.error';
import * as NodeRS from 'node-rsa';
import { RefreshDTO } from '../dto/refresh.dto';
import { NotLogin } from '@/decorator/no.login.decorator';
import { Context } from '@midwayjs/koa';
import { UserService } from '@/module/user/service/user.service';
import { MailService } from '@/common/mail.service';
import { uuid } from '@/utils/uuid';
import { ResetPasswordDTO } from '@/module/auth/dto/reset.password';

@Provide()
@Controller('/auth')
export class AuthController {
  @Inject()
  authService: AuthService;

  @Inject()
  captchaService: CaptchaService;

  @Inject()
  redisService: RedisService;

  @Inject()
  userService: UserService;

  @Inject()
  mailService: MailService;

  @Inject()
  ctx: Context;

  @Get('/captcha', { description: '获取验证码' })
  @NotLogin()
  async getImageCaptcha() {
    const { id, imageBase64 } = await this.captchaService.formula({
      height: 40,
      width: 120,
      noise: 1,
      color: true,
    });
    return { id, imageBase64 };
  }

  @Post('/login', { description: '登录' })
  @ApiResponse({ type: TokenVo })
  @NotLogin()
  async login(@Body(ALL) loginDto: LoginDTO) {
    const { captcha, captchaId } = loginDto;

    const result = await this.captchaService.check(captchaId, captcha);

    if (!result) {
      throw R.error('验证码错误');
    }

    return await this.authService.login(loginDto);
  }

  @Post('/logout')
  async logout() {
    // 清除token 和 refreshToken
    const result = await this.redisService
      .multi()
      .del(`token${this.ctx.token}`)
      .del(`refresh${this.ctx.userInfo.refreshToken}`)
      .exec();
    if (result.some(item => item[0])) {
      throw R.error('退出登录异常，请重试');
    }
    return true;
  }

  @Get('/public-key', { description: '获取公钥' })
  @NotLogin()
  async getPublicKey() {
    const key = new NodeRS({ b: 512 });
    const publicKey = key.exportKey('public');
    const privateKey = key.exportKey('private');
    this.redisService.set(`publicKey:${publicKey}`, privateKey);
    return publicKey;
  }

  @Post('/refresh/token', { description: '刷新token' })
  @NotLogin()
  async refreshToken(@Body(ALL) refreshData: RefreshDTO) {
    return await this.authService.refreshToken(refreshData);
  }

  @Get('/current/user', { description: '获取当前登录用户信息' })
  async currentUser() {
    const user = await this.userService.getById(this.ctx.userInfo.userId);
    return user.toVO();
  }

  @Post('/send/reset/password/email')
  @NotLogin()
  async sendResetPasswordEmail(@Body() emailInfo: { email: string }) {
    if (!emailInfo.email) {
      throw R.error('邮箱不能为空');
    }

    if (!(await this.userService.getByEmail(emailInfo.email))) {
      throw R.error('系统中不存在当前邮箱');
    }

    const emailCaptcha = uuid();

    await this.redisService.set(
      `resetPasswordEmailCaptcha:${emailInfo.email}`,
      emailCaptcha,
      'EX',
      60 * 30
    );

    const resetPasswordUrl = `http://localhost:5173/reset-password?email=${emailInfo.email}&emailCaptcha=${emailCaptcha}`;

    await this.mailService.sendMail({
      to: emailInfo.email,
      html: `<div style="padding: 28px 0; color: #888;">
      <h1 style="color: #888;">
        <span style="color:#5867dd; margin:0 1px;"><a>${emailInfo.email}</a></span>， 你好！
      </h1>
      <p>请先确认本邮件是否是你需要的。</p>
      <p>请点击下面的地址，根据提示进行密码重置：</p>
      <a href="${resetPasswordUrl}" target="_blank" style="text-decoration: none;
      display: inline-block;
      padding: 8px 25px;
      background: #5867dd;
      cursor: pointer;
      color: #fff;
      border-radius: 5px;" rel="noopener">点击跳转到密码重置页面</a>
      <p>如果单击上面按钮没有反应，请复制下面链接到浏览器窗口中，或直接输入链接。</p>
      <p>
        ${resetPasswordUrl}
      </p>
      <p>如您未提交该申请，请不要理会此邮件，对此为您带来的不便深表歉意。</p>
      <p>本次链接30分钟后失效。</p>
      <div style="text-align: right;margin-top: 50px;">
        <span>fluxy-admin</span>
      </div>
    </div>`,
      subject: 'my-admin平台密码重置提醒',
    });
  }

  @NotLogin()
  @Post('/reset/password')
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDTO) {
    await this.authService.resetPassword(resetPasswordDTO);
  }
}
