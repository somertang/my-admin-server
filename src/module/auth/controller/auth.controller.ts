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
  async refreshToken(@Body(ALL) refreshData: RefreshDTO) {
    return await this.authService.refreshToken(refreshData);
  }

  @Get('/current/user', { description: '获取当前登录用户信息' })
  async currentUser() {
    const user = await this.userService.getById(this.ctx.userInfo.userId);
    return user.toVO();
  }
}
