import { ILogger, Inject, Provide } from '@midwayjs/core';
import { UserEntity } from '../entity/user.entity';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
// import { omit } from 'lodash';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { BaseService } from '@/common/base.service';
import { R } from '@/common/base.error';
import { omit } from 'lodash';
import { UserVO } from '@/module/user/vo/user.vo';
import { FileEntity } from '@/module/file/entity/file.entity';
import { RedisService } from '@midwayjs/redis';
import { MailService } from '@/common/mail.service';
import { UserDto } from '@/module/user/dto/user.dto';
import { uuid } from '@/utils/uuid';

@Provide()
export class UserService extends BaseService<UserEntity> {
  @InjectEntityModel(UserEntity)
  userModal: Repository<UserEntity>;

  @InjectEntityModel(FileEntity)
  fileModal: Repository<FileEntity>;

  @InjectDataSource()
  defaultDataSource: DataSource;

  @Inject()
  redisService: RedisService;

  @Inject()
  mailService: MailService;

  @Inject()
  logger: ILogger;

  getModel(): Repository<UserEntity> {
    return this.userModal;
  }

  /**
   * 创建用户
   * @param userDto
   */
  async createUser(userDto: UserDto) {
    const entity = userDto.toEntity();
    const { userName, userEmail, userMobile } = userDto;
    let isExist = (await this.userModal.countBy({ userName })) > 0;
    if (isExist) {
      throw R.error('当前用户名已存在');
    }
    isExist = (await this.userModal.countBy({ userMobile })) > 0;
    if (isExist) {
      throw R.error('当前手机号码已存在');
    }
    isExist = (await this.userModal.countBy({ userEmail })) > 0;
    if (isExist) {
      throw R.error('当前邮箱地址已存在');
    }

    const emailCaptcha = await this.redisService.get(
      `emailCaptcha:${userEmail}`
    );

    if (emailCaptcha !== userDto.emailCaptcha) {
      throw R.error('邮箱验证码错误或已生效');
    }

    // 随机生成密码，并发送到对应的邮箱中。
    const password = uuid();

    // 添加用户，对密码进行加盐加密
    entity.userPassword = bcrypt.hashSync(password, 10);

    await this.defaultDataSource.transaction(async entityManager => {
      await entityManager.save(UserEntity, entity);

      if (entity.userAvatar) {
        await entityManager
          .createQueryBuilder()
          .update(FileEntity)
          .set({
            pkValue: entity.id,
            pkName: 'my_user&user_avatar',
          })
          .where('id = :id', { id: entity.userAvatar })
          .execute();
      }

      await this.mailService.sendMail({
        to: userEmail,
        subject: 'my-admin平台账号创建成功',
        html: `<div>
        <p><span style="color:#5867dd;">${userDto.nickName}</span>，你的账号已开通成功</p>
        <p>登录地址：<a href="https://myadmin.cn/user/login">https://myadmin.cn/user/login</a></p>
        <p>登录账号：${userEmail}</p>
        <p>登录密码：${password}</p>
        </div>`,
      });
    });

    // 把entity中的password移除返回给前端
    return omit(entity, ['userPassword']) as UserVO;
  }

  async editUser(entity: UserEntity): Promise<UserVO> {
    const { userName, userEmail, userMobile, id } = entity;
    let user = await this.userModal.findOneBy({ userName });
    if (user && user.id !== id) {
      throw R.error('当前用户名已存在');
    }
    user = await this.userModal.findOneBy({ userMobile });
    if (user && user.id !== id) {
      throw R.error('当前手机号码已存在');
    }
    user = await this.userModal.findOneBy({ userEmail });
    if (user && user.id !== id) {
      throw R.error('当前邮箱地址已存在');
    }

    const fileRecord = await this.fileModal.findOneBy({
      pkValue: entity.userAvatar,
      pkName: 'my_user&user_avatar',
    });

    await this.defaultDataSource.transaction(async entityManager => {
      if (fileRecord && !entity.userAvatar) {
        await this.fileModal.remove(fileRecord);
      } else if (
        fileRecord &&
        entity.userAvatar &&
        fileRecord.id !== entity.userAvatar
      ) {
        await Promise.all([
          entityManager.delete(FileEntity, fileRecord.id),
          entityManager
            .createQueryBuilder()
            .update(FileEntity)
            .set({
              pkValue: fileRecord.id,
              pkName: 'my_user&user_avatar',
            })
            .where('id = :id', { id: entity.userAvatar })
            .execute(),
        ]);
      } else if (!fileRecord && entity.userAvatar) {
        await entityManager
          .createQueryBuilder()
          .update(FileEntity)
          .set({
            pkValue: entity.id,
            pkName: 'my_user&user_avatar',
          })
          .where('id = :id', { id: entity.userAvatar })
          .execute();
      }
    });

    await this.userModal.save(entity);
    // 把entity中的password移除返回给前端
    return omit(entity, ['userPassword']) as UserVO;
  }

  async pageUser<T>(page = 0, pageSize = 10, where?: FindOptionsWhere<T>) {
    this.logger.info(
      this.userModal
        .createQueryBuilder('t')
        .leftJoinAndMapOne(
          't.avatarEntity',
          FileEntity,
          'f',
          'f.pk_value = t.id and f.pk_name = "my_user&user_avatar"'
        )
        .where(where)
        .orderBy('t.created_date', 'DESC')
        .skip(page * pageSize)
        .take(pageSize)
        .getSql(),
      'ddd'
    );

    const [data, total] = await this.userModal
      .createQueryBuilder('t')
      .leftJoinAndMapOne(
        't.avatarEntity',
        FileEntity,
        'f',
        'f.pk_value = t.id and f.pk_name = "my_user&user_avatar"'
      )
      .where(where)
      .offset(page * pageSize)
      .limit(pageSize)
      .orderBy('t.created_date', 'DESC')
      .getManyAndCount();

    this.logger.info(data, 'ss');

    return {
      data: data.map(item => item.toVO()),
      total,
    };
  }

  async getByEmail(email: string) {
    return await this.userModal.findOneBy({ userEmail: email });
  }
}
