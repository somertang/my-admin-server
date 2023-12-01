import { Provide } from '@midwayjs/decorator';
import { Repository } from 'typeorm';
import { UserEntity } from '@/module/user/entity/user.entity';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { TokenConfig } from '@/interface/token.config';
import { Config, Inject } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';
import { LoginDTO } from '@/module/auth/dto/login.dto';
import { TokenVo } from '@/module/auth/vo/token.vo';
import { R } from '@/common/base.error';
import * as bcrypt from 'bcryptjs';
import * as NodeRSA from 'node-rsa';
import { uuid } from '@/utils/uuid';

@Provide()
export class AuthService {
  @InjectEntityModel(UserEntity)
  userModal: Repository<UserEntity>;

  @Config('token')
  tokenConfig: TokenConfig;

  @Inject()
  redisService: RedisService;

  async login(loginDto: LoginDTO): Promise<TokenVo> {
    const { accountNumber } = loginDto;
    const user = await this.userModal
      .createQueryBuilder('user')
      .where('user.userMobile = :accountNumber', { accountNumber })
      .orWhere('user.userName = :accountNumber', { accountNumber })
      .select(['user.userPassword', 'user.id'])
      .getOne();

    if (!user) {
      throw R.error('用户名或密码错误');
    }

    const privateKey = await this.redisService.get(
      `publicKey:${loginDto.publicKey}`
    );
    await this.redisService.del(`publicKey:${loginDto.publicKey}`);

    if (!privateKey) {
      throw R.error('登录出现异常，请重新登录');
    }

    // 解密
    const decrypt = new NodeRSA(privateKey);
    // 因为jsencrypt自身使用的是pkcs1加密方案, nodejs需要修改成pkcs1。
    decrypt.setOptions({ encryptionScheme: 'pkcs1' });
    const password = decrypt.decrypt(loginDto.password, 'utf8');

    if (!password) {
      throw R.error('登录出现异常，请重新登录');
    }

    if (!bcrypt.compareSync(password, user.userPassword)) {
      throw R.error('用户名或密码错误');
    }

    const { expire, refreshExpire } = this.tokenConfig;

    const token = uuid();
    const refreshToken = uuid();

    await this.redisService
      .multi()
      .set(`token${token}`, user.id)
      .expire(`token${token}`, expire)
      .set(`refreshToken${refreshToken}`, user.id)
      .expire(`refreshToken${refreshToken}`, refreshExpire)
      .exec();

    return {
      expire,
      token,
      refreshExpire,
      refreshToken,
    } as TokenVo;
  }
}
