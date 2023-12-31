import { Provide } from '@midwayjs/decorator';
import { DataSource, In, Repository } from 'typeorm';
import { UserEntity } from '@/module/user/entity/user.entity';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { TokenConfig } from '@/interface/token.config';
import { Config, Inject } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';
import { LoginDTO } from '@/module/auth/dto/login.dto';
import { TokenVo } from '@/module/auth/vo/token.vo';
import { R } from '@/common/base.error';
import * as bcrypt from 'bcryptjs';
import * as NodeRSA from 'node-rsa';
import { uuid } from '@/utils/uuid';
import { RefreshDTO } from '../dto/refresh.dto';
import { ResetPasswordDTO } from '@/module/auth/dto/reset.password';
import { UserRoleEntity } from '@/module/user/entity/user.role.entity';
import { RoleMenuEntity } from '@/module/role/entity/role.menu.entity';
import { FileEntity } from '@/module/file/entity/file.entity';
import { RoleEntity } from '@/module/role/entity/role.entity';
import { MenuEntity } from '@/module/menu/entity/menu.entity';

@Provide()
export class AuthService {
  @InjectEntityModel(UserEntity)
  userModal: Repository<UserEntity>;

  @InjectEntityModel(UserRoleEntity)
  userRoleModal: Repository<UserRoleEntity>;

  @InjectEntityModel(RoleMenuEntity)
  roleMenuModel: Repository<RoleMenuEntity>;

  @InjectEntityModel(MenuEntity)
  menuModel: Repository<MenuEntity>;

  @Config('token')
  tokenConfig: TokenConfig;

  @Inject()
  redisService: RedisService;

  @InjectDataSource()
  defaultDataSource: DataSource;

  /**
   * “login”函数接收包含帐号和密码的“LoginDTO”对象，从数据库中检索相应的用户，使用私钥解密密码，将其与用户存储的密码进行比较，生成令牌和刷新令牌，并在返回“TokenVo”对象之前将它们存储在
   * Redis 中。
   * @param {LoginDTO} loginDto - {
   * @returns 解析为 TokenVo 对象的 Promise。
   */
  async login(loginDto: LoginDTO): Promise<TokenVo> {
    const { accountNumber } = loginDto;
    const user = await this.userModal
      .createQueryBuilder('user')
      .where('user.userMobile = :accountNumber', { accountNumber })
      .orWhere('user.userName = :accountNumber', { accountNumber })
      .orWhere('user.userEmail = :accountNumber', { accountNumber })
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
      .sadd(`userToken_${user.id}`, token)
      .sadd(`userRefreshToken_${user.id}`, refreshToken)
      .exec();

    return {
      expire,
      token,
      refreshExpire,
      refreshToken,
    } as TokenVo;
  }

  async refreshToken(refreshDto: RefreshDTO): Promise<TokenVo> {
    const userId = await this.redisService.get(
      `refreshToken${refreshDto.refreshToken}`
    );

    if (!userId) {
      throw R.error('刷新 token 失败');
    }

    /* `const {expire} = this.tokenConfig;` 行使用对象解构从 `tokenConfig` 对象中提取 `expire` 属性。 */
    const { expire } = this.tokenConfig;

    const token = uuid();

    await this.redisService
      .multi()
      .set(`token${token}`, userId)
      .expire(`token${token}`, expire)
      .exec();

    const refreshExpire = await this.redisService.ttl(
      `refreshToken${refreshDto.refreshToken}`
    );

    return {
      token,
      expire,
      refreshToken: refreshDto.refreshToken,
      refreshExpire,
    };
  }

  async resetPassword(resetPasswordDTO: ResetPasswordDTO) {
    const captcha = await this.redisService.get(
      `resetPasswordEmailCaptcha:${resetPasswordDTO.email}`
    );

    if (captcha !== resetPasswordDTO.emailCaptcha) {
      throw R.error('邮箱验证码错误或已失效');
    }

    const user = await this.userModal.findOneBy({
      userEmail: resetPasswordDTO.email,
    });

    if (!user) {
      throw R.error('邮箱不存在');
    }

    const privateKey = await this.redisService.get(
      `publicKey:${resetPasswordDTO.publicKey}`
    );

    await this.redisService.del(`publicKey:${resetPasswordDTO.publicKey}`);

    if (!privateKey) {
      throw R.error('解密私钥错误或已失效');
    }

    const decrypt = new NodeRSA(privateKey);
    decrypt.setOptions({ encryptionScheme: 'pkcs1' });
    const password = decrypt.decrypt(resetPasswordDTO.password, 'utf8');

    // 获取当前用户颁发的token和refreshToken，然后再下面给移除掉。
    const tokens = await this.redisService.smembers(`userToken_${user.id}`);
    const refreshTokens = await this.redisService.smembers(
      `userRefreshToken_${user.id}`
    );

    await this.defaultDataSource.transaction(async manager => {
      user.userPassword = bcrypt.hashSync(password, 10);
      await manager.save(UserEntity, user);

      await Promise.all([
        ...tokens.map(token => this.redisService.del(`token:${token}`)),
        ...refreshTokens.map(refreshToken =>
          this.redisService.del(`refreshToken:${refreshToken}`)
        ),
        this.redisService.del(
          `resetPasswordEmailCaptcha:${resetPasswordDTO.email}`
        ),
      ]);
    });
  }

  async getUserById(userId: string) {
    const entity = await this.userModal
      .createQueryBuilder('t')
      .leftJoinAndSelect(UserRoleEntity, 'userRole', 't.id = userRole.user_id')
      .leftJoinAndMapOne(
        't.avatarEntity',
        FileEntity,
        'file',
        'file.pk_value = t.id and file.pk_name = "my_user&user_avatar"'
      )
      .leftJoinAndMapMany(
        't.roles',
        RoleEntity,
        'role',
        'role.id = userRole.role_id'
      )
      .where('t.id = :id', { id: userId })
      .getOne();

    if (!entity) {
      throw R.error('当前用户不存在！');
    }

    // 先把用户分配的角色查出来
    const userRoles = await this.userRoleModal.findBy({ userId: userId });
    // 根据已分配角色查询已分配的菜单id数组
    const roleMenus = await this.roleMenuModel.find({
      where: { roleId: In(userRoles.map(userRole => userRole.roleId)) },
    });
    // 根据菜单id数组查询菜单信息，这里加了个特殊判断，如果是管理员直接返回全部菜单，正常这个应该走数据迁移，数据迁移还没做，就先用这种方案。
    const query = { id: In(roleMenus.map(roleMenu => roleMenu.menuId)) };
    const menus = await this.menuModel.find({
      where: userId === '1' ? {} : query,
      order: { orderNumber: 'ASC', createdDate: 'DESC' },
    });

    return {
      ...entity.toVO(),
      menus,
    };
  }
}
